import Link from 'next/link'

export const metadata = { title: 'Termos de Uso — Ecclesia' }

export default function TermosPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#6c2bd9', textDecoration: 'none' }}>← Voltar</Link>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a2e', margin: '16px 0 6px' }}>Termos de Uso</h1>
          <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>Última atualização: 30 de abril de 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '15px', color: '#374151', lineHeight: 1.7 }}>

          <section>
            <h2 style={h2}>1. Aceitação dos Termos</h2>
            <p>Ao contratar ou utilizar a plataforma <strong>Ecclesia</strong>, você concorda com estes Termos de Uso. Se você representa uma organização religiosa, declara ter autoridade para aceitá-los em nome desta.</p>
          </section>

          <section>
            <h2 style={h2}>2. O que é o Ecclesia</h2>
            <p>O Ecclesia é uma plataforma de gestão para igrejas que oferece ferramentas de gerenciamento de membros, dízimos, células, escalas, visitantes, comunicados e área do membro. O serviço é fornecido via internet (SaaS) e acessado por meio de subdomínio personalizado.</p>
          </section>

          <section>
            <h2 style={h2}>3. Cadastro e Conta</h2>
            <p>Para utilizar o Ecclesia, é necessário criar uma conta com dados válidos da sua organização. Você é responsável por manter a confidencialidade das credenciais de acesso e por todas as atividades realizadas em sua conta.</p>
          </section>

          <section>
            <h2 style={h2}>4. Planos e Pagamentos</h2>
            <p>O Ecclesia é oferecido nos planos <strong>Igreja</strong> (igreja única) e <strong>Rede</strong> (sede + até 3 filiais). Os valores, formas de pagamento e condições de cada plano estão disponíveis na página de contratação. O pagamento é processado via Asaas.</p>
            <p style={{ marginTop: '12px' }}>Em caso de inadimplência, o acesso à plataforma pode ser suspenso após aviso prévio de 7 dias.</p>
          </section>

          <section>
            <h2 style={h2}>5. Cancelamento</h2>
            <p>Você pode cancelar sua assinatura a qualquer momento entrando em contato pelo e-mail de suporte. Após o cancelamento, os dados ficam disponíveis por 30 dias para exportação, sendo excluídos definitivamente após esse período.</p>
          </section>

          <section>
            <h2 style={h2}>6. Uso Aceitável</h2>
            <p>Você concorda em utilizar o Ecclesia apenas para fins legítimos de gestão eclesiástica. É proibido:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Enviar mensagens em massa sem consentimento dos destinatários</li>
              <li>Usar a plataforma para fins comerciais não relacionados à sua organização religiosa</li>
              <li>Tentar acessar contas de outras organizações</li>
              <li>Reverter engenharia ou copiar o sistema</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>7. Responsabilidades</h2>
            <p>O Ecclesia se responsabiliza pela disponibilidade da plataforma e pela segurança dos dados armazenados. Não nos responsabilizamos por dados inseridos incorretamente pelos usuários, uso indevido das funcionalidades de WhatsApp ou interrupções causadas por terceiros (provedores de infraestrutura, APIs externas).</p>
          </section>

          <section>
            <h2 style={h2}>8. Propriedade Intelectual</h2>
            <p>O código, design, marca e funcionalidades do Ecclesia são propriedade exclusiva dos desenvolvedores. Os dados inseridos pela sua organização (membros, dízimos, etc.) pertencem à sua organização.</p>
          </section>

          <section>
            <h2 style={h2}>9. Alterações nos Termos</h2>
            <p>Podemos atualizar estes termos com aviso prévio de 15 dias por e-mail. O uso continuado da plataforma após esse prazo implica aceitação das alterações.</p>
          </section>

          <section>
            <h2 style={h2}>10. Contato</h2>
            <p>Dúvidas sobre estes Termos: <a href="mailto:ecclesiasas014@gmail.com" style={{ color: '#6c2bd9' }}>ecclesiasas014@gmail.com</a></p>
          </section>

        </div>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '16px', fontSize: '13px' }}>
          <Link href="/privacidade" style={{ color: '#6c2bd9', textDecoration: 'none' }}>Política de Privacidade →</Link>
        </div>
      </div>
    </div>
  )
}

const h2: React.CSSProperties = {
  fontSize: '17px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 10px',
}
