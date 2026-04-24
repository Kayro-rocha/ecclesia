import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'Ecclesia <noreply@marketcontroll.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://marketcontroll.com'

export async function sendOnboardingEmail(email: string, token: string, plan: string) {
  const link = `${APP_URL}/cadastro?token=${token}`
  const planLabel = plan === 'REDE' ? 'Plano Rede' : 'Plano Igreja'

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Crie sua conta no Ecclesia',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px;">
        <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
            <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: white; margin-bottom: 12px;">E</div>
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">Pagamento confirmado!</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">${planLabel} — R$ ${plan === 'REDE' ? '199,90' : '79,90'}/mês</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #475569; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
              Obrigado pela assinatura! Clique no botão abaixo para criar a conta da sua igreja. O link é válido por <strong>48 horas</strong>.
            </p>
            <a href="${link}" style="display: block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 10px; font-size: 15px; font-weight: 600; margin-bottom: 24px;">
              Criar minha conta →
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.6;">
              Se o botão não funcionar, copie e cole este link no navegador:<br>
              <span style="color: #6366f1; word-break: break-all;">${link}</span>
            </p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding: 20px 32px; background: #f8fafc;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
              Dúvidas? Entre em contato: <a href="mailto:suporte@marketcontroll.com" style="color: #6366f1;">suporte@marketcontroll.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendInvoiceCreatedEmail(email: string, churchName: string, amount: number, dueDate: string) {
  const formatted = new Date(dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const amountFmt = amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Nova fatura Ecclesia — ${amountFmt} vence em ${formatted}`,
    html: `
      <!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
      <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
          <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Nova fatura disponível</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">${churchName}</p>
        </div>
        <div style="padding:32px;">
          <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#64748b;font-size:14px;">Valor</span>
            <span style="color:#1e293b;font-size:20px;font-weight:700;">${amountFmt}</span>
          </div>
          <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#64748b;font-size:14px;">Vencimento</span>
            <span style="color:#1e293b;font-size:15px;font-weight:600;">${formatted}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">Acesse o email da fatura enviado pelo Asaas para pagar via PIX, boleto ou cartão.</p>
        </div>
        <div style="border-top:1px solid #f1f5f9;padding:16px 32px;background:#f8fafc;">
          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">Dúvidas? <a href="mailto:suporte@marketcontroll.com" style="color:#6366f1;">suporte@marketcontroll.com</a></p>
        </div>
      </div>
      </body></html>
    `,
  })
}

export async function sendPaymentOverdueEmail(email: string, churchName: string, amount: number, invoiceUrl?: string) {
  const amountFmt = amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `⚠️ Fatura vencida — regularize para manter o acesso ao Ecclesia`,
    html: `
      <!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
      <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:28px 32px;">
          <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Fatura vencida</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">${churchName}</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#475569;font-size:15px;margin:0 0 24px;line-height:1.6;">
            Sua fatura de <strong>${amountFmt}</strong> está em aberto. Regularize o pagamento para garantir a continuidade do acesso ao sistema.
          </p>
          ${invoiceUrl ? `<a href="${invoiceUrl}" style="display:block;background:linear-gradient(135deg,#f59e0b,#ef4444);color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:16px;">Pagar agora →</a>` : ''}
          <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">O acesso ao sistema pode ser suspenso em caso de inadimplência prolongada.</p>
        </div>
        <div style="border-top:1px solid #f1f5f9;padding:16px 32px;background:#f8fafc;">
          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">Dúvidas? <a href="mailto:suporte@marketcontroll.com" style="color:#6366f1;">suporte@marketcontroll.com</a></p>
        </div>
      </div>
      </body></html>
    `,
  })
}

export async function sendPaymentDeclinedEmail(email: string, churchName: string, invoiceUrl?: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Pagamento recusado — atualize sua forma de pagamento no Ecclesia`,
    html: `
      <!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
      <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:28px 32px;">
          <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Pagamento recusado</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">${churchName}</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#475569;font-size:15px;margin:0 0 24px;line-height:1.6;">
            Não conseguimos processar seu pagamento. Isso pode ter acontecido por saldo insuficiente, cartão expirado ou dados incorretos.
          </p>
          ${invoiceUrl ? `<a href="${invoiceUrl}" style="display:block;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:16px;">Tentar novamente →</a>` : ''}
          <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">Se o problema persistir, entre em contato com o suporte.</p>
        </div>
        <div style="border-top:1px solid #f1f5f9;padding:16px 32px;background:#f8fafc;">
          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">Dúvidas? <a href="mailto:suporte@marketcontroll.com" style="color:#6366f1;">suporte@marketcontroll.com</a></p>
        </div>
      </div>
      </body></html>
    `,
  })
}

export async function sendMemberPasswordResetEmail(email: string, name: string, token: string) {
  const link = `${APP_URL}/membro/redefinir-senha?token=${token}`
  const firstName = name.split(' ')[0]

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Redefinir senha — Área do Membro',
    html: `
      <!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
      <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
          <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Olá, ${firstName}!</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Redefinição de senha — Área do Membro</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#475569;font-size:15px;margin:0 0 24px;line-height:1.6;">
            Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>15 minutos</strong>.
          </p>
          <a href="${link}" style="display:block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:24px;">Criar nova senha →</a>
          <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">Se você não solicitou isso, ignore este email.</p>
        </div>
        <div style="border-top:1px solid #f1f5f9;padding:16px 32px;background:#f8fafc;">
          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">Dúvidas? Fale com a secretaria da sua igreja.</p>
        </div>
      </div>
      </body></html>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${APP_URL}/redefinir-senha?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Redefinição de senha — Ecclesia',
    html: `
      <!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
      <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
          <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Redefinir senha</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Ecclesia</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#475569;font-size:15px;margin:0 0 24px;line-height:1.6;">
            Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo — o link é válido por <strong>15 minutos</strong>.
          </p>
          <a href="${link}" style="display:block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:24px;">Redefinir minha senha →</a>
          <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
            Se você não solicitou isso, ignore este email. Sua senha permanece a mesma.<br><br>
            Link: <span style="color:#6366f1;word-break:break-all;">${link}</span>
          </p>
        </div>
        <div style="border-top:1px solid #f1f5f9;padding:16px 32px;background:#f8fafc;">
          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">Dúvidas? <a href="mailto:suporte@marketcontroll.com" style="color:#6366f1;">suporte@marketcontroll.com</a></p>
        </div>
      </div>
      </body></html>
    `,
  })
}

export async function sendWelcomeEmail(email: string, churchName: string, slug: string) {
  const loginUrl = `https://${slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN || 'marketcontroll.com'}/login`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Sua conta no Ecclesia está pronta — ${churchName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px;">
        <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 12px;">🎉</div>
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">Conta criada com sucesso!</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">${churchName}</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #475569; font-size: 15px; margin: 0 0 8px; line-height: 1.6;">
              Seu sistema de gestão está pronto. Acesse com o link da sua igreja:
            </p>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px; font-family: monospace; font-size: 14px; color: #475569; word-break: break-all;">
              ${loginUrl}
            </div>
            <a href="${loginUrl}" style="display: block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 10px; font-size: 15px; font-weight: 600;">
              Acessar meu painel →
            </a>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding: 20px 32px; background: #f8fafc;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
              Dúvidas? <a href="mailto:suporte@marketcontroll.com" style="color: #6366f1;">suporte@marketcontroll.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}
