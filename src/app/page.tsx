'use client'

import { useState } from 'react'
import {Palette, Smartphone, CreditCard, Bell, Users, Building2, Shield, BarChart3, UserCheck, Calendar, UsersRound, CalendarDays, Megaphone, Wallet, Globe, Heart, CheckCircle2, ArrowRight, Star, ChevronDown
} from 'lucide-react'

const PLAN_IGREJA = process.env.NEXT_PUBLIC_PLAN_IGREJA_URL || '#'
const PLAN_REDE = process.env.NEXT_PUBLIC_PLAN_REDE_URL || '#'

const G = 'linear-gradient(135deg, #1E2A78 0%, #6C2BD9 100%)'
const G2 = 'linear-gradient(135deg, #2F4DFF 0%, #6C2BD9 100%)'
const C = { primary: '#1E2A78', light: '#2F4DFF', secondary: '#6C2BD9', bg: '#F8FAFC', text: '#0F172A', muted: '#64748B', border: '#E5E7EB' }

const diferenciais = [
  { Icon: Palette, title: 'White-label completo', desc: 'Sua logo, suas cores. O app exibe a identidade da sua igreja — não a marca de um sistema genérico.' },
  { Icon: Smartphone, title: 'App na Play Store e App Store', desc: 'Aplicativo nativo disponível para Android e iOS. Seus membros baixam diretamente nas lojas oficiais.' },
  { Icon: CreditCard, title: 'Dízimo online integrado', desc: 'Boleto, PIX e cartão. O dinheiro cai direto na conta da sua igreja, sem intermediários.' },
  { Icon: Bell, title: 'Notificações em tempo real', desc: 'Push notifications para eventos, escalas e comunicados — mesmo com o app fechado.' },
  { Icon: Users, title: 'Gestão de células', desc: 'Cada líder tem área própria. Registra reuniões, frequência e visitantes pelo app.' },
  { Icon: Building2, title: 'Multi-sede (Plano Rede)', desc: 'Sede mãe e filiais ilimitadas com programações independentes e dashboard consolidado.' },
  { Icon: Shield, title: 'Acesso seguro por CPF', desc: 'Membros se identificam pelo CPF. Cada um acessa apenas seus próprios dados.' },
  { Icon: BarChart3, title: 'Relatórios automáticos', desc: 'Frequência, dízimos e escalas sempre atualizados. Sem planilhas, sem retrabalho.' },
]

const modulos = [
  { Icon: UserCheck, name: 'Membros', desc: 'Cadastro completo, grupos, aniversários e histórico de cada membro', color: '#2F4DFF' },
  { Icon: Users, name: 'Células', desc: 'Líderes, reuniões, frequência e registro de visitantes pelo app', color: '#6C2BD9' },
  { Icon: Calendar, name: 'Escalas', desc: 'Ministérios, funções e confirmações diretamente no celular', color: '#1E2A78' },
  { Icon: Megaphone, name: 'Comunicados', desc: 'Avisos segmentados com push notifications para grupos específicos', color: '#EA580C' },
  { Icon: Star, name: 'Eventos', desc: 'Agenda completa, inscrições online e controle de presença', color: '#0891B2' },
  { Icon: Wallet, name: 'Financeiro', desc: 'Dízimos, ofertas e despesas sempre organizados em relatórios', color: '#059669' },
  { Icon: Globe, name: 'Missões', desc: 'Projetos missionários, metas e acompanhamento de doadores', color: '#DC2626' },
  { Icon: Heart, name: 'Oração', desc: 'Pedidos de oração enviados direto para a liderança pelo app', color: '#DB2777' },
  { Icon: Smartphone, name: 'App Próprio', desc: 'Publicado na Play Store e App Store com a identidade da sua igreja', color: '#7C3AED' },
  { Icon: CreditCard, name: 'Dízimo Online', desc: 'PIX, boleto e cartão sem intermediários — dinheiro direto na conta', color: '#0F766E' },
]

const planIgrejaFeatures = ['Todos os 10 módulos', 'App white-label próprio', 'Membros ilimitados', 'Dízimo online integrado', 'Push notifications', 'Suporte por email']
const planRedeFeatures = ['Tudo do Plano Igreja', 'Filiais ilimitadas', 'Dashboard consolidado', 'Programações independentes', 'Gestão por sede', 'Suporte prioritário']

