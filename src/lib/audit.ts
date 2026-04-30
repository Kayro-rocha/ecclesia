import { prisma } from '@/lib/prisma'

export async function audit(userName: string, action: string, target: string, detail?: string) {
  await prisma.auditLog.create({ data: { userName, action, target, detail } }).catch(() => {})
}
