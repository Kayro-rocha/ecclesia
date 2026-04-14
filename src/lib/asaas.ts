function getAsaasUrl() {
  return process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'
}

function getHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'access_token': apiKey,
  }
}

// Usa a apiKey da subconta da igreja, com fallback para a master (sandbox/teste)
export function getChurchApiKey(church: { asaasApiKey?: string | null }) {
  return church.asaasApiKey || process.env.ASAAS_API_KEY || ''
}

// Cria subconta filha no Asaas para a igreja durante o onboarding
// Usa a chave master — o dinheiro dos membros cai na subconta da igreja, não na sua
export async function createAsaasSubaccount(church: {
  name: string
  email: string
  cpfCnpj: string
  mobilePhone: string
  postalCode?: string
  birthDate?: string
  incomeValue?: number
}) {
  const res = await fetch(`${getAsaasUrl()}/accounts`, {
    method: 'POST',
    headers: getHeaders(process.env.ASAAS_API_KEY || ''),
    body: JSON.stringify({
      name: church.name,
      email: church.email,
      cpfCnpj: church.cpfCnpj.replace(/\D/g, ''),
      mobilePhone: church.mobilePhone.replace(/\D/g, ''),
      postalCode: church.postalCode?.replace(/\D/g, ''),
      birthDate: church.birthDate || undefined,
      incomeValue: church.incomeValue ?? 0,
      companyType: 'ASSOCIATION',
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.description || 'Erro ao criar subconta no Asaas')
  }

  return data as { id: string; apiKey: string }
}

export async function createOrFindAsaasCustomer(
  apiKey: string,
  member: { name: string; phone: string; cpfCnpj?: string | null; email?: string | null }
) {
  const search = await fetch(
    `${getAsaasUrl()}/customers?name=${encodeURIComponent(member.name)}&limit=1`,
    { headers: getHeaders(apiKey) }
  )
  const searchData = await search.json()

  if (searchData.data?.length > 0) {
    const existing = searchData.data[0]
    // Se o customer existe mas não tem CPF e agora temos, atualiza
    if (!existing.cpfCnpj && member.cpfCnpj) {
      await fetch(`${getAsaasUrl()}/customers/${existing.id}`, {
        method: 'PUT',
        headers: getHeaders(apiKey),
        body: JSON.stringify({ cpfCnpj: member.cpfCnpj.replace(/\D/g, '') }),
      })
    }
    return existing.id as string
  }

  const res = await fetch(`${getAsaasUrl()}/customers`, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      name: member.name,
      mobilePhone: member.phone.replace(/\D/g, ''),
      cpfCnpj: member.cpfCnpj ? member.cpfCnpj.replace(/\D/g, '') : undefined,
      email: member.email || undefined,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.description || 'Erro ao criar customer no Asaas')
  return data.id as string
}

export async function createPixCharge(
  apiKey: string,
  customerId: string,
  value: number,
  description: string,
  dueDate: string
) {
  const res = await fetch(`${getAsaasUrl()}/payments`, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value,
      dueDate,
      description,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.description || 'Erro ao criar cobrança PIX')
  return data as { id: string; status: string }
}

export async function registerAsaasWebhook(apiKey: string, webhookUrl: string, authToken?: string) {
  const res = await fetch(`${getAsaasUrl()}/webhooks`, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      name: 'Ecclesia Pagamentos',
      url: webhookUrl,
      email: 'webhooks@ecclesia.app',
      sendType: 'SEQUENTIALLY',
      enabled: true,
      interrupted: false,
      authToken: authToken || undefined,
      events: ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'],
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('Erro ao registrar webhook Asaas:', data)
  }
  return data
}

export async function getAsaasBalance(apiKey: string) {
  const res = await fetch(`${getAsaasUrl()}/finance/balance`, {
    headers: getHeaders(apiKey),
  })
  const data = await res.json()
  if (!res.ok) throw new Error('Erro ao consultar saldo Asaas')
  return data as { balance: number; totalBalance: number }
}

export async function requestAsaasWithdrawal(
  apiKey: string,
  value: number,
  pixAddressKey: string,
  pixAddressKeyType: string,
  description?: string
) {
  // Telefone precisa de +55 e apenas dígitos
  let formattedKey = pixAddressKey
  if (pixAddressKeyType === 'PHONE') {
    const digits = pixAddressKey.replace(/\D/g, '')
    formattedKey = `+55${digits.startsWith('55') ? digits.slice(2) : digits}`
  }
  // CPF/CNPJ: só dígitos
  if (pixAddressKeyType === 'CPF' || pixAddressKeyType === 'CNPJ') {
    formattedKey = pixAddressKey.replace(/\D/g, '')
  }

  const res = await fetch(`${getAsaasUrl()}/transfers`, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      value,
      pixAddressKey: formattedKey,
      pixAddressKeyType,
      description: description || 'Saque Ecclesia',
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.description || 'Erro ao solicitar saque')
  }
  return data
}

export async function getPixQrCode(apiKey: string, chargeId: string) {
  const res = await fetch(`${getAsaasUrl()}/payments/${chargeId}/pixQrCode`, {
    headers: getHeaders(apiKey),
  })

  const data = await res.json()
  if (!res.ok) throw new Error('Erro ao buscar QR Code PIX')
  return data as { encodedImage: string; payload: string }
}
