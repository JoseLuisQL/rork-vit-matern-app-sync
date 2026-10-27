#!/usr/bin/env bash
set -e

echo "=================================================="
echo "  🚀 Desplegando VitMaterna en Producción"
echo "=================================================="

# 1. Verificar .env.prod
if [ ! -f .env.prod ]; then
    echo "⚠️  Archivo .env.prod no encontrado. Creando plantilla desde .env.prod.example..."
    cp .env.prod.example .env.prod
    echo "❗ Por favor edite .env.prod con 'nano .env.prod' para configurar POSTGRES_PASSWORD y ADMIN_PASSWORD."
    echo "❗ Luego vuelva a ejecutar ./deploy.sh"
    exit 1
fi

# 2. Verificar red externa de Traefik (sivac_net)
if ! docker network ls | grep -q "sivac_net"; then
    echo "ℹ️  Creando red externa sivac_net..."
    docker network create sivac_net
fi

# 3. Actualizar código desde Git (si es un repositorio git)
if [ -d .git ]; then
    echo "🔄 Descargando últimos cambios desde Git..."
    git pull --ff-only || echo "⚠️  No se pudo hacer git pull automático; continuando con el código local..."
fi

# 4. Descargar/construir y levantar contenedores (aplica migración automática en PostgreSQL al iniciar api)
echo "📦 Construyendo imágenes (api + web) y actualizando servicios..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build --remove-orphans

# 5. Limpiar imágenes antiguas huérfanas para liberar espacio en el VPS
echo "🧹 Limpiando imágenes Docker antiguas..."
docker image prune -f

# 6. Estado de los contenedores
echo "=================================================="
echo "  ✅ VitMaterna actualizado y desplegado en Producción"
echo "=================================================="
docker compose -f docker-compose.prod.yml --env-file .env.prod ps

