/**
 * VITMATERNA — Proveedor central.
 * Sesión verificada por el servidor + snapshot con cálculos clínicos del
 * servidor + cola de acciones offline que se sincroniza sola al volver la
 * señal. La vista que consumen las pantallas ya incluye los cambios
 * pendientes (optimista), con el servidor como fuente de verdad.
 */
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { api, ApiError } from "@/lib/api";
import { applyOutbox } from "@/lib/outbox";
import {
  cancelAllReminders,
  DEFAULT_REMINDERS,
  ReminderSettings,
  syncReminders,
} from "@/lib/notifications";
import { todayKeyLocal } from "@/lib/format";
import type {
  ActionInput,
  ClientAction,
  LoginResponse,
  PatientView,
  Snapshot,
  SyncResponse,
  User,
} from "@/types";

const SESSION_KEY = "vm_session_v3";
const ARTICLES_KEY = "vm_articles_v1";
const REMINDERS_KEY = "vm_reminders_v1";
const snapKey = (dni: string) => `vm_snap_v3_${dni}`;
const outKey = (dni: string) => `vm_outbox_v3_${dni}`;

interface SessionState {
  token: string;
  user: User;
}

export interface ScheduleParams {
  mode: "cita" | "reprogramar" | "visita";
  patientId?: string;
  appointmentId?: string;
  dateKey: string;
  time: string;
  motivo?: string;
}

export interface CreateUserParams {
  dni: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "gestante" | "obstetra" | "admin";
  phone?: string;
  patient?: {
    age?: number;
    community?: string;
    fumKey?: string;
    hbObserved?: number;
    bpSys?: number;
    bpDia?: number;
    imc?: number;
    gestas?: number;
    cesareas?: number;
    abortos?: number;
  };
}

