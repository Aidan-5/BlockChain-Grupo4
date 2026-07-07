# Configuracion_Backend.md

# Configuración del Backend

Este documento describe paso a paso la configuración realizada en el backend del proyecto **BlockChain-Grupo4**, incluyendo las herramientas utilizadas, comandos ejecutados, problemas encontrados y recomendaciones para futuras configuraciones.

---

# Tecnologías Utilizadas

| Tecnología | Versión |
|------------|----------|
| Node.js | v22.x |
| NestJS | v11 |
| Prisma ORM | v6.19.3 |
| MySQL Server | 8.x |
| MySQL Workbench | Última |
| TypeScript | 5.x |
| npm | Incluido con Node.js |

---

# Estructura del Proyecto

```text
BlockChain-Grupo4
│
├── Backend
│   ├── prisma
│   ├── src
│   ├── node_modules
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── Frontend
```

---

# Paso 1 - Crear la estructura del proyecto

## Terminal (Raíz del Proyecto)

```bash
mkdir Backend
mkdir Frontend
```

---

# Paso 2 - Verificar Node.js

## Terminal (Backend)

```bash
node -v
npm -v
```

---

# Paso 3 - Instalar NestJS CLI

## Terminal (Global)

```bash
npm install -g @nestjs/cli
```

Verificar instalación:

```bash
nest --version
```

---

# Paso 4 - Crear el Backend

## Terminal (Backend)

```bash
cd Backend
```

```bash
nest new .
```

Seleccionar:

```text
npm
```

---

# Paso 5 - Ejecutar el servidor

## Terminal (Backend)

```bash
npm run start:dev
```

Servidor disponible en:

```text
http://localhost:3000
```

---

# Paso 6 - Crear Base de Datos

Abrir MySQL Workbench.

Ejecutar:

```sql
CREATE DATABASE identidad_digital_ssi;
```

Verificar:

```sql
SHOW DATABASES;
```

---

# Paso 7 - Instalar Prisma

## Terminal (Backend)

Instalar Prisma:

```bash
npm install prisma@6 --save-dev
```

Instalar Prisma Client:

```bash
npm install @prisma/client@6
```

---

# Paso 8 - Inicializar Prisma

## Terminal (Backend)

```bash
npx prisma init
```

Se generan:

```text
.env

prisma/
    schema.prisma
```

---

# Paso 9 - Configurar conexión MySQL

Archivo:

```text
Backend/.env
```

```env
DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/identidad_digital_ssi"
```

Ejemplo:

```env
DATABASE_URL="mysql://root:123456@localhost:3306/identidad_digital_ssi"
```

---

# Paso 10 - Configurar schema.prisma

Archivo:

```text
Backend/prisma/schema.prisma
```

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Usuario {
  id          Int      @id @default(autoincrement())
  nombre      String
  email       String   @unique
  wallet      String?  @unique
  did         String?  @unique
  createdAt   DateTime @default(now())
}

model Institucion {
  id          Int      @id @default(autoincrement())
  nombre      String
  tipo        String
  createdAt   DateTime @default(now())
}
```

---

# Paso 11 - Crear la primera migración

## Terminal (Backend)

```bash
npx prisma migrate dev --name init
```

---

# Paso 12 - Generar Prisma Client

## Terminal (Backend)

```bash
npx prisma generate
```

---

# Paso 13 - Crear módulos de NestJS

## Terminal (Backend)

Usuarios

```bash
nest g module users
nest g controller users
nest g service users
```

Instituciones

```bash
nest g module institutions
nest g controller institutions
nest g service institutions
```

Credenciales

```bash
nest g module credentials
nest g controller credentials
nest g service credentials
```

Blockchain

```bash
nest g module blockchain
nest g service blockchain
```

Wallet

```bash
nest g module wallet
nest g service wallet
```

Prisma

```bash
nest g module prisma
nest g service prisma
```

---

# Paso 14 - Configurar PrismaService

Archivo:

```text
src/prisma/prisma.service.ts
```

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {

  async onModuleInit() {
    await this.$connect();
  }

}
```

---

# Paso 15 - Configurar PrismaModule

Archivo:

```text
src/prisma/prisma.module.ts
```

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

# Paso 16 - Registrar PrismaModule

Archivo:

```text
src/app.module.ts
```

Agregar:

```typescript
imports: [
    PrismaModule,
]
```

