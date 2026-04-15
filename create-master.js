// Cria um usuário MASTER para acessar o painel admin
// Uso: node create-master.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'kayrorocha09@gmail.com'
  const password = process.argv[3] || 'Kayro@tima0'
  const name = process.argv[4] || 'kayro'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    if (existing.role === 'MASTER') {
      console.log(`Usuário MASTER já existe: ${email}`)
    } else {
      await prisma.user.update({ where: { email }, data: { role: 'MASTER' } })
      console.log(`Usuário ${email} promovido para MASTER`)
    }
    return
  }

  const hash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, password: hash, role: 'MASTER', churchId: null },
  })
  console.log(`✓ Usuário MASTER criado: ${email} / ${password}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