export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<SessionState | null>(null);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [cached, setCached] = useState<Snapshot | null>(null);
  const [outbox, setOutboxState] = useState<ClientAction[]>([]);
  const [netOnline, setNetOnline] = useState<boolean>(true);
  const [syncOk, setSyncOk] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [readArticles, setReadArticles] = useState<string[]>([]);
  const [reminders, setRemindersInternal] = useState<ReminderSettings>(DEFAULT_REMINDERS);

  const sessionRef = useRef<SessionState | null>(null);
  const outboxRef = useRef<ClientAction[]>([]);

  // ---------- Hidratación inicial ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rawSession, rawArticles, rawReminders] = await Promise.all([
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(ARTICLES_KEY),
          AsyncStorage.getItem(REMINDERS_KEY),
        ]);
        if (rawArticles && !cancelled) setReadArticles(JSON.parse(rawArticles) as string[]);
        if (rawReminders && !cancelled) {
          setRemindersInternal({ ...DEFAULT_REMINDERS, ...(JSON.parse(rawReminders) as ReminderSettings) });
        }
        if (rawSession) {
          const s = JSON.parse(rawSession) as SessionState;
          const [rawSnap, rawOut] = await Promise.all([
            AsyncStorage.getItem(snapKey(s.user.dni)),
            AsyncStorage.getItem(outKey(s.user.dni)),
          ]);
          if (!cancelled) {
            sessionRef.current = s;
            setSession(s);
            if (rawSnap) setCached(JSON.parse(rawSnap) as Snapshot);
            if (rawOut) {
              const o = JSON.parse(rawOut) as ClientAction[];
              outboxRef.current = o;
              setOutboxState(o);
            }
          }
        }
      } catch (e) {
        console.log("[VitMaterna] Error al hidratar:", e);
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Conectividad ----------
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const ok = state.isConnected !== false;
      setNetOnline(ok);
      if (ok) {
        void queryClient.invalidateQueries({ queryKey: ["sync"] });
      }
    });
    return () => unsubscribe();
  }, [queryClient]);

  const persistOutbox = useCallback((dni: string, next: ClientAction[]) => {
    outboxRef.current = next;
    setOutboxState(next);
    AsyncStorage.setItem(outKey(dni), JSON.stringify(next)).catch(() => {});
  }, []);

  const persistSnapshot = useCallback((dni: string, snapshot: Snapshot) => {
    setCached(snapshot);
    AsyncStorage.setItem(snapKey(dni), JSON.stringify(snapshot)).catch(() => {});
  }, []);

  // ---------- Sesión ----------

  const performLogout = useCallback((notice?: string) => {
    const dni = sessionRef.current?.user.dni;
    sessionRef.current = null;
    outboxRef.current = [];
    setSession(null);
    setCached(null);
    setOutboxState([]);
    setSyncOk(false);
    setAuthNotice(notice ?? null);
    cancelAllReminders().catch(() => {});
    const keys = [SESSION_KEY, ...(dni ? [snapKey(dni), outKey(dni)] : [])];
    AsyncStorage.multiRemove(keys).catch(() => {});
  }, []);

  const login = useCallback(async (dni: string, password: string): Promise<User> => {
    const res = await api<LoginResponse>("/api/login", { body: { dni, password } });
    const s: SessionState = { token: res.token, user: res.user };
    sessionRef.current = s;
    outboxRef.current = [];
    setSession(s);
    setCached(res.snapshot);
    setOutboxState([]);
    setAuthNotice(null);
    setSyncOk(true);
    await AsyncStorage.multiSet([
      [SESSION_KEY, JSON.stringify(s)],
      [snapKey(res.user.dni), JSON.stringify(res.snapshot)],
      [outKey(res.user.dni), "[]"],
    ]).catch(() => {});
    return res.user;
  }, []);

  // ---------- Sincronización (cola offline + tiempo casi real) ----------

  useQuery({
    queryKey: ["sync", session?.token ?? "none"],
    enabled: hydrated && session !== null,
    refetchInterval: 4000,
    retry: false,
    gcTime: 60_000,
    queryFn: async (): Promise<Snapshot> => {
      const s = sessionRef.current;
      if (!s) throw new ApiError("Sin sesión", 0);
      const pending = [...outboxRef.current];
      try {
        const res = await api<SyncResponse>("/api/sync", {
          token: s.token,
          body: { actions: pending },
        });
        const acked = new Set(res.results.map((r) => r.id));
        const rejected = res.results.filter((r) => !r.ok);
        if (rejected.length > 0) {
          console.log("[VitMaterna] Acciones rechazadas por el servidor:", rejected);
        }
        persistOutbox(s.user.dni, outboxRef.current.filter((a) => !acked.has(a.id)));
        persistSnapshot(s.user.dni, res.snapshot);
        setSyncOk(true);
        return res.snapshot;
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          performLogout("Tu sesión terminó o tu cuenta fue desactivada. Vuelve a iniciar sesión.");
        } else {
          setSyncOk(false);
        }
        throw e;
      }
    },
  });

  /** Encola una acción, la aplica optimistamente y dispara el envío. */
  const dispatch = useCallback(
    (input: ActionInput) => {
      const s = sessionRef.current;
      if (!s) return;
      const action = {
        ...input,
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        atISO: new Date().toISOString(),
      } as ClientAction;
      persistOutbox(s.user.dni, [...outboxRef.current, action]);
      void queryClient.invalidateQueries({ queryKey: ["sync"] });
    },
    [persistOutbox, queryClient],
  );

  // ---------- Operaciones solo-online (validadas por el servidor) ----------

  const runOnline = useCallback(
    async (path: string, body: unknown): Promise<void> => {
      const s = sessionRef.current;
      if (!s) throw new ApiError("Sin sesión", 0);
      const res = await api<{ snapshot: Snapshot }>(path, { token: s.token, body });
      persistSnapshot(s.user.dni, res.snapshot);
      setSyncOk(true);
    },
    [persistSnapshot],
  );

  const schedule = useCallback(
    (params: ScheduleParams) => runOnline("/api/schedule", params),
    [runOnline],
  );
  /** Alta de usuarios: admin crea cualquier rol; la obstetra solo gestantes. */
  const createUser = useCallback(
    (params: CreateUserParams) => runOnline("/api/admin/create-user", params),
    [runOnline],
  );
  const adminSetActive = useCallback(
    (dni: string, active: boolean) => runOnline("/api/admin/set-active", { dni, active }),
    [runOnline],
  );
  const adminReset = useCallback(() => runOnline("/api/admin/reset", {}), [runOnline]);

  /** Sube (o quita con null) la foto de perfil del usuario actual. */
  const setAvatar = useCallback(
    (dataUrl: string | null) => runOnline("/api/user/avatar", { dataUrl }),
    [runOnline],
  );

  // ---------- Vista optimista ----------

  const view = useMemo(() => {
    if (!cached || !session) return null;
    return applyOutbox(cached, outbox, session.user);
  }, [cached, outbox, session]);

  const todayKey = view?.todayKey ?? todayKeyLocal();
  const online = netOnline && syncOk;

  /** Usuario siempre fresco: el snapshot del servidor trae la foto al día. */
  const currentUser = view?.me ?? session?.user ?? null;

  // ---------- Educación (solo cliente, siempre disponible offline) ----------

  const markArticleRead = useCallback((articleId: string) => {
    setReadArticles((prev) => {
      if (prev.includes(articleId)) return prev;
      const next = [...prev, articleId];
      AsyncStorage.setItem(ARTICLES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // ---------- Recordatorios locales ----------

  const setReminders = useCallback((next: ReminderSettings) => {
    setRemindersInternal(next);
    AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const myPatient = useMemo<PatientView | null>(() => {
    if (!view || session?.user.role !== "gestante") return null;
    return view.patients.find((p) => p.id === session.user.patientId) ?? null;
  }, [view, session]);

  const apptId = myPatient?.nextAppointment?.id ?? null;
  const apptDateKey = myPatient?.nextAppointment?.dateKey ?? null;
  const apptTime = myPatient?.nextAppointment?.time ?? null;

  useEffect(() => {
    if (!hydrated || Platform.OS === "web") return;
    if (!session || session.user.role !== "gestante") return;
    syncReminders(
      reminders,
      apptDateKey && apptTime ? { dateKey: apptDateKey, time: apptTime } : null,
    ).catch((e) => console.log("[VitMaterna] recordatorios:", e));
  }, [hydrated, session, reminders, apptId, apptDateKey, apptTime]);

  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  return useMemo(
    () => ({
      hydrated,
      session,
      user: currentUser,
      view,
      todayKey,
      online,
      pendingCount: outbox.length,
      authNotice,
      clearAuthNotice,
      login,
      logout: performLogout,
      dispatch,
      schedule,
      createUser,
      adminSetActive,
      adminReset,
      setAvatar,
      readArticles,
      markArticleRead,
      reminders,
      setReminders,
    }),
    [
      hydrated,
      session,
      currentUser,
      view,
      todayKey,
      online,
      outbox.length,
      authNotice,
      clearAuthNotice,
      login,
      performLogout,
      dispatch,
      schedule,
      createUser,
      adminSetActive,
      adminReset,
      setAvatar,
      readArticles,
      markArticleRead,
      reminders,
      setReminders,
    ],
  );
});

// ---------- Hooks derivados ----------

/** Todas las fichas visibles (la gestante solo ve la suya). */
export function usePatients(): PatientView[] {
  const { view } = useApp();
  return view?.patients ?? [];
}

export function usePatient(patientId: string | undefined): PatientView | null {
  const patients = usePatients();
  return useMemo(() => patients.find((p) => p.id === patientId) ?? null, [patients, patientId]);
}

/** Ficha de la gestante con sesión activa. */
export function useMyPatient(): PatientView | null {
  const { user } = useApp();
  return usePatient(user?.patientId);
}

/** Mensajes sin leer para el rol actual (opcionalmente de una conversación). */
export function useUnreadCount(convId?: string): number {
  const { view, user } = useApp();
  return useMemo(() => {
    if (!view || !user || user.role === "admin") return 0;
    const role = user.role;
    return view.messages.filter((m) => {
      if (convId && m.convId !== convId) return false;
      if (m.sender === role) return false;
      return role === "gestante" ? !m.readByGestante : !m.readByObstetra;
    }).length;
  }, [view, user, convId]);
}
