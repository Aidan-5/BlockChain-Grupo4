# BlockChain-Grupo4

Sistema de **Identidad Digital Descentralizada (SSI)** utilizando **NestJS**, **MySQL**, **Prisma ORM** y **Hyperledger Besu**.

---

# Miembros

- Aidan Alexander Carpio Yaguachi
- Sebastian Alejandro Chocho Silva

---

# Requisitos

Antes de ejecutar el proyecto, instalar:

- Node.js 22 o superior
- MySQL Server 8+
- MySQL Workbench
- Git

---

# Clonar el repositorio

```bash
git clone https://github.com/USUARIO/BlockChain-Grupo4.git
```

Entrar al proyecto

```bash
cd BlockChain-Grupo4
```

---

# Configurar el Backend

Entrar a la carpeta

```bash
cd Backend
```

Instalar dependencias

```bash
npm install
```

Crear el archivo `.env`

```env
DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/identidad_digital_ssi"
```

Generar Prisma Client

```bash
npx prisma generate
```

Aplicar las migraciones

```bash
npx prisma migrate dev
```

Iniciar el servidor

```bash
npm run start:dev
```

Servidor disponible en

```text
http://localhost:3000
```

---

# Configurar el Frontend

Entrar a la carpeta

```bash
cd ../Frontend
```

Instalar dependencias

```bash
npm install
```

Iniciar el proyecto

```bash
npm run dev
```

---

# Comandos útiles (Backend)

Instalar dependencias

```bash
npm install
```

Ejecutar el servidor

```bash
npm run start:dev
```

Compilar el proyecto

```bash
npm run build
```

Generar Prisma Client

```bash
npx prisma generate
```

Crear una migración

```bash
npx prisma migrate dev --name nombre_migracion
```

Ver estado de las migraciones

```bash
npx prisma migrate status
```

Ver versión de Prisma

```bash
npx prisma --version
```

Ejecutar pruebas

```bash
npm test
```

---

# Estructura del Proyecto

```text
BlockChain-Grupo4
│
├── Backend
│   ├── prisma
│   ├── src
│   └── package.json
│
├── Frontend
│
└── README.md
```

---

# Tecnologías

- NestJS
- Prisma ORM
- MySQL
- TypeScript
- Hyperledger Besu
- Solidity
- React (Frontend)

---

# Notas

- Ejecutar primero MySQL antes de iniciar el backend.
- Verificar que el archivo `.env` esté correctamente configurado.
- Ejecutar `npx prisma generate` después de modificar el archivo `schema.prisma`.
- Si se crea una nueva migración, ejecutar `npx prisma migrate dev --name nombre_migracion`.
- Si aparece un error `EPERM` al usar Prisma en Windows, detener primero el servidor (`Ctrl + C`) y luego volver a ejecutar `npx prisma generate`.