import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'Ecclesia <noreply@ecclesiaa.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ecclesiaa.com'
const LOGO_URL = 'https://ecclesiaa.com/logo-ecclesia.png'
const SUPPORT_EMAIL = 'ecclesiasas014@gmail.com'

function emailWrapper(headerBg: string, headerContent: string, bodyContent: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;margin:0;padding:32px 16px;">
      <div style="max-width:520px;margin:0 auto;background:white;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">

        <!-- Logo header -->
        <div style="background:white;padding:20px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
          <img src="${LOGO_URL}" alt="Ecclesia" style="height:44px;object-fit:contain;" />
        </div>

        <!-- Colored banner -->
        <div style="background:${headerBg};padding:28px 32px;">
          ${headerContent}
        </div>

        <!-- Body -->
        <div style="padding:32px;">
          ${bodyContent}
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #f1f5f9;padding:18px 32px;background:#f8fafc;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            Dúvidas? <a href="mailto:${SUPPORT_EMAIL}" style="color:#6C2BD9;text-decoration:none;">${SUPPORT_EMAIL}</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `
}

const G_BRAND = 'linear-gradient(135deg,#1E2A78 0%,#6C2BD9 100%)'
const G_WARN  = 'linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)'
const G_RED   = 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)'

export async function sendOnboardingEmail(email: string, token: string, plan: string) {
  const link = `${APP_URL}/cadastro?token=${token}`
  const planLabel = plan === 'REDE' ? 'Plano Rede' : 'Plano Igreja'
  const planPrice = plan === 'REDE' ? 'R$ 199,90/mês' : 'R$ 79,90/mês'

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Crie sua conta no Ecclesia',
    html: emailWrapper(
      G_BRAND,
      `<h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Pagamento confirmado!</h1>
       <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">${planLabel} — ${planPrice}</p>`,
      `<p style="color:#475569;font-size:15px;margin:0 0 24px;line-height:1.6;">
        Obrigado pela assinatura! Clique no botão abaixo para criar a conta da sua igreja.<br>
        O link é válido por <strong>48 horas</strong>.
       </p>
       <a href="${link}" style="display:block;background:${G_BRAND};color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:24px;">
         Criar minha conta →
       </a>
       <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
         Se o botão não funcionar, copie e cole este link no navegador:<br>
         <span style="color:#6C2BD9;word-break:break-all;">${link}</span>
       </p>`
    ),
  })
}

export async function sendWelcomeEmail(email: string, churchName: string, slug: string) {
  const loginUrl = `https://${slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN || 'ecclesiaa.com'}/login`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Sua conta no Ecclesia está pronta — ${churchName}`,
    html: emailWrapper(
      G_BRAND,
      `<h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Conta criada com sucesso!</h1>
       <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">${churchName}</p>`,
      `<p style="color:#475569;font-size:15px;margin:0 0 16px;line-height:1.6;">
        Seu sistema de gestão está pronto. Acesse com o link da sua igreja:
       </p>
       <div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:0 0 24px;font-family:monospace;font-size:13px;color:#475569;word-break:break-all;">
         ${loginUrl}
       </div>
       <a href="${loginUrl}" style="display:block;background:${G_BRAND};color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;">
         Acessar meu painel →
       </a>`
    ),
  })
}

export async function sendInvoiceCreatedEmail(email: string, churchName: string, amount: number, dueDate: string) {
  const formatted = new Date(dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const amountFmt = amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Nova fatura Ecclesia — ${amountFmt} vence em ${formatted}`,
    html: emailWrapper(
      G_BRAND,
      `<h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Nova fatura disponível</h1>
       <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">${churchName}</p>`,
      `<div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
         <span style="color:#64748b;font-size:14px;">Valor</span>
         <span style="color:#1e293b;font-size:20px;font-weight:700;">${amountFmt}</span>
       </div>
       <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
         <span style="color:#64748b;font-size:14px;">Vencimento</span>
         <span style="color:#1e293b;font-size:15px;font-weight:600;">${formatted}</span>
       </div>
       <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">
         Acesse o email da fatura enviado pelo Asaas para pagar via PIX, boleto ou cartão.
       </p>`
    ),
  })
}

export async function sendPaymentOverdueEmail(email: string, churchName: string, amount: number, invoiceUrl?: string) {
  const amountFmt = amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Fatura vencida — regularize para manter o acesso ao Ecclesia`,
    html: emailWrapper(
      G_WARN,
      `<h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Fatura vencida</h1>
       <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">${churchName}</p>`,
      `<p style="color:#475569;font-size:15px;margin:0 0 24px;line-height:1.6;">
         Sua fatura de <strong>${amountFmt}</strong> está em aberto. Regularize o pagamento para garantir a continuidade do acesso ao sistema.
       </p>
       ${invoiceUrl ? `<a href="${invoiceUrl}" style="display:block;background:${G_WARN};color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:16px;">Pagar agora →</a>` : ''}
       <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">
         O acesso ao sistema pode ser suspenso em caso de inadimplência prolongada.
       </p>`
    ),
  })
}

export async function sendPaymentDeclinedEmail(email: string, churchName: string, invoiceUrl?: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Pagamento recusado — atualize sua forma de pagamento no Ecclesia`,
    html: emailWrapper(
      G_RED,
      `<h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Pagamento recusado</h1>
       <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">${churchName}</p>`,
      `<p style="color:#475569;font-size:15px;margin:0 0 24px;line-height:1.6;">
         Não conseguimos processar seu pagamento. Isso pode ter acontecido por saldo insuficiente, cartão expirado ou dados incorretos.
       </p>
       ${invoiceUrl ? `<a href="${invoiceUrl}" style="display:block;background:${G_RED};color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:16px;">Tentar novamente →</a>` : ''}
       <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">
         Se o problema persistir, entre em contato com o suporte.
       </p>`
    ),
  })
}

export async function sendMemberPasswordResetEmail(email: string, name: string, token: string) {
  const link = `${APP_URL}/membro/redefinir-senha?token=${token}`
  const firstName = name.split(' ')[0]

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Redefinir senha — Área do Membro',
    html: emailWrapper(
      G_BRAND,
      `<h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Olá, ${firstName}!</h1>
       <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Redefinição de senha — Área do Membro</p>`,
      `<p style="color:#475569;font-size:15px;margin:0 0 24px;line-height:1.6;">
         Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>15 minutos</strong>.
       </p>
       <a href="${link}" style="display:block;background:${G_BRAND};color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:24px;">
         Criar nova senha →
       </a>
       <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
         Se você não solicitou isso, ignore este email.
       </p>`
    ),
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${APP_URL}/redefinir-senha?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Redefinição de senha — Ecclesia',
    html: emailWrapper(
      G_BRAND,
      `<h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Redefinir senha</h1>
       <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Ecclesia</p>`,
      `<p style="color:#475569;font-size:15px;margin:0 0 24px;line-height:1.6;">
         Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo — o link é válido por <strong>15 minutos</strong>.
       </p>
       <a href="${link}" style="display:block;background:${G_BRAND};color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:24px;">
         Redefinir minha senha →
       </a>
       <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
         Se você não solicitou isso, ignore este email. Sua senha permanece a mesma.<br><br>
         Link direto: <span style="color:#6C2BD9;word-break:break-all;">${link}</span>
       </p>`
    ),
  })
}
