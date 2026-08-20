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
  notifySnapshotDelta,
  registerForPushNotificationsAsync,
  ReminderSettings,
  requestNotificationPermission,
  syncReminders,
  unregisterPushTokenAsync,
} from "@/lib/notifications";
import { playSnapshotSounds, setSoundsPreference } from "@/lib/sounds";
import { useToast } from "@/components/Toast";
import { todayKeyLocal } from "@/lib/format";
import type {
  ActionInput,
  AppEnvironment,
  Article,
  ArticleAssignment,
  ArticleLink,
  ClientAction,
  LoginResponse,
  PatientView,
  PresenceView,
  Snapshot,
  SyncResponse,
  SystemConfig,
  User,
  WhatsAppConfig,
} from "@/types";

const SESSION_KEY = "vm_session_v3";
const ARTICLES_KEY = "vm_articles_v1";
const REMINDERS_KEY = "vm_reminders_v1";
const SOUNDS_KEY = "vm_sounds_v1";
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

export interface UpdateProfileParams {
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
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
  const { show: showToast } = useToast();
  const [session, setSession] = useState<SessionState | null>(null);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [cached, setCached] = useState<Snapshot | null>(null);
  const [outbox, setOutboxState] = useState<ClientAction[]>([]);
  const [netOnline, setNetOnline] = useState<boolean>(true);
  const [syncOk, setSyncOk] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [readArticles, setReadArticles] = useState<string[]>([]);
  const [reminders, setRemindersInternal] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  /** Sonidos personalizados de los avisos (preferencia local del perfil). */
  const [soundsEnabled, setSoundsEnabledState] = useState<boolean>(true);
  /** Conversación abierta en pantalla: acelera el pulso de sincronización. */
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  const sessionRef = useRef<SessionState | null>(null);
  const outboxRef = useRef<ClientAction[]>([]);
  const cachedRef = useRef<Snapshot | null>(null);
  const syncOkRef = useRef<boolean>(false);
  /** Presencia que viaja con cada sincronización (chat abierto + teclado). */
  const chatPresenceRef = useRef<{ convId: string | null; typing: boolean }>({
    convId: null,
    typing: false,
  });
  /**
   * Evita la ráfaga de sonidos al abrir la app: la primera sincronización
   * de la sesión (que trae todo lo acumulado) es silenciosa; a partir de
   * ahí, lo nuevo suena con su sonido diferenciado.
   */
  const firstSyncDoneRef = useRef<boolean>(false);

