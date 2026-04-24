
export const metadata = { title: 'Obrigado' }
export default function ObrigadoPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(99,102,241,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(139,92,246,0.10)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1, textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '800', color: 'white', boxShadow: '0 0 0 4px rgba(99,102,241,0.2), 0 8px 32px rgba(99,102,241,0.35)' }}>
          E
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '24px', padding: '40px 32px' }}>

          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>

          <h1 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: '700', color: 'white', letterSpacing: '-0.3px' }}>
            Compra realizada!
          </h1>

          <p style={{ margin: '0 0 28px', fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Você receberá um email em instantes com o link para criar a conta da sua igreja.
          </p>

          {/* Destaque do email */}
          <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: '500', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Próximo passo</p>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
              Abra seu email e clique no link <strong style={{ color: 'white' }}>Criar minha conta</strong>. O link expira em 48 horas.
            </p>
          </div>

          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
            Não recebeu? Verifique a caixa de spam ou entre em contato:<br />
            <a href="mailto:suporte@marketcontroll.com" style={{ color: 'rgba(99,102,241,0.8)', textDecoration: 'none' }}>
              suporte@marketcontroll.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
