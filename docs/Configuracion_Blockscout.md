# Configuración y Uso de Blockscout (Explorador de Blockchain para Hyperledger Besu)

Este documento describe paso a paso cómo desplegar y utilizar **Blockscout** en el proyecto. La configuración se basa en la versión **v6** que separa el frontend y el backend, e incluye Redis como cache.

---

## 1. ¿Qué es Blockscout?

Blockscout es un explorador de blockchain de código abierto para redes compatibles con Ethereum (como Hyperledger Besu). Permite:
- Visualizar bloques en tiempo real.
- Buscar transacciones y eventos de contratos inteligentes.
- Examinar cuentas y balances.
- Ver eventos emitidos por el contrato `CredentialRegistry` utilizado en la solución SSI.

---

## 2. Requisitos Previos

1. **Docker Desktop** (o Docker Engine) instalado y en ejecución.
2. **Nodo Besu** activo (`besu-node` debe estar `Up` y su RPC disponible en `http://host.docker.internal:8545`).
3. Conexión a internet para descargar imágenes Docker la primera vez.
4. Suficiente espacio en disco (≈ 2 GB) para las imágenes y la base de datos.

Puedes comprobar que Besu está activo con:
```bash
cd blockchain
docker compose ps
```
Deberías ver un contenedor llamado `besu-node` con estado `Up`.

---

## 3. Archivo de Compose Correcto

Guarda el siguiente contenido como **`blockchain/docker-compose.blockscout.yml`**. Este archivo incluye los servicios necesarios y corrige los errores de variables de entorno que provocaban el *Page not found*.

```yaml
version: '3.8'

services:
  # ─── 1. Base de datos PostgreSQL ────────────────────────
  blockscout-db:
    image: postgres:15-alpine
    container_name: blockscout-db
    restart: always
    environment:
      POSTGRES_DB: blockscout
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
    ports:
      - "5432:5432"
    volumes:
      - blockscout-db-data:/var/lib/postgresql/data

  # ─── 2. Redis (cache requerido por Blockscout v6) ────────
  blockscout-redis:
    image: redis:7-alpine
    container_name: blockscout-redis
    restart: always

  # ─── 3. Backend (API + indexador) ───────────────────────
  blockscout-web:
    image: ghcr.io/blockscout/blockscout:latest
    container_name: blockscout-web
    restart: always
    depends_on:
      - blockscout-db
      - blockscout-redis
    ports:
      - "4000:4000"
    command:
      - sh
      - -c
      - |
        bin/blockscout eval "Elixir.Explorer.ReleaseTasks.create_and_migrate()"
        bin/blockscout start
    environment:
      ETHEREUM_JSONRPC_VARIANT: "besu"
      ETHEREUM_JSONRPC_HTTP_URL: "http://host.docker.internal:8545"
      ETHEREUM_JSONRPC_TRACE_URL: "http://host.docker.internal:8545"
      DATABASE_URL: "postgresql://postgres:postgrespassword@blockscout-db:5432/blockscout?ssl=false"
      REDIS_URL: "redis://blockscout-redis:6379"
      ECTO_USE_SSL: "false"
      NETWORK: "Ecuador SSI Besu Network"
      SUBNETWORK: "Devnet Local"
      CHAIN_ID: "1337"
      COIN: "ETH"
      COIN_NAME: "ETH"
      SHOW_PRICE_CHART: "false"
      SHOW_TXS_PER_SECOND: "true"
      DISABLE_EXCHANGE_RATES: "true"
      SECRET_KEY_BASE: "ecuador_ssi_secret_key_base_minimum_64_chars_paddddddddddddddddddddddddd"
      PORT: "4000"
      BLOCKSCOUT_HOST: "localhost"
      BLOCKSCOUT_PROTOCOL: "http"
      API_V1_READ_METHODS_DISABLED: "false"
      API_V1_WRITE_METHODS_DISABLED: "false"
    # Las siguientes variables no son necesarias para esta configuración y se omiten para evitar errores de validación.
    # NEXT_PUBLIC_FEATURED_NETWORKS: omitted (not used)
    # NEXT_PUBLIC_OTHER_LINKS: omitted (not used)
    extra_hosts:
      - "host.docker.internal:host-gateway"

  # ─── 4. Frontend (interfaz visual) ───────────────────────
  blockscout-frontend:
    image: ghcr.io/blockscout/frontend:latest
    container_name: blockscout-frontend
    restart: always
    depends_on:
      - blockscout-web
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_HOST: "localhost"
      NEXT_PUBLIC_API_PORT: "4000"
      NEXT_PUBLIC_API_PROTOCOL: "http"
      NEXT_PUBLIC_API_BASE_PATH: "/"
      NEXT_PUBLIC_APP_HOST: "localhost"
      NEXT_PUBLIC_APP_PROTOCOL: "http"
      NEXT_PUBLIC_APP_PORT: "3001"
      NEXT_PUBLIC_NETWORK_NAME: "Ecuador SSI Besu Network"
      NEXT_PUBLIC_NETWORK_SHORT_NAME: "Besu"
      NEXT_PUBLIC_NETWORK_ID: "1337"
      NEXT_PUBLIC_NETWORK_CURRENCY_NAME: "Ether"
      NEXT_PUBLIC_NETWORK_CURRENCY_SYMBOL: "ETH"
      NEXT_PUBLIC_NETWORK_CURRENCY_DECIMALS: "18"
      NEXT_PUBLIC_IS_TESTNET: "true"

volumes:
  blockscout-db-data:
```

