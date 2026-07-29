# Configuración Blockchain (Hyperledger Besu + Hardhat + Solidity)

## Tecnologías

| Tecnología | Versión |
|------------|---------|
| Hyperledger Besu | latest (Docker) |
| Hardhat | v2.28.0 |
| Hardhat Toolbox | v6.1.2 |
| Solidity | ^0.8.20 / 0.8.28 |
| ethers.js | v6 (Hardhat) |
| dotenv | v17 |

## Estructura del Proyecto (blockchain/)

```
blockchain/
├── config/
│   └── qbftConfigFile.json   # Configuración QBFT (pendiente)
├── contracts/
│   ├── CredentialRegistry.sol # Smart contract principal (SSI)
│   └── Lock.sol              # Contrato de ejemplo (Hardhat)
├── data/                     # Datos del nodo Besu (generados)
│   ├── DATABASE_METADATA.json
│   ├── VERSION_METADATA.json
│   ├── besu.networks
│   ├── besu.ports
│   ├── caches/
│   ├── database/
│   └── key                   # Clave privada del nodo Besu
├── ignition/
│   ├── deployments/
│   │   └── chain-1337/       # Deployments en Besu (chainId 1337)
│   │       ├── artifacts/
│   │       ├── build-info/
│   │       └── journal.jsonl
│   └── modules/
│       ├── CredentialRegistry.js  # Módulo Ignition para desplegar
│       └── Lock.js
├── scripts/
│   └── deploy.js             # Script de deploy alternativo
├── test/
│   ├── CredentialRegistry.js # Tests del contrato principal
│   └── Lock.js
├── artifacts/                # Compilados de Solidity
├── cache/                    # Cache de Hardhat
├── .env                      # Variables de entorno (PRIVATE_KEY, BESU_RPC_URL)
├── .env.example              # Template de variables de entorno
├── .gitignore
├── docker-compose.yml        # Servicio Besu en Docker
├── hardhat.config.js         # Configuración Hardhat + red Besu
├── package.json
└── README.md
```

## Hyperledger Besu (Docker)

### docker-compose.yml

```yaml
services:
  besu:
    image: hyperledger/besu:latest
    container_name: besu-node
    ports:
      - "8545:8545"
    volumes:
      - ./data:/opt/besu/data
    command:
      - --network=dev
      - --data-path=/opt/besu/data
      - --rpc-http-enabled
      - --rpc-http-host=0.0.0.0
      - --rpc-http-api=ETH,NET,WEB3,TXPOOL
      - --host-allowlist=*
```

### Iniciar Besu

```bash
cd blockchain
docker compose up -d
```

El nodo Besu se inicia en **modo dev** (minería automática) en `http://127.0.0.1:8545`.

## Smart Contract: CredentialRegistry.sol

### Descripción
Registro descentralizado de credenciales mediante hash. Implementa el patrón SSI (Self-Sovereign Identity) donde el hash de la credencial se almacena en blockchain y el contenido sensible permanece fuera de ella.

### Funciones

```solidity
function registerCredential(string memory _hash) public
```
- Registra un hash de credencial en la blockchain
- Emite evento `CredentialRegistered(hash, issuer, timestamp)`
- Revierte si el hash ya existe

```solidity
function verifyCredential(string memory _hash)
    public view returns (bool, uint256, address)
```
- Retorna si el hash existe, timestamp de registro, y dirección del emisor
- Si no existe: `(false, 0, address(0))`

### Eventos

```solidity
event CredentialRegistered(string hash, address issuer, uint256 timestamp);
```

### Estructuras

```solidity
struct Credential {
    string hash;
    uint256 timestamp;
    address issuer;
}
```

## Hardhat Configuration

### hardhat.config.js

```js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    besu: {
      url: process.env.BESU_RPC_URL || "http://127.0.0.1:8545",
      chainId: 1337,
      gasPrice: 0,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

### package.json scripts

```json
{
  "scripts": {
    "test": "hardhat test",
    "compile": "hardhat compile",
    "deploy:besu": "hardhat ignition deploy ./ignition/modules/CredentialRegistry.js --network besu"
  }
}
```

## Variables de Entorno (blockchain/.env)

```env
PRIVATE_KEY=0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63
BESU_RPC_URL=http://127.0.0.1:8545
```

- `PRIVATE_KEY`: Clave privada pre-fondeada del modo dev de Besu
- `BESU_RPC_URL`: URL del nodo Besu (default: http://127.0.0.1:8545)

## Comandos

```bash
# Compilar contratos
npx hardhat compile

# Ejecutar tests
npx hardhat test

# Desplegar con Hardhat Ignition en Besu
npx hardhat ignition deploy ./ignition/modules/CredentialRegistry.js --network besu

# Desplegar con script alternativo
npx hardhat run scripts/deploy.js --network besu
```

## Tests

### CredentialRegistry.js (3 tests)

1. **Registra una credencial por hash** - Verifica emisión de evento `CredentialRegistered` y datos correctos
2. **Rechaza registrar el mismo hash dos veces** - Verifica revert con "Credential already exists"
3. **Retorna inválido para hash no registrado** - Verifica `(false, 0, address(0))`

## Deployments

Los deployments realizados en Besu (chainId 1337) se almacenan en:
```
ignition/deployments/chain-1337/
├── artifacts/
├── build-info/
└── journal.jsonl
```

## Notas

- La cuenta genesis de Besu en modo dev tiene fondos ilimitados para pruebas
- `gasPrice: 0` porque en modo dev el gas es gratuito
- El contrato `CredentialRegistry` es el contrato principal del sistema SSI
- El archivo `config/qbftConfigFile.json` está vacío - pendiente de configuración para modo QBFT (producción)
- Los datos del nodo Besu (`data/`) no se versionan en git (.gitignore)