const faq = [
  { q: 'O app fica na Play Store e App Store?', a: 'Sim. O aplicativo da sua igreja é publicado nas lojas oficiais com o nome, logo e cores da sua igreja. Seus membros baixam normalmente como qualquer app.' },
  { q: 'O app terá a marca da minha igreja?', a: 'Sim. Você define a logo, cor primária e secundária. Tudo que o membro vê reflete a identidade visual da sua igreja, não a marca do sistema.' },
  { q: 'Como funciona o recebimento do dízimo?', a: 'Criamos uma conta vinculada à sua igreja. Os pagamentos (PIX, boleto, cartão) caem direto na sua conta, sem passar pela Ecclesia.' },
  { q: 'Preciso de conhecimento técnico para configurar?', a: 'Não. Após o pagamento você recebe um link para criar sua conta. Em minutos sua igreja está configurada com logo e cores personalizadas.' },
  { q: 'Qual a diferença entre Igreja e Rede?', a: 'O Plano Igreja gerencia uma única sede. O Plano Rede suporta sede mãe mais filiais ilimitadas com programações independentes e dashboard consolidado.' },
]

const phoneScreens = [
  {
    label: 'Escalas',
    color: '#1E2A78',
    items: [
      { Icon: Calendar, l: 'Domingo — Louvor', sub: '08h · Confirmado ✓' },
      { Icon: Users, l: 'Células — Quarta', sub: '19h · Pendente' },
      { Icon: Megaphone, l: 'Comunicado novo', sub: 'Há 2 horas' },
    ],
  },
  {
    label: 'Home',
    color: '#6C2BD9',
    items: [
      { Icon: Bell, l: 'Notificações', sub: '3 novas este mês' },
      { Icon: Wallet, l: 'Dízimo', sub: 'R$ 200 · PIX' },
      { Icon: Heart, l: 'Pedido de oração', sub: 'Enviado à liderança' },
    ],
  },
  {
    label: 'Dízimo',
    color: '#059669',
    items: [
      { Icon: CreditCard, l: 'PIX', sub: 'Gerado em segundos' },
      { Icon: CreditCard, l: 'Boleto', sub: 'Vencimento em 3 dias' },
      { Icon: Shield, l: 'Seguro', sub: 'Direto para a conta da igreja' },
    ],
  },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: C.text, background: C.bg, overflowX: 'hidden' }}>

      {/* ── NAV FIXED ───────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/logo-ecclesia.png" alt="Ecclesia" style={{ height: '150px', objectFit: 'contain' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
            <a href="#modulos" style={{ fontSize: '15px', color: C.muted, textDecoration: 'none', fontWeight: '500' }}>Módulos</a>
            <a href="#planos" style={{ fontSize: '15px', color: C.muted, textDecoration: 'none', fontWeight: '500' }}>Planos</a>
            <a href="#faq" style={{ fontSize: '15px', color: C.muted, textDecoration: 'none', fontWeight: '500' }}>FAQ</a>
            <a href="mailto:suporte@marketcontroll.com" style={{ fontSize: '15px', color: C.muted, textDecoration: 'none', fontWeight: '500' }}>Suporte</a>
            <a href="#planos" style={{ background: G2, color: 'white', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none', boxShadow: `0 4px 14px ${C.secondary}40` }}>
              Assinar agora ↓
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{ paddingTop: '70px', position: 'relative', overflow: 'hidden', background: '#0A0E2A' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(47,77,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(47,77,255,0.07) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-120px', left: '5%', width: '600px', height: '600px', borderRadius: '50%', background: `${C.primary}50`, filter: 'blur(120px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '5%', width: '500px', height: '500px', borderRadius: '50%', background: `${C.secondary}40`, filter: 'blur(120px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', borderRadius: '50%', background: `${C.light}20`, filter: 'blur(100px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: '120px 32px 100px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(47,77,255,0.15)', border: '1px solid rgba(47,77,255,0.3)', borderRadius: '100px', padding: '8px 18px', marginBottom: '32px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>Sistema online — disponível na Play Store e App Store</span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px, 6.5vw, 72px)', fontWeight: '900', color: 'white', lineHeight: 1.05, margin: '0 0 24px', letterSpacing: '-2px' }}>
            Gestão completa para<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              igrejas que crescem
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(17px, 2vw, 21px)', color: 'rgba(255,255,255,0.65)', maxWidth: '640px', margin: '0 auto 48px', lineHeight: 1.65 }}>
            App personalizado na loja com a identidade da sua igreja, dízimo online integrado, gestão de células, escalas e muito mais. Um sistema completo, sem complicação.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={PLAN_IGREJA} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', color: C.primary, padding: '15px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              Plano Igreja — R$ 79,90/mês <ArrowRight size={18} />
            </a>
            <a href={PLAN_REDE} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1.5px solid rgba(255,255,255,0.25)', padding: '15px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', textDecoration: 'none' }}>
              Plano Rede — R$ 199,90/mês
            </a>
          </div>

          <div style={{ marginTop: '56px', display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            {['Play Store', 'App Store', 'PIX & Cartão', 'Suporte dedicado'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <CheckCircle2 size={15} color="#22C55E" />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontWeight: '500' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────── */}
      <section style={{ background: 'white', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '44px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', textAlign: 'center' }}>
          {[
            { n: 'R$ 2,66/dia', l: 'Plano Igreja' },
            { n: '10 módulos', l: 'em uma plataforma' },
            { n: 'Play + App Store', l: 'app nativo' },
            { n: '100%', l: 'identidade da sua igreja' },
          ].map(s => (
            <div key={s.n}>
              <p style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '800', background: G2, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.n}</p>
              <p style={{ margin: 0, fontSize: '14px', color: C.muted }}>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIFERENCIAIS ────────────────────────────────────────── */}
      {/* ── DIFERENCIAIS ────────────────────────────────────────── */}
      <section
        style={{
          padding: '110px 32px',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-140px',
            left: '-80px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: `${C.primary}10`,
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-140px',
            right: '-80px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: `${C.secondary}12`,
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                background: G2,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Por que Ecclesia
            </p>

            <h2
              style={{
                margin: '0 0 16px',
                fontSize: 'clamp(30px, 4vw, 48px)',
                fontWeight: '900',
                letterSpacing: '-1px',
                lineHeight: 1.1,
              }}
            >
              Tudo que sua igreja precisa para
              <br />
              organizar, comunicar e crescer
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: '18px',
                color: C.muted,
                maxWidth: '720px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.7,
              }}
            >
              Um sistema pensado para a realidade das igrejas: app próprio, dízimo integrado,
              gestão de células, notificações e relatórios automáticos em uma só plataforma.
            </p>
          </div>

          {/* Card principal */}
          <div
            className="feature-card feature-card-lg"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 1.2fr) minmax(280px, 0.8fr)',
              gap: '28px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))',
              border: `1px solid ${C.border}`,
              borderRadius: '28px',
              padding: '34px',
              boxShadow: '0 20px 60px rgba(30,42,120,0.08)',
              marginBottom: '22px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div className="feature-shine" />

            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  background: 'rgba(108,43,217,0.08)',
                  color: C.secondary,
                  fontSize: '12px',
                  fontWeight: '800',
                  marginBottom: '18px',
                }}
              >
                Destaque principal
              </div>

              <div
                className="icon-pop"
                style={{
                  width: '62px',
                  height: '62px',
                  borderRadius: '18px',
                  background: `linear-gradient(135deg, ${C.primary}18, ${C.secondary}22)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px',
                }}
              >
                <Palette size={28} color={C.secondary} strokeWidth={1.9} />
              </div>

              <h3 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: '900', lineHeight: 1.15 }}>
                Seu app com a identidade da sua igreja
              </h3>

              <p style={{ margin: '0 0 24px', fontSize: '16px', color: C.muted, lineHeight: 1.75 }}>
                Logo, cores e nome próprios. Seus membros usam o app da sua igreja — não a marca
                de um sistema genérico.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                {[
                  'Nome da sua igreja',
                  'Logo personalizada',
                  'Cores próprias',
                  'Experiência profissional',
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(255,255,255,0.7)',
                      border: `1px solid ${C.border}`,
                      borderRadius: '14px',
                      padding: '12px 14px',
                    }}
                  >
                    <CheckCircle2 size={16} color={C.secondary} />
                    <span style={{ fontSize: '14px', fontWeight: '600', color: C.text }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30,42,120,0.96), rgba(108,43,217,0.96))',
                borderRadius: '24px',
                padding: '24px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '100%',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', opacity: 0.8 }}>
                  Resultado prático
                </p>
                <h4 style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: '800', lineHeight: 1.3 }}>
                  Mais percepção de valor, mais organização e mais confiança para os membros
                </h4>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  'App publicado nas lojas oficiais',
                  'Visual alinhado com sua igreja',
                  'Mais autoridade na apresentação',
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <CheckCircle2 size={16} color="#A5B4FC" />
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.92)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grid secundário */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            {[
              {
                Icon: Smartphone,
                title: 'Disponível nas lojas oficiais',
                desc: 'Seus membros baixam o aplicativo direto na Play Store e App Store, com mais confiança e praticidade.',
                badge: 'App oficial',
              },
              {
                Icon: CreditCard,
                title: 'Dízimo online integrado',
                desc: 'Receba por PIX, boleto e cartão com repasse direto para a conta da igreja.',
                badge: 'Sem intermediários',
              },
              {
                Icon: Bell,
                title: 'Notificações em tempo real',
                desc: 'Envie comunicados, eventos e escalas com push notification, mesmo com o app fechado.',
                badge: 'Mais engajamento',
              },
              {
                Icon: Users,
                title: 'Gestão de células',
                desc: 'Cada líder registra presença, reuniões, visitantes e acompanhamento em um só lugar.',
                badge: 'Mais controle',
              },
              {
                Icon: Shield,
                title: 'Acesso individual e seguro',
                desc: 'Cada membro entra com seu próprio cadastro e visualiza apenas o que é dele.',
                badge: 'Mais segurança',
              },
              {
                Icon: BarChart3,
                title: 'Relatórios automáticos',
                desc: 'Tenha frequência, escalas e financeiro atualizados sem planilhas e sem retrabalho.',
                badge: 'Menos operação',
              },
              {
                Icon: Building2,
                title: 'Controle multi-sede',
                desc: 'Gerencie sede e filiais com autonomia por unidade e visão consolidada da rede.',
                badge: 'Plano Rede',
                highlight: true,
              },
            ].map(({ Icon, title, desc, badge, highlight }) => (
              <div
                key={title}
                className={`feature-card ${highlight ? 'feature-card-highlight' : ''}`}
                style={{
                  background: highlight
                    ? 'linear-gradient(135deg, rgba(30,42,120,0.98), rgba(108,43,217,0.98))'
                    : 'rgba(255,255,255,0.88)',
                  color: highlight ? 'white' : C.text,
                  border: highlight ? '1px solid rgba(108,43,217,0.28)' : `1px solid ${C.border}`,
                  borderRadius: '22px',
                  padding: '28px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: highlight
                    ? '0 22px 60px rgba(108,43,217,0.22)'
                    : '0 10px 30px rgba(15,23,42,0.05)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="feature-shine" />

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 12px',
                    borderRadius: '999px',
                    background: highlight ? 'rgba(255,255,255,0.12)' : 'rgba(108,43,217,0.08)',
                    color: highlight ? 'white' : C.secondary,
                    fontSize: '11px',
                    fontWeight: '800',
                    marginBottom: '16px',
                  }}
                >
                  {badge}
                </div>

                <div
                  className="icon-pop"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: highlight
                      ? 'rgba(255,255,255,0.12)'
                      : `linear-gradient(135deg, ${C.primary}14, ${C.secondary}20)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon
                    size={24}
                    color={highlight ? 'white' : C.secondary}
                    strokeWidth={1.9}
                  />
                </div>

                <h3
                  style={{
                    margin: '0 0 10px',
                    fontSize: '20px',
                    fontWeight: '800',
                    lineHeight: 1.3,
                    color: highlight ? 'white' : C.text,
                  }}
                >
                  {title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    lineHeight: 1.75,
                    color: highlight ? 'rgba(255,255,255,0.82)' : C.muted,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '34px' }}>
            <p style={{ margin: '0 0 20px', fontSize: '16px', color: C.muted }}>
              Menos planilhas. Mais organização. Mais tempo para focar no ministério.
            </p>

            <a
              href="#planos"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: G2,
                color: 'white',
                padding: '15px 28px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: '800',
                textDecoration: 'none',
                boxShadow: '0 12px 30px rgba(108,43,217,0.22)',
              }}
            >
              Ver planos e começar <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ── APP SHOWCASE — 3 phone mockups ──────────────────────── */}
      <section style={{ background: 'white', padding: '96px 32px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '72px', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', background: G2, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>App do Membro</p>
            <h2 style={{ margin: '0 0 18px', fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1.15 }}>Cada membro conectado na palma da mão</h2>
            <p style={{ fontSize: '17px', color: C.muted, lineHeight: 1.7, marginBottom: '32px' }}>
              App publicado na Play Store e App Store com a logo e as cores da sua igreja. O membro baixa, acessa por CPF e tem tudo que precisa — escalas, comunicados, dízimo e mais.
            </p>
            {[
              'Disponível na Play Store e App Store',
              'Identidade visual 100% da sua igreja',
              'Acesso simples por CPF',
              'Escalas, comunicados e eventos',
              'Dízimo com PIX, boleto e cartão',
              'Pedidos de oração para a liderança',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <CheckCircle2 size={18} color={C.secondary} strokeWidth={2} />
                <span style={{ fontSize: '15px', color: C.text }}>{item}</span>
              </div>
            ))}
          </div>

          {/* 3 phone mockups */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', paddingBottom: '20px' }}>
            {phoneScreens.map((screen, i) => {
              const isCenter = i === 1
              return (
                <div
                  key={screen.label}
                  style={{
                    width: isCenter ? '160px' : '136px',
                    borderRadius: '28px',
                    border: '8px solid #1A1A2E',
                    background: '#1A1A2E',
                    boxShadow: isCenter
                      ? `0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)`
                      : `0 16px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)`,
                    transform: i === 0 ? 'rotate(-6deg) translateY(16px)' : i === 2 ? 'rotate(6deg) translateY(16px)' : 'none',
                    flexShrink: 0,
                    overflow: 'hidden',
                    zIndex: isCenter ? 2 : 1,
                  }}
                >
                  {/* status bar */}
                  <div style={{ background: screen.color, padding: '10px 12px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>9:41</span>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>●●●</span>
                  </div>
                  {/* header */}
                  <div style={{ background: screen.color, padding: '6px 12px 14px' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: 'white' }}>{screen.label}</p>
                  </div>
                  {/* content */}
                  <div style={{ background: '#F8FAFC', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {screen.items.map(({ Icon, l, sub }) => (
                      <div key={l} style={{ background: 'white', borderRadius: '10px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: `${screen.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={13} color={screen.color} strokeWidth={2} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '9px', fontWeight: '700', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</p>
                          <p style={{ margin: 0, fontSize: '8px', color: C.muted }}>{sub}</p>
                        </div>
                      </div>
                    ))}
                    {/* bottom nav */}
                    <div style={{ background: 'white', borderRadius: '10px', padding: '8px', display: 'flex', justifyContent: 'space-around', marginTop: '4px' }}>
                      {[Heart, Calendar, Bell].map((Icon, idx) => (
                        <div key={idx} style={{ width: '22px', height: '22px', borderRadius: '6px', background: idx === 1 ? `${screen.color}18` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={12} color={idx === 1 ? screen.color : C.muted} strokeWidth={2} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── MÓDULOS ─────────────────────────────────────────────── */}
      {/* ── MÓDULOS ─────────────────────────────────────────────── */}
      <section
        style={{
          padding: '110px 32px',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-80px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: `${C.primary}10`,
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-120px',
            left: '-80px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: `${C.secondary}12`,
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                background: G2,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Módulos
            </p>

            <h2
              style={{
                margin: '0 0 16px',
                fontSize: 'clamp(32px, 4vw, 54px)',
                fontWeight: '900',
                letterSpacing: '-1.2px',
                lineHeight: 1.08,
              }}
            >
              Tudo que sua igreja precisa
              <br />
              em um só ecossistema
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: '18px',
                color: C.muted,
                maxWidth: '760px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.75,
              }}
            >
              Membros, células, escalas, eventos, financeiro, comunicação e app próprio
              funcionando de forma integrada — sem ferramentas soltas e sem retrabalho.
            </p>
          </div>

          {/* Destaques principais */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '20px',
            }}
          >
            {[
              {
                Icon: Users,
                title: 'Membros',
                desc: 'Cadastro completo, grupos, aniversários e histórico individual em um só lugar.',
                badge: 'Base central',
                highlight: true,
              },
              {
                Icon: Wallet,
                title: 'Financeiro',
                desc: 'Dízimos, ofertas, despesas e relatórios organizados para uma gestão mais segura.',
                badge: 'Mais controle',
                highlight: true,
              },
              {
                Icon: Smartphone,
                title: 'App Próprio',
                desc: 'Seu aplicativo publicado na Play Store e App Store com a identidade da sua igreja.',
                badge: 'Mais valor percebido',
                highlight: true,
              },
            ].map(({ Icon, title, desc, badge, highlight }) => (
              <div
                key={title}
                className={`module-card module-card-top ${highlight ? 'module-card-highlight' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))',
                  border: `1px solid ${C.border}`,
                  borderRadius: '24px',
                  padding: '28px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(15,23,42,0.06)',
                }}
              >
                <div className="module-shine" />

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 12px',
                    borderRadius: '999px',
                    background: 'rgba(108,43,217,0.08)',
                    color: C.secondary,
                    fontSize: '11px',
                    fontWeight: '800',
                    marginBottom: '16px',
                  }}
                >
                  {badge}
                </div>

                <div
                  className="module-icon-pop"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${C.primary}14, ${C.secondary}20)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={25} color={C.secondary} strokeWidth={1.9} />
                </div>

                <h3
                  style={{
                    margin: '0 0 10px',
                    fontSize: '24px',
                    fontWeight: '800',
                    lineHeight: 1.2,
                    color: C.text,
                  }}
                >
                  {title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    lineHeight: 1.75,
                    color: C.muted,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>

          {/* Grid restante */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            {[
              {
                Icon: UsersRound,
                title: 'Células',
                desc: 'Líderes, reuniões, frequência, visitantes e acompanhamento pelo app.',
                color: '#7C3AED',
                bg: 'rgba(124,58,237,0.08)',
              },
              {
                Icon: CalendarDays,
                title: 'Escalas',
                desc: 'Ministérios, funções e confirmações diretamente pelo celular.',
                color: '#1D4ED8',
                bg: 'rgba(29,78,216,0.08)',
              },
              {
                Icon: Megaphone,
                title: 'Comunicados',
                desc: 'Avisos segmentados com push notifications para grupos específicos.',
                color: '#EA580C',
                bg: 'rgba(234,88,12,0.08)',
              },
              {
                Icon: Star,
                title: 'Eventos',
                desc: 'Agenda completa, inscrições online e controle de presença.',
                color: '#0284C7',
                bg: 'rgba(2,132,199,0.08)',
              },
              {
                Icon: Globe,
                title: 'Missões',
                desc: 'Projetos missionários, metas e acompanhamento de doadores.',
                color: '#DC2626',
                bg: 'rgba(220,38,38,0.08)',
              },
              {
                Icon: Heart,
                title: 'Oração',
                desc: 'Pedidos enviados pelo app direto para a liderança acompanhar.',
                color: '#DB2777',
                bg: 'rgba(219,39,119,0.08)',
              },
              {
                Icon: CreditCard,
                title: 'Dízimo Online',
                desc: 'PIX, boleto e cartão com repasse direto para a conta da igreja.',
                color: '#0F766E',
                bg: 'rgba(15,118,110,0.08)',
              },
            ].map(({ Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="module-card"
                style={{
                  background: 'rgba(255,255,255,0.88)',
                  border: `1px solid ${C.border}`,
                  borderRadius: '22px',
                  padding: '26px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 10px 28px rgba(15,23,42,0.05)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="module-shine" />

                <div
                  className="module-icon-pop"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    border: `1px solid ${color}25`,
                  }}
                >
                  <Icon size={24} color={color} strokeWidth={1.9} />
                </div>

                <h3
                  style={{
                    margin: '0 0 10px',
                    fontSize: '22px',
                    fontWeight: '800',
                    lineHeight: 1.25,
                    color: C.text,
                  }}
                >
                  {title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    lineHeight: 1.75,
                    color: C.muted,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '34px' }}>
            <p style={{ margin: '0 0 20px', fontSize: '16px', color: C.muted }}>
              Um sistema completo para reduzir operação manual e aumentar organização, controle e engajamento.
            </p>

            <a
              href="#planos"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: G2,
                color: 'white',
                padding: '15px 28px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: '800',
                textDecoration: 'none',
                boxShadow: '0 12px 30px rgba(108,43,217,0.22)',
              }}
            >
              Ver planos disponíveis <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ── PLANOS ──────────────────────────────────────────────── */}
      <section id="planos" style={{ padding: '96px 32px', background: 'white', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', background: G2, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Planos</p>
            <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: '900', letterSpacing: '-1px' }}>Preço justo, sem surpresas</h2>
            <p style={{ margin: 0, fontSize: '18px', color: C.muted }}>Assinatura mensal. Cancele quando quiser. Sem fidelidade.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

            {/* Igreja */}
            <div style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: '24px', padding: '40px 36px' }}>
              <p style={{ margin: '0 0 6px', fontWeight: '800', fontSize: '22px' }}>Igreja</p>
              <p style={{ margin: '0 0 24px', fontSize: '15px', color: C.muted }}>Para uma sede única</p>
              <div style={{ marginBottom: '28px' }}>
                <span style={{ fontSize: '48px', fontWeight: '900', color: C.primary }}>R$ 79,90</span>
                <span style={{ fontSize: '15px', color: C.muted }}>/mês</span>
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '28px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {planIgrejaFeatures.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <CheckCircle2 size={17} color="#22C55E" strokeWidth={2} />
                    <span style={{ fontSize: '15px', color: C.text }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={PLAN_IGREJA} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: G, color: 'white', padding: '15px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', boxShadow: `0 4px 20px ${C.secondary}35` }}>
                Assinar Plano Igreja <ArrowRight size={17} />
              </a>
            </div>

            {/* Rede */}
            <div style={{ background: '#0A0E2A', borderRadius: '24px', padding: '40px 36px', position: 'relative', overflow: 'hidden', boxShadow: `0 24px 64px ${C.secondary}35` }}>
              <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: `${C.light}25`, filter: 'blur(60px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: `${C.secondary}30`, filter: 'blur(60px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '20px', right: '20px', background: G2, borderRadius: '20px', padding: '5px 14px', fontSize: '12px', color: 'white', fontWeight: '700', letterSpacing: '0.5px' }}>RECOMENDADO</div>
              <p style={{ margin: '0 0 6px', fontWeight: '800', fontSize: '22px', color: 'white', position: 'relative', zIndex: 1 }}>Rede</p>
              <p style={{ margin: '0 0 24px', fontSize: '15px', color: 'rgba(255,255,255,0.55)', position: 'relative', zIndex: 1 }}>Sede mãe + filiais ilimitadas</p>
              <div style={{ marginBottom: '28px', position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: '48px', fontWeight: '900', color: 'white' }}>R$ 199,90</span>
                <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)' }}>/mês</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '28px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 1 }}>
                {planRedeFeatures.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <CheckCircle2 size={17} color="#86efac" strokeWidth={2} />
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={PLAN_REDE} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', color: C.primary, padding: '15px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1 }}>
                Assinar Plano Rede <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SANFONA ─────────────────────────────────────────── */}
      <section id="faq" style={{ padding: '96px 32px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', background: G2, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FAQ</p>
            <h2 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '900', letterSpacing: '-1px' }}>Perguntas frequentes</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faq.map((f, i) => {
              const isOpen = openFaq === i
              return (
                <div key={f.q} style={{ background: 'white', border: `1.5px solid ${isOpen ? C.secondary : C.border}`, borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '16px' }}
                  >
                    <span style={{ fontWeight: '700', fontSize: '16px', color: C.text, lineHeight: 1.4 }}>{f.q}</span>
                    <ChevronDown
                      size={20}
                      color={isOpen ? C.secondary : C.muted}
                      style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s, color 0.2s' }}
                    />
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 24px 22px' }}>
                      <div style={{ height: '1px', background: C.border, marginBottom: '18px' }} />
                      <p style={{ margin: 0, fontSize: '15px', color: C.muted, lineHeight: 1.7 }}>{f.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{ background: '#0A0E2A', padding: '96px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(47,77,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(47,77,255,0.06) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-80px', left: '15%', width: '400px', height: '400px', borderRadius: '50%', background: `${C.primary}40`, filter: 'blur(100px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '15%', width: '360px', height: '360px', borderRadius: '50%', background: `${C.secondary}35`, filter: 'blur(100px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: '900', color: 'white', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            Sua igreja merece um sistema à altura do seu crescimento
          </h2>
          <p style={{ margin: '0 0 40px', fontSize: '18px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Comece hoje. Configure em minutos. Sem contrato de fidelidade.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={PLAN_IGREJA} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', color: C.primary, padding: '15px 32px', borderRadius: '12px', fontWeight: '700', fontSize: '16px', textDecoration: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              Plano Igreja — R$ 79,90/mês <ArrowRight size={18} />
            </a>
            <a href={PLAN_REDE} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1.5px solid rgba(255,255,255,0.2)', padding: '15px 32px', borderRadius: '12px', fontWeight: '600', fontSize: '16px', textDecoration: 'none' }}>
              Plano Rede — R$ 199,90/mês
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{ background: '#060914', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <div>
            <img src="/logo-ecclesia.png" alt="Ecclesia" style={{ height: '120px', objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: '10px', display: 'block' }} />
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Sistema de gestão para igrejas evangélicas</p>
          </div>
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
            {['#modulos:Módulos', '#planos:Planos', '#faq:FAQ', 'mailto:suporte@marketcontroll.com:Suporte'].map(item => {
              const [href, label] = item.split(':')
              return <a key={label} href={href} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>{label}</a>
            })}
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>© {new Date().getFullYear()} Ecclesia</p>
        </div>
      </footer>

      <style jsx>{`
        .feature-card {
          transition:
            transform 0.28s ease,
            box-shadow 0.28s ease,
            border-color 0.28s ease,
            background 0.28s ease;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 22px 60px rgba(15, 23, 42, 0.12);
          border-color: rgba(108, 43, 217, 0.28);
        }

        .feature-card-lg:hover {
          transform: translateY(-10px);
          box-shadow: 0 30px 70px rgba(30, 42, 120, 0.14);
        }

        .feature-card-highlight:hover {
          box-shadow: 0 26px 70px rgba(108, 43, 217, 0.3);
        }

        .feature-shine {
          position: absolute;
          top: -120%;
          left: -40%;
          width: 60%;
          height: 250%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 35%,
            rgba(255, 255, 255, 0.28) 50%,
            rgba(255, 255, 255, 0.05) 65%,
            transparent 100%
          );
          transform: rotate(18deg);
          transition: left 0.65s ease;
          pointer-events: none;
        }

        .feature-card:hover .feature-shine {
          left: 110%;
        }

        .icon-pop {
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }

        .feature-card:hover .icon-pop {
          transform: scale(1.08) rotate(-3deg);
          box-shadow: 0 10px 24px rgba(108, 43, 217, 0.16);
        }

        @media (max-width: 900px) {
          .feature-card-lg {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .feature-card,
          .feature-card-lg {
            border-radius: 20px !important;
          }
        }

                .module-card {
          transition:
            transform 0.28s ease,
            box-shadow 0.28s ease,
            border-color 0.28s ease,
            background 0.28s ease;
        }

        .module-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 22px 60px rgba(15, 23, 42, 0.12);
          border-color: rgba(108, 43, 217, 0.22);
        }

        .module-card-top:hover {
          transform: translateY(-10px);
          box-shadow: 0 28px 70px rgba(30, 42, 120, 0.12);
        }

        .module-card-highlight:hover {
          border-color: rgba(108, 43, 217, 0.3);
        }

        .module-shine {
          position: absolute;
          top: -120%;
          left: -40%;
          width: 60%;
          height: 250%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 35%,
            rgba(255, 255, 255, 0.26) 50%,
            rgba(255, 255, 255, 0.05) 65%,
            transparent 100%
          );
          transform: rotate(18deg);
          transition: left 0.65s ease;
          pointer-events: none;
        }

        .module-card:hover .module-shine {
          left: 110%;
        }

        .module-icon-pop {
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }

        .module-card:hover .module-icon-pop {
          transform: scale(1.08) rotate(-3deg);
          box-shadow: 0 10px 24px rgba(108, 43, 217, 0.14);
        }
      `}</style>
    </div>
  )
}
