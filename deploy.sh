#!/usr/bin/env bash
set -e

echo "=================================================="
echo "  🚀 Desplegando VitMaterna en Producción"
echo "=================================================="

# 1. Actualizar código desde Git (preserva .env, .env.prod y volúmenes de BD)
if [ -d .git ]; then
    echo "🔄 Sincronizando últimos cambios desde Git (origin/main)..."
    git fetch origin main
    git reset --hard origin/main
    chmod +x deploy.sh 2>/dev/null || true
fi

# 2. Asegurar archivo .env.prod (desde .env existente o desde el contenedor en ejecución)
if [ ! -f .env.prod ]; then
    if [ -f .env ] && grep -q "POSTGRES_PASSWORD=" .env; then
        echo "ℹ️  Copiando configuración existente desde .env a .env.prod..."
        cp .env .env.prod
    elif docker inspect vitmaterna-db >/dev/null 2>&1; then
        echo "ℹ️  Recuperando variables de entorno actuales desde los contenedores en ejecución..."
        docker inspect vitmaterna-db --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)=' > .env.prod || true
        if docker inspect vitmaterna-api >/dev/null 2>&1; then
            docker inspect vitmaterna-api --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^(SEED_MODE|ADMIN_DNI|ADMIN_PASSWORD|ADMIN_FIRST_NAME|ADMIN_LAST_NAME)=' >> .env.prod || true
        fi
        if ! grep -q "^APP_DOMAIN=" .env.prod; then
            echo "APP_DOMAIN=vitmaterna.qware.me" >> .env.prod
        fi
        # Copiar también a .env por compatibilidad con docker compose
        cp .env.prod .env
    elif [ -f .env.example ]; then
        echo "⚠️  Archivo .env.prod no encontrado. Creando plantilla desde .env.example..."
        cp .env.example .env.prod
        echo "❗ Por favor edite .env.prod con 'nano .env.prod' para configurar POSTGRES_PASSWORD."
        exit 1
    fi
fi

# Mantener .env sincronizado con .env.prod para interpolación de variables en docker compose
if [ -f .env.prod ] && [ ! -f .env ]; then
    cp .env.prod .env
fi

# 3. Verificar red externa de Traefik (sivac_net)
if ! docker network ls | grep -q "sivac_net"; then
    echo "ℹ️  Creando red externa sivac_net..."
    docker network create sivac_net
fi

# 4. Construir imágenes con los últimos cambios y levantar servicios
if [ -f expo/Dockerfile.web ]; then
    sed -i 's/COPY package.json bun.lock \.\//COPY package.json .\//g' expo/Dockerfile.web
fi
echo "📦 Construyendo imágenes (api + web) y levantando servicios..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build --remove-orphans

# 5. Limpiar imágenes antiguas huérfanas para liberar espacio en el VPS
echo "🧹 Limpiando imágenes Docker antiguas..."
docker image prune -f

# 6. Estado de los contenedores
echo "=================================================="
echo "  ✅ VitMaterna desplegado correctamente"
echo "=================================================="
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
