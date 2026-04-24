/**
 * Verifica se um usuário tem acesso a uma igreja.
 * Permite: admin master, própria igreja, ou pastor geral acessando filial da sua rede.
 */
export function hasChurchAccess(
  user: { role: string; churchId: string | null },
  church: { id: string; parentChurchId: string | null }
): boolean {
  if (user.role === 'MASTER') return true
  if (user.churchId === church.id) return true
  if (church.parentChurchId && church.parentChurchId === user.churchId) return true
  return false
}