  // ---------- Hidratación inicial ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rawSession, rawArticles, rawReminders, rawSounds] = await Promise.all([
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(ARTICLES_KEY),
          AsyncStorage.getItem(REMINDERS_KEY),
          AsyncStorage.getItem(SOUNDS_KEY),
        ]);
        if (rawArticles && !cancelled) setReadArticles(JSON.parse(rawArticles) as string[]);
        if (rawReminders && !cancelled) {
          setRemindersInternal({ ...DEFAULT_REMINDERS, ...(JSON.parse(rawReminders) as ReminderSettings) });
        }
        if (rawSounds !== null && !cancelled) {
          const enabled = JSON.parse(rawSounds) === true;
          setSoundsEnabledState(enabled);
          setSoundsPreference(enabled);
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
            if (rawSnap) {
              const snap = JSON.parse(rawSnap) as Snapshot;
              cachedRef.current = snap;
              setCached(snap);
            }
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
    cachedRef.current = snapshot;
    setCached(snapshot);
    if (snapshot.me && sessionRef.current) {
      const updatedSession: SessionState = { ...sessionRef.current, user: snapshot.me };
      sessionRef.current = updatedSession;
      setSession(updatedSession);
      AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession)).catch(() => {});
    }
    AsyncStorage.setItem(snapKey(dni), JSON.stringify(snapshot)).catch(() => {});
  }, []);

  // ---------- Sesión ----------

  const performLogout = useCallback((notice?: string) => {
    const s = sessionRef.current;
    if (s?.token) {
      unregisterPushTokenAsync(s.token).catch(() => {});
    }
    const dni = s?.user.dni;
    sessionRef.current = null;
    outboxRef.current = [];
    cachedRef.current = null;
    syncOkRef.current = false;
    firstSyncDoneRef.current = false;
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
    cachedRef.current = res.snapshot;
    syncOkRef.current = true;
    firstSyncDoneRef.current = true;
    setSession(s);
    setCached(res.snapshot);
    setOutboxState([]);
    setAuthNotice(null);
    setSyncOk(true);
    registerForPushNotificationsAsync(res.token).catch((e) =>
      console.log("[VitMaterna] Error registrando push token en login:", e),
    );
    await AsyncStorage.multiSet([
      [SESSION_KEY, JSON.stringify(s)],
      [snapKey(res.user.dni), JSON.stringify(res.snapshot)],
      [outKey(res.user.dni), "[]"],
    ]).catch(() => {});
    return res.user;
  }, []);

  // Registrar push token al hidratar la sesión existente
  useEffect(() => {
    if (session?.token) {
      registerForPushNotificationsAsync(session.token).catch((e) =>
        console.log("[VitMaterna] Error registrando push token con sesión existente:", e),
      );
    }
  }, [session?.token]);

  // ---------- Sincronización (cola offline + tiempo casi real) ----------

  useQuery({
    queryKey: ["sync", session?.token ?? "none"],
    enabled: hydrated && session !== null,
    // Con un chat abierto el pulso baja a 2 s: presencia y "escribiendo" en vivo.
    refetchInterval: activeConvId !== null ? 2000 : 4000,
    retry: false,
    gcTime: 60_000,
    queryFn: async (): Promise<Snapshot> => {
      const s = sessionRef.current;
      if (!s) throw new ApiError("Sin sesión", 0);
      const pending = [...outboxRef.current];
      const prevSnapshot = cachedRef.current;
      const wasSynced = syncOkRef.current;
      try {
        const res = await api<SyncResponse>("/api/sync", {
          token: s.token,
          body: { actions: pending, presence: chatPresenceRef.current },
        });
        const acked = new Set(res.results.map((r) => r.id));
        const rejected = res.results.filter((r) => !r.ok);
        if (rejected.length > 0) {
          console.log("[VitMaterna] Acciones rechazadas por el servidor:", rejected);
          showToast(
            rejected[0].error ?? "Un cambio no se pudo aplicar. Revisa la información.",
            "error",
          );
        }
        persistOutbox(s.user.dni, outboxRef.current.filter((a) => !acked.has(a.id)));
        persistSnapshot(s.user.dni, res.snapshot);
        syncOkRef.current = true;
        setSyncOk(true);
        if (!wasSynced && pending.length > 0 && rejected.length < pending.length) {
          showToast("Volvió la señal: tus cambios guardados ya se enviaron", "success");
        }
        if (Platform.OS !== "web") {
          notifySnapshotDelta(prevSnapshot, res.snapshot, chatPresenceRef.current.convId).catch(
            (err) => console.log("[VitMaterna] aviso nativo:", err),
          );
        }
        // Sonido dentro de la app según lo que llegó: mensaje, aviso o SOS.
        if (firstSyncDoneRef.current) {
          playSnapshotSounds(prevSnapshot, res.snapshot);
        }
        firstSyncDoneRef.current = true;
        return res.snapshot;
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          performLogout("Tu sesión terminó o tu cuenta fue desactivada. Vuelve a iniciar sesión.");
        } else {
          syncOkRef.current = false;
          setSyncOk(false);
        }
        throw e;
      }
    },
  });

  /**
   * El chat abierto informa su presencia: qué conversación se está viendo y
   * si se está escribiendo. Al empezar a escribir se sincroniza al instante
   * para que el otro lado vea "Escribiendo…" sin esperar el siguiente pulso.
   */
  const setChatPresence = useCallback(
    (convId: string | null, typing: boolean) => {
      const prev = chatPresenceRef.current;
      const next = { convId, typing: typing && convId !== null };
      if (prev.convId === next.convId && prev.typing === next.typing) return;
      chatPresenceRef.current = next;
      setActiveConvId(next.convId);
      if (next.typing && !prev.typing) {
        void queryClient.invalidateQueries({ queryKey: ["sync"] });
      }
    },
    [queryClient],
  );

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

  /** Configuración del sistema (solo admin): mantenimiento, mensaje y entorno. */
  const adminSetConfig = useCallback(
    (params: { maintenance?: boolean; maintenanceMessage?: string; environment?: AppEnvironment }) =>
      runOnline("/api/admin/config", params),
    [runOnline],
  );

  /** Guarda (crea o edita) un contenido educativo (solo admin). */
  const adminSaveArticle = useCallback(
    (article: Partial<Article>) => runOnline("/api/admin/article/save", article),
    [runOnline],
  );

  /** Activa o desactiva un contenido educativo (solo admin). */
  const adminToggleArticleActive = useCallback(
    (id: string, active: boolean) => runOnline("/api/admin/article/toggle-active", { id, active }),
    [runOnline],
  );

  /** Elimina un contenido educativo (solo admin). */
  const adminDeleteArticle = useCallback(
    (id: string) => runOnline("/api/admin/article/delete", { id }),
    [runOnline],
  );

  /** Asigna o quita una lectura a una paciente (optimista offline-first). */
  const assignArticle = useCallback(
    (patientId: string, articleId: string, assigned: boolean) => {
      dispatch({ type: "assign_article", patientId, articleId, assigned });
    },
    [dispatch],
  );

  /** Asigna o quita todas las lecturas activas a una paciente. */
  const assignAllArticles = useCallback(
    (patientId: string, assigned: boolean) => {
      dispatch({ type: "assign_all_articles", patientId, assigned });
    },
    [dispatch],
  );

  /** Sube (o quita con null) la foto de perfil del usuario actual. */
  const setAvatar = useCallback(
    (dataUrl: string | null) => runOnline("/api/user/avatar", { dataUrl }),
    [runOnline],
  );

  /** Actualiza datos de perfil del usuario actual (nombres, teléfono, contraseña opcional). */
  const updateProfile = useCallback(
    (params: UpdateProfileParams) => runOnline("/api/user/profile", params),
    [runOnline],
  );

  /** Configura si se crean los 8 controles automáticamente según FUM al registrar gestante. */
  const setAutoControls = useCallback(
    (enabled: boolean) => runOnline("/api/user/auto-controls", { autoControls: enabled }),
    [runOnline],
  );

  /** Configuración de WhatsApp con Open-WA (solo admin). */
  const adminSetWhatsAppConfig = useCallback(
    (config: Partial<WhatsAppConfig>) => runOnline("/api/admin/whatsapp/config", config),
    [runOnline],
  );

  /** Prueba de conexión con el servidor Open-WA (solo admin). */
  const adminTestWhatsAppConnection = useCallback(
    async (
      config?: Partial<WhatsAppConfig>,
    ): Promise<{
      ok: boolean;
      status: string;
      battery?: number | null;
      serverUrl?: string;
      details?: string;
      error?: string;
    }> => {
      const s = sessionRef.current;
      if (!s) throw new ApiError("Sin sesión", 0);
      return api("/api/admin/whatsapp/test-connection", { token: s.token, body: config ?? {} });
    },
    [],
  );

  /** Envío de mensaje de prueba a un número de WhatsApp (solo admin). */
  const adminSendTestWhatsApp = useCallback(
    async (
      phone: string,
      message?: string,
    ): Promise<{ ok: boolean; message?: string; error?: string }> => {
      const s = sessionRef.current;
      if (!s) throw new ApiError("Sin sesión", 0);
      return api("/api/admin/whatsapp/send-test", { token: s.token, body: { phone, message } });
    },
    [],
  );

  // ---------- Vista optimista ----------

  const view = useMemo(() => {
    if (!cached || !session) return null;
    return applyOutbox(cached, outbox, session.user);
  }, [cached, outbox, session]);

  const todayKey = view?.todayKey ?? todayKeyLocal();
  const online = netOnline && syncOk;
  /** Momento de la última sincronización exitosa con el servidor. */
  const lastSyncISO = cached?.serverTimeISO ?? null;
  /** Configuración global del sistema (mantenimiento + entorno), en tiempo real. */
  const systemConfig: SystemConfig | null = cached?.config ?? null;
  /** Configuración de WhatsApp (solo visible por administración). */
  const whatsappConfig: WhatsAppConfig | null = cached?.whatsappConfig ?? null;

  // Permiso de notificaciones nativas al tener sesión (banner del teléfono).
  useEffect(() => {
    if (!hydrated || !session || Platform.OS === "web") return;
    requestNotificationPermission().catch(() => {});
  }, [hydrated, session]);

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

  /** Activa o apaga los sonidos personalizados y guarda la preferencia. */
  const setSoundsEnabled = useCallback((value: boolean) => {
    setSoundsEnabledState(value);
    setSoundsPreference(value);
    AsyncStorage.setItem(SOUNDS_KEY, JSON.stringify(value)).catch(() => {});
  }, []);

  const myPatient = useMemo<PatientView | null>(() => {
    if (!view || session?.user.role !== "gestante") return null;
    return view.patients.find((p) => p.id === session.user.patientId) ?? null;
  }, [view, session]);

  const apptId = myPatient?.nextAppointment?.id ?? null;
  const apptDateKey = myPatient?.nextAppointment?.dateKey ?? null;
  const apptTime = myPatient?.nextAppointment?.time ?? null;

  // `soundsEnabled` reprograma los recordatorios para que usen el sonido
  // personalizado o el estándar del teléfono según la preferencia.
  useEffect(() => {
    if (!hydrated || Platform.OS === "web") return;
    if (!session || session.user.role !== "gestante") return;
    syncReminders(
      reminders,
      apptDateKey && apptTime ? { dateKey: apptDateKey, time: apptTime } : null,
    ).catch((e) => console.log("[VitMaterna] recordatorios:", e));
  }, [hydrated, session, reminders, apptId, apptDateKey, apptTime, soundsEnabled]);

  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  return useMemo(
    () => ({
      hydrated,
      session,
      user: currentUser,
      view,
      todayKey,
      online,
      lastSyncISO,
      systemConfig,
      whatsappConfig,
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
      adminSetConfig,
      adminSetWhatsAppConfig,
      adminTestWhatsAppConnection,
      adminSendTestWhatsApp,
      articles: view?.articles ?? [],
      articleAssignments: view?.articleAssignments ?? [],
      adminSaveArticle,
      adminToggleArticleActive,
      adminDeleteArticle,
      assignArticle,
      assignAllArticles,
      setAvatar,
      updateProfile,
      setAutoControls,
      setChatPresence,
      readArticles,
      markArticleRead,
      reminders,
      setReminders,
      soundsEnabled,
      setSoundsEnabled,
    }),
    [
      hydrated,
      session,
      currentUser,
      view,
      todayKey,
      online,
      lastSyncISO,
      systemConfig,
      whatsappConfig,
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
      adminSetConfig,
      adminSaveArticle,
      adminToggleArticleActive,
      adminDeleteArticle,
      assignArticle,
      assignAllArticles,
      adminSetWhatsAppConfig,
      adminTestWhatsAppConnection,
      adminSendTestWhatsApp,
      setAvatar,
      updateProfile,
      setAutoControls,
      setChatPresence,
      readArticles,
      markArticleRead,
      reminders,
      setReminders,
      soundsEnabled,
      setSoundsEnabled,
    ],
  );
});

// ---------- Hooks derivados ----------

/** Lista de artículos educativos disponibles para el rol actual. */
export function useArticles(): Article[] {
  const { view } = useApp();
  return view?.articles ?? [];
}

/** Asignaciones de artículos por paciente. */
export function useArticleAssignments(): ArticleAssignment[] {
  const { view } = useApp();
  return view?.articleAssignments ?? [];
}

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

/**
 * Presencia del interlocutor de una conversación: la gestante usa la clave
 * "obstetra" y la obstetra el id de la paciente. Null mientras no haya datos.
 */
export function usePresence(key: string | undefined): PresenceView | null {
  const { view } = useApp();
  return useMemo(() => (key ? view?.presence?.[key] ?? null : null), [view?.presence, key]);
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
