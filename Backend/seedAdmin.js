const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@registro.gob.ec';
  const existing = await prisma.usuario.findUnique({ where: { email } });
  
  if (!existing) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.usuario.create({
      data: {
        nombre: 'Administrador Principal',
        email,
        password: hashedPassword,
        rol: 'ADMIN'
      }
    });
    console.log('✅ Admin creado: email: admin@registro.gob.ec | pass: admin123');
  } else {
    console.log('⚠️ El Admin ya existe.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
