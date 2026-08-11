# Configuración y Uso de Blockscout (Explorador de Blockchain para Hyperledger Besu)

Este documento describe la configuración y el paso a paso detallado para desplegar e interactuar con **Blockscout**, el explorador visual web de la cadena de bloques para la red privada **Hyperledger Besu** configurada en el proyecto.

---

## 1. ¿Qué es Blockscout?

**Blockscout** es un explorador de blockchain de código abierto para redes basadas en Ethereum (incluyendo Hyperledger Besu). Proporciona una interfaz web idéntica a exploradores públicos como *Etherscan*, permitiendo:

- Inspeccionar **bloques en tiempo real** generados por el nodo Besu.
- Buscar y auditar **transacciones** de registro y verificación de credenciales.
- Consultar las cuentas, direcciones y contratos inteligentes desplegados (como `CredentialRegistry.sol`).
- Ver los **eventos emitidos** (`CredentialRegistered`) con sus datos criptográficos.

---

## 2. Requisitos Previos

Antes de iniciar Blockscout, asegúrate de contar con los siguientes elementos activos:

1. **Docker Desktop** (o Docker Engine) instalado y en ejecución en Windows/Linux/macOS.
2. **Nodo Besu en ejecución**: El contenedor `besu-node` debe estar corriendo en la red local (`http://127.0.0.1:8545` o en la red Docker).

Para verificar que Besu esté corriendo:
```bash
cd blockchain
docker compose ps
```
Deberías ver el contenedor `besu-node` en estado `Up`.

---

## 3. Configuración del Servicio (Docker Compose)

Blockscout requiere una base de datos PostgreSQL ligera para indexar la cadena y el contenedor principal del explorador.

### Opción A: Archivo dedicado `blockchain/docker-compose.blockscout.yml` (Recomendado)

Crea o utiliza el archivo `docker-compose.blockscout.yml` dentro de la carpeta `blockchain/` con el siguiente contenido:

```yaml
version: '3.8'

services:
  # Base de datos PostgreSQL para el indexador de Blockscout
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

  # Servicio principal del Explorador Blockscout
  blockscout:
    image: ghcr.io/blockscout/blockscout:latest
    container_name: blockscout-web
    restart: always
    depends_on:
      - blockscout-db
    links:
      - blockscout-db
    ports:
      - "4000:4000"
    environment:
      ETHEREUM_JSONRPC_VARIANT: 'besu'
      ETHEREUM_JSONRPC_HTTP_URL: 'http://host.docker.internal:8545'
      DATABASE_URL: 'postgresql://postgres:postgrespassword@blockscout-db:5432/blockscout?ssl=false'
      ECTO_USE_SSL: 'false'
      NETWORK: 'Ecuador SSI Besu Network'
      SUBNETWORK: 'Devnet Local'
      CHAIN_ID: '1337'
      COIN: 'ETH'
      SHOW_PRICE_CHART: 'false'
      SHOW_TXS_PER_SECOND: 'true'
      PORT: '4000'
    extra_hosts:
      - "host.docker.internal:host-gateway"

volumes:
  blockscout-db-data:
```

---

## 4. Paso a Paso para Desplegar e Iniciar Blockscout

### Paso 1: Iniciar el explorador Blockscout
Abre la terminal en la raíz de la carpeta `blockchain/` y ejecuta:

```bash
cd blockchain
docker compose -f docker-compose.blockscout.yml up -d
```

### Paso 2: Verificar que los contenedores estén corriendo
Ejecuta el siguiente comando para revisar el estado de los contenedores:

```bash
docker ps
```
Verificarás los contenedores `besu-node`, `blockscout-web` y `blockscout-db`.

### Paso 3: Abrir la interfaz web de Blockscout
Abre cualquier navegador (Chrome, Edge, Firefox) e ingresa a la siguiente URL:

👉 **[http://localhost:4000](http://localhost:4000)**

---

## 5. Guía de Uso del Explorador Blockscout (`http://localhost:4000`)

Una vez cargada la página principal, podrás explorar toda la actividad de la blockchain:

### A. Vista Principal (Dashboard)
- **Latest Blocks (Últimos Bloques)**: Muestra en tiempo real cada bloque minado por Hyperledger Besu con su número de bloque, número de transacciones y tiempo transcurrido.
- **Transactions (Transacciones)**: Muestra las últimas transacciones procesadas por la red.

### B. Buscar una Credencial / Transacción
1. Copia el **Hash en blockchain** de una credencial registrada desde el sistema Ecuador SSI (ej: `0x7a1c9e3f...`).
2. Pégalo en la barra de búsqueda superior en Blockscout.
3. Presiona `Enter` o haz clic en Buscar.
4. Verás los detalles completos de la transacción:
   - **Status**: `Success` (Transacción confirmada en la cadena).
   - **Block Number**: Número exacto del bloque donde quedó registrada.
   - **From**: Dirección de la wallet que emitió la credencial.
   - **To**: Dirección del Smart Contract `CredentialRegistry`.
   - **Input Data / Logs**: Los eventos y hashes auditables.

### C. Inspeccionar el Smart Contract `CredentialRegistry`
1. Ingresa la dirección del contrato inteligente (generada al desplegar con Hardhat Ignition en `ignition/deployments/chain-1337/`).
2. En la pestaña **Contract**, podrás examinar el estado del contrato y los eventos `CredentialRegistered` emitidos en cada registro.

---

## 6. Comandos Útiles de Administración

### Ver los logs de Blockscout en tiempo real:
```bash
docker compose -f docker-compose.blockscout.yml logs -f blockscout
```

### Reiniciar el servicio de Blockscout:
```bash
docker compose -f docker-compose.blockscout.yml restart blockscout
```

### Detener el explorador:
```bash
docker compose -f docker-compose.blockscout.yml down
```

---

## 7. Resumen de Puertos y Servicios

| Servicio | URL / Puerto | Descripción |
|----------|--------------|-------------|
| **Besu RPC Node** | `http://127.0.0.1:8545` | Nodo principal de Hyperledger Besu |
| **Blockscout Web UI** | `http://localhost:4000` | Explorador visual de la blockchain |
| **Blockscout Postgres** | `localhost:5432` | Base de datos interna del explorador |
