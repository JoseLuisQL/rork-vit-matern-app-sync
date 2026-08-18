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

# 3. Descargar/construir y levantar contenedores
echo "📦 Construyendo imágenes y levantando servicios..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build --remove-orphans

# 4. Estado de los contenedores
echo "=================================================="
echo "  ✅ VitMaterna desplegado correctamente"
echo "=================================================="
docker compose -f docker-compose.prod.yml ps
