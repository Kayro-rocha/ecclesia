const BASE = process.env.EVOLUTION_API_URL!
const KEY  = process.env.EVOLUTION_API_KEY!

const headers = () => ({
  'Content-Type': 'application/json',
  'apikey': KEY,
})

export type InstanceStatus = 'open' | 'close' | 'connecting' | 'notfound'

export async function getInstanceStatus(instanceName: string): Promise<{ status: InstanceStatus; number?: string }> {
  try {
    const res = await fetch(`${BASE}/instance/connectionState/${instanceName}`, { headers: headers() })
    if (res.status === 404) return { status: 'notfound' }
    const data = await res.json()
    const state = data?.instance?.state ?? data?.state ?? 'close'
    const number = data?.instance?.ownerJid?.replace('@s.whatsapp.net', '') ?? undefined
    return { status: state as InstanceStatus, number }
  } catch {
    return { status: 'notfound' }
  }
}

export async function getOrCreateQr(instanceName: string): Promise<{ qr?: string; status: InstanceStatus }> {
  // Verifica se já existe
  const { status } = await getInstanceStatus(instanceName)

  if (status === 'open') return { status: 'open' }

  if (status === 'notfound') {
    // Cria nova instância
    const res = await fetch(`${BASE}/instance/create`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
    })
    const data = await res.json()
    const qr = data?.qrcode?.base64 ?? data?.base64 ?? undefined
    return { qr, status: 'connecting' }
  }

  // Instância existe mas está fechada — pede novo QR
  const res = await fetch(`${BASE}/instance/connect/${instanceName}`, { headers: headers() })
  const data = await res.json()
  const qr = data?.base64 ?? data?.qrcode?.base64 ?? undefined
  return { qr, status: 'connecting' }
}

export async function disconnectInstance(instanceName: string): Promise<void> {
  await fetch(`${BASE}/instance/logout/${instanceName}`, { method: 'DELETE', headers: headers() })
  await fetch(`${BASE}/instance/delete/${instanceName}`, { method: 'DELETE', headers: headers() })
}

export async function sendText(instanceName: string, phone: string, text: string): Promise<boolean> {
  const number = phone.replace(/\D/g, '')
  const withCode = number.startsWith('55') ? number : `55${number}`
  try {
    const res = await fetch(`${BASE}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ number: withCode, text }),
    })
    return res.ok
  } catch {
    return false
  }
}
