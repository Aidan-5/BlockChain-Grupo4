# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema de Identidad Digital Descentralizada (SSI) para Ecuador. Three independent sub-projects, each with its own `package.json` and dependency tree — there is no root-level workspace/monorepo tooling, so all commands below must be run from inside the relevant subfolder:

- **`Backend/`** — NestJS + Prisma + MySQL API
- **`Frontend/`** — React 19 + Vite + TypeScript SPA
- **`blockchain/`** — Hardhat + Solidity smart contract, deployed to a local Hyperledger Besu node

## Commands

### Backend (`cd Backend`)
```bash
npm run start:dev          # dev server w/ watch, http://localhost:3000
npm run build               # nest build
npm run lint                 # eslint --fix on src/apps/libs/test
npm test                     # jest unit tests (*.spec.ts, colocated with source)
npm test -- users.service    # run a single spec by filename match
npm run test:e2e             # jest against test/jest-e2e.json
npm run test:cov             # coverage
npx prisma generate           # regenerate Prisma client after schema.prisma changes
npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma migrate status
node seedAdmin.js             # seeds an ADMIN user (admin@registro.gob.ec / admin123)
```
Requires a `Backend/.env` with `DATABASE_URL="mysql://root:PASSWORD@localhost:3306/identidad_digital_ssi"` (MySQL must be running first). Optional blockchain integration vars: `BESU_RPC_URL`, `BLOCKCHAIN_PRIVATE_KEY`, `CONTRACT_ADDRESS`.

On Windows, if Prisma throws `EPERM`, stop the dev server (or `taskkill /F /IM node.exe`) before rerunning `npx prisma generate`.

### Frontend (`cd Frontend`)
```bash
npm run dev        # vite dev server, http://localhost:5173
npm run build       # tsc -b && vite build
npm run lint         # oxlint
npm run preview
```
Assumes the backend is reachable at `http://localhost:3000` (hardcoded in page components via axios, no proxy config).

### Blockchain (`cd blockchain`)
```bash
npx hardhat compile
npx hardhat test                      # runs test/CredentialRegistry.js, test/Lock.js
npx hardhat node                      # local in-memory chain (alternative to Besu)
docker compose up -d                  # starts Besu dev-mode node on :8545
npx hardhat ignition deploy ./ignition/modules/CredentialRegistry.js --network besu
```
Requires `blockchain/.env` with `PRIVATE_KEY` and `BESU_RPC_URL` (see `.env.example`). After deploying, the resulting contract address must be copied into `Backend/.env` as `CONTRACT_ADDRESS`, and the ABI in `Backend/src/blockchain/credential-registry.abi.ts` kept in sync with `CredentialRegistry.sol`.

## Architecture

### Backend module graph
`AppModule` wires: `UsersModule`, `InstitutionsModule`, `CredentialsModule`, `BlockchainModule`, `WalletModule`, `PrismaModule`, `AuthModule`, `SolicitudesModule`. Each feature module follows the standard Nest triad (`*.controller.ts` / `*.module.ts` / `*.service.ts`, DTOs in `dto/`), with `*.spec.ts` colocated next to the file it tests.

Key cross-module relationships:
- **`CredentialsService`** is the hub: it depends on `PrismaService`, `WalletService`, and `BlockchainService`. Issuing a credential (`POST /credentials`) computes a SHA-256 hash of the credential payload via `WalletService.generateCredentialHash`, optionally anchors it on-chain via `BlockchainService.registerCredential` (only `if blockchainService.isReady()`), then persists the `Credencial` row with the resulting hash.
- **`BlockchainService`** (`Backend/src/blockchain/blockchain.service.ts`) is a soft dependency: if `BLOCKCHAIN_PRIVATE_KEY`/`CONTRACT_ADDRESS` aren't set in `.env`, `onModuleInit` logs a warning and leaves the service in a not-ready state instead of throwing — callers must check `isReady()` before assuming on-chain calls will succeed. It talks to the chain via `ethers.Contract` using the ABI hand-copied into `credential-registry.abi.ts` (there's no shared-types generation step between `blockchain/` and `Backend/`).
- **`SolicitudesService`** implements the citizen request → admin approval flow: a citizen creates a `Solicitud` (PENDIENTE), an admin calls `approve()` which flips the state to APROBADA and directly creates a `Credencial` (bypassing `CredentialsService`/`BlockchainService` — the "private key" generated here is a SHA-256 digest of cédula + a hardcoded salt, not a real on-chain registration).
- **`AuthService`** issues JWTs via `@nestjs/jwt`; role is `CIUDADANO` unless the registration payload's `codigoSecreto` matches a hardcoded admin bootstrap code. Login has a plaintext-password fallback for rows seeded before bcrypt hashing was introduced.
- All persistence goes through the single global `PrismaModule` (`PrismaService` extends `PrismaClient`).

### Data model (`Backend/prisma/schema.prisma`)
MySQL via Prisma. Core entities: `Usuario` (role `CIUDADANO`/`ADMIN`, optional `wallet`/`did`), `Institucion`, `Credencial` (belongs to both a `Usuario` and `Institucion`, carries the optional `hashBlockchain`), `Solicitud` (citizen identity request, `estado` enum `PENDIENTE`/`APROBADA`/`RECHAZADA`). Field/model names are in Spanish — match that convention when extending the schema.

### Blockchain layer
`blockchain/contracts/CredentialRegistry.sol` is the only real contract (`Lock.sol` is unmodified Hardhat boilerplate). It stores `Credential{hash, timestamp, issuer}` keyed by hash, exposes `registerCredential(hash)` (reverts on duplicate hash) and `verifyCredential(hash) -> (bool, uint256, address)`. Deployed to a Hyperledger Besu dev-mode node (chainId 1337, zero gas price) run via `docker-compose.yml`; Hardhat Ignition deployment artifacts live under `ignition/deployments/chain-1337/`.

### Frontend
Single-page app, no state management library — auth state (`user: {nombre, rol}`) lives in a `useState` at the top of `App.tsx` and is passed down as props; JWT persists in `localStorage`. Routing is role-conditional (ADMIN sees `/admin`, others see `/`, `/solicitar`, `/verificador`) but there is no route guard — visibility is UI-only (nav links hidden), not enforced client-side. Every page in `src/pages/` talks directly to the backend via axios against a hardcoded `http://localhost:3000` base (no `.env`/proxy indirection). Styling is plain CSS (`App.css`/`index.css`) with a dark glassmorphism theme, no CSS framework.

## Documentation

`docs/Configuracion_Backend.md`, `docs/Configuracion_Blockchain.md`, and `docs/Configuracion_Frontend.md` contain detailed, up-to-date endpoint tables, full folder trees, and env-var references for each sub-project — consult them before exploring a subsystem from scratch.
