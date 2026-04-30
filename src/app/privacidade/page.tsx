import Link from 'next/link'

export const metadata = { title: 'Política de Privacidade — Ecclesia' }

export default function PrivacidadePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#6c2bd9', textDecoration: 'none' }}>← Voltar</Link>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a2e', margin: '16px 0 6px' }}>Política de Privacidade</h1>
          <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>Última atualização: 30 de abril de 2026 · Em conformidade com a LGPD (Lei 13.709/2018)</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '15px', color: '#374151', lineHeight: 1.7 }}>

          <section>
            <h2 style={h2}>1. Quem somos</h2>
            <p>A plataforma <strong>Ecclesia</strong> é operada por seus desenvolvedores e destina-se exclusivamente a organizações religiosas. Esta política descreve como coletamos, usamos e protegemos os dados pessoais tratados por meio da plataforma.</p>
          </section>

          <section>
            <h2 style={h2}>2. Dados que coletamos</h2>
            <p><strong>Dados da organização (gestor/pastor):</strong></p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Nome, e-mail e telefone do responsável</li>
              <li>Nome e subdomínio da igreja</li>
              <li>Dados de pagamento (processados pelo Asaas — não armazenamos cartão)</li>
            </ul>
            <p style={{ marginTop: '12px' }}><strong>Dados dos membros (inseridos pela organização):</strong></p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Nome, telefone, e-mail e endereço</li>
              <li>Histórico de dízimos e frequência</li>
              <li>Participação em células e escalas</li>
            </ul>
            <p style={{ marginTop: '12px' }}><strong>Dados de visitantes:</strong></p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Nome e telefone (WhatsApp)</li>
              <li>Histórico de visitas e mensagens trocadas</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>3. Para que usamos os dados</h2>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Prestar as funcionalidades da plataforma</li>
              <li>Enviar notificações e mensagens WhatsApp conforme configurado pela organização</li>
              <li>Processar pagamentos das assinaturas</li>
              <li>Enviar comunicações sobre a plataforma (atualizações, avisos)</li>
              <li>Monitorar erros técnicos para manutenção do serviço</li>
            </ul>
            <p style={{ marginTop: '12px' }}>Não vendemos, alugamos nem compartilhamos dados pessoais com terceiros para fins de marketing.</p>
          </section>

          <section>
            <h2 style={h2}>4. Base legal (LGPD)</h2>
            <p>Tratamos dados com base em:</p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li><strong>Execução de contrato</strong> — para prestar o serviço contratado</li>
              <li><strong>Legítimo interesse</strong> — para melhorar a plataforma e prevenir fraudes</li>
              <li><strong>Consentimento</strong> — para envio de notificações push e mensagens automáticas aos membros</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>5. Compartilhamento com terceiros</h2>
            <p>Utilizamos os seguintes serviços de terceiros que podem processar dados:</p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li><strong>Asaas</strong> — processamento de pagamentos</li>
              <li><strong>Evolution API</strong> — envio de mensagens WhatsApp</li>
              <li><strong>Resend</strong> — envio de e-mails transacionais</li>
              <li><strong>Sentry</strong> — monitoramento de erros técnicos</li>
            </ul>
            <p style={{ marginTop: '12px' }}>Todos os serviços são contratados com cláusulas de proteção de dados compatíveis com a LGPD.</p>
          </section>

          <section>
            <h2 style={h2}>6. Retenção dos dados</h2>
            <p>Os dados são mantidos enquanto a assinatura estiver ativa. Após o cancelamento, os dados ficam disponíveis por <strong>30 dias</strong> para exportação e são excluídos definitivamente após esse prazo, salvo obrigação legal de retenção.</p>
          </section>

          <section>
            <h2 style={h2}>7. Segurança</h2>
            <p>Adotamos medidas técnicas para proteger os dados, incluindo: conexões criptografadas (HTTPS/TLS), senhas armazenadas com hash, controle de acesso por função e monitoramento de erros em tempo real. Nenhum sistema é 100% seguro — em caso de incidente, notificaremos os afetados no prazo legal.</p>
          </section>

          <section>
            <h2 style={h2}>8. Seus direitos (LGPD)</h2>
            <p>Como titular de dados, você tem direito a:</p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Confirmar a existência de tratamento</li>
              <li>Acessar seus dados</li>
              <li>Corrigir dados incompletos ou incorretos</li>
              <li>Solicitar a exclusão dos dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Portabilidade dos dados</li>
            </ul>
            <p style={{ marginTop: '12px' }}>Para exercer esses direitos, entre em contato pelo e-mail abaixo. Responderemos em até 15 dias úteis.</p>
          </section>

          <section>
            <h2 style={h2}>9. Cookies</h2>
            <p>Utilizamos cookies essenciais para autenticação e sessão. Não utilizamos cookies de rastreamento ou publicidade.</p>
          </section>

          <section>
            <h2 style={h2}>10. Contato e DPO</h2>
            <p>Para questões de privacidade e proteção de dados:<br />
            <a href="mailto:ecclesiasas014@gmail.com" style={{ color: '#6c2bd9' }}>ecclesiasas014@gmail.com</a></p>
          </section>

        </div>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '16px', fontSize: '13px' }}>
          <Link href="/termos" style={{ color: '#6c2bd9', textDecoration: 'none' }}>Termos de Uso →</Link>
        </div>
      </div>
    </div>
  )
}

const h2: React.CSSProperties = {
  fontSize: '17px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 10px',
}