---

# Paso 17 - DTO Usuario

Archivo

```text
src/users/dto/create-user.dto.ts
```

```typescript
export class CreateUserDto {

  nombre: string;

  email: string;

  wallet?: string;

  did?: string;

}
```

---

# Paso 18 - UsersService

Archivo

```text
src/users/users.service.ts
```

Se implementó:

- Crear usuario.
- Listar usuarios.

Utilizando Prisma Client.

---

# Paso 19 - UsersController

Archivo

```text
src/users/users.controller.ts
```

Endpoints implementados:

```http
GET /users
```

```http
POST /users
```

---

# Pruebas realizadas

## Obtener usuarios

```http
GET http://localhost:3000/users
```

Respuesta inicial

```json
[]
```

Después de insertar un usuario

```json
[
    {
        "id":1,
        "nombre":"Aidan Carpio",
        "email":"aidan@uide.edu.ec",
        "wallet":"0x123456789",
        "did":"did:besu:0x123456789",
        "createdAt":"2026-07-07T07:24:59.529Z"
    }
]
```

---

# Migraciones realizadas

Primera migración

```bash
npx prisma migrate dev --name init
```

Agregar DID y Wallet

```bash
npx prisma migrate dev --name add_did_wallet
```

Agregar Institución

```bash
npx prisma migrate dev --name add_institucion
```

---

# Problemas encontrados

## Prisma 7

Inicialmente se instaló Prisma 7.

Problemas encontrados:

- Cambios en la configuración.
- Incompatibilidad con ejemplos de NestJS.
- Errores en PrismaClient.

### Solución

Desinstalar Prisma 7

```bash
npm uninstall prisma @prisma/client
```

Instalar Prisma 6

```bash
npm install prisma@6 @prisma/client@6
```

Eliminar:

```text
prisma.config.ts
```

---

## Error EPERM

Error:

```text
EPERM:
operation not permitted
query_engine-windows.dll.node
```

### Causa

NestJS estaba utilizando Prisma mientras se ejecutaban migraciones.

### Solución

Detener el servidor:

```bash
Ctrl + C
```

Finalizar procesos:

```bash
taskkill /F /IM node.exe
```

Generar nuevamente:

```bash
npx prisma generate
```

Volver a iniciar:

```bash
npm run start:dev
```

---

# Comandos más utilizados

Ejecutar servidor

```bash
npm run start:dev
```

Generar Prisma Client

```bash
npx prisma generate
```

Crear migración

```bash
npx prisma migrate dev --name nombre_migracion
```

Estado de migraciones

```bash
npx prisma migrate status
```

Versión Prisma

```bash
npx prisma --version
```

---

# Arquitectura actual

```text
Cliente
    │
    ▼
NestJS
    │
    ▼
Controllers
    │
    ▼
Services
    │
    ▼
Prisma ORM
    │
    ▼
MySQL
```

---

# Estado actual del Backend

✅ Backend creado

✅ NestJS configurado

✅ MySQL configurado

✅ Prisma ORM configurado

✅ Prisma Client generado

✅ Base de datos conectada

✅ Modelo Usuario implementado

✅ Modelo Institucion implementado

✅ DTO Usuario implementado

✅ Endpoint GET /users

✅ Endpoint POST /users

✅ Persistencia de datos funcionando

---

# Recomendaciones

- Utilizar siempre Prisma 6 para mantener compatibilidad con la documentación utilizada en este proyecto.
- Detener el servidor de NestJS antes de ejecutar migraciones o regenerar Prisma Client.
- Crear una migración por cada cambio importante en el esquema de la base de datos.
- Mantener separados los módulos por responsabilidad (Users, Institutions, Credentials, Blockchain y Wallet).
- No almacenar información sensible directamente en la blockchain; únicamente hashes, identificadores (DID), firmas digitales y direcciones de wallet.
- Documentar cada nueva funcionalidad implementada para facilitar el mantenimiento del proyecto.

---

# Próximos pasos

- Implementar el módulo de Instituciones.
- Implementar el módulo de Credenciales.
- Relacionar Usuarios con Instituciones.
- Integrar Hyperledger Besu.
- Desarrollar Smart Contracts en Solidity.
- Conectar el backend con la blockchain mediante ethers.js.
- Implementar autenticación con JWT.
- Integrar MetaMask.
- Desarrollar el frontend con React.