> **Importante**: Las variables `NEXT_PUBLIC_FEATURED_NETWORKS` y `NEXT_PUBLIC_OTHER_LINKS` se han omitido (comentadas) porque Blockscout v6 las valida como arrays. Dejar un string vacío provocaba que el contenedor del frontend entrara en estado *Restarting*.

---

## 4. Despliegue Paso a Paso

1. **Desde la raíz del proyecto** abre una terminal y sitúate en la carpeta `blockchain`:
   ```bash
   cd blockchain
   ```
2. **Levanta los contenedores** (backend, base de datos, redis y frontend):
   ```bash
   docker compose -f docker-compose.blockscout.yml up -d
   ```
3. **Verifica que todos estén activos**:
   ```bash
   docker ps
   ```
   Deberías ver al menos los siguientes contenedores con estado `Up`:
   - `besu-node`
   - `blockscout-db`
   - `blockscout-redis`
   - `blockscout-web`
   - `blockscout-frontend`
4. **Accede a la UI**:
   - **Frontend** (interfaz de usuario): **[http://localhost:3001](http://localhost:3001)**
   - **API / Backend** (solo si necesitas consultas directas): **[http://localhost:4000](http://localhost:4000)**

> La primera vez puede tardar entre 30‑60 segundos mientras el indexador procesa los bloques iniciales.

---

## 5. Uso Básico de Blockscout

- **Dashboard** muestra los últimos bloques y transacciones.
- **Buscar**: copia el hash de una transacción o el address del contrato `CredentialRegistry` y pégalo en la barra superior.
- **Detalle de Transacción**: informa el estado, número de bloque, remitente, destinatario y logs de eventos (por ejemplo `CredentialRegistered`).
- **Contrato**: en la pestaña *Contract* puedes inspeccionar el ABI y los eventos del contrato desplegado.

---

## 6. Comandos de Administración Útiles

```bash
# Ver logs del backend en tiempo real
docker compose -f docker-compose.blockscout.yml logs -f blockscout-web

# Ver logs del frontend (para depurar variables)
docker compose -f docker-compose.blockscout.yml logs -f blockscout-frontend

# Reiniciar todo el stack
docker compose -f docker-compose.blockscout.yml restart

# Detener y eliminar contenedores y volúmenes
docker compose -f docker-compose.blockscout.yml down --volumes
```

---

## 7. Resumen de Puertos y Servicios

| Servicio | URL / Puerto | Descripción |
|----------|--------------|-------------|
| **Besu RPC Node** | `http://127.0.0.1:8545` | Nodo principal de Hyperledger Besu |
| **Blockscout Backend (API)** | `http://localhost:4000` | API y indexador del explorador |
| **Blockscout Frontend** | `http://localhost:3001` | Interfaz web del explorador |
| **PostgreSQL** | `localhost:5432` | Base de datos interna del explorador |
| **Redis** | `localhost:6379` | Cache de Blockscout |

---

## 8. Solución de Problemas Comunes

- **Frontend en *Restarting* o *Page not found*:**
  - Verifica que las variables `NEXT_PUBLIC_FEATURED_NETWORKS` y `NEXT_PUBLIC_OTHER_LINKS` no estén definidas como `""`. En el archivo de compose deben estar comentadas o eliminadas (ver sección 3).
  - Asegúrate de que el contenedor `blockscout-web` esté `Up` antes de iniciar `blockscout-frontend`.
- **Bloqueo en la indexación:**
  - Revisar logs del backend con `docker compose -f docker-compose.blockscout.yml logs -f blockscout-web`.
  - Si la base de datos está corrupta, elimina el volumen `blockscout-db-data` y vuelve a levantar el stack (`down --volumes`).
- **Problemas de conexión a Besu:**
  - Confirmar que `host.docker.internal` resuelve a la IP de tu máquina host (Docker Desktop lo soporta por defecto). Si usas Docker Engine en Linux, sustituye `host.docker.internal` por la IP de la red Docker (p. ej., `172.17.0.1`).

---

**¡Listo!** Con esta configuración podrás explorar la cadena de bloques de tu proyecto, validar credenciales y depurar eventos directamente desde la UI de Blockscout.
