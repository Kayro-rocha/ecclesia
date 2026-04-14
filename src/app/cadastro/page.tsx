'use client'

import { useState, useEffect, useRef } from 'react'
import { isValidCpfCnpj } from '@/lib/cpf'

type Step = 'igreja' | 'pastor' | 'sucesso'

export default function CadastroPage() {
  const [step, setStep] = useState<Step>('igreja')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    churchName: '',
    slug: '',
    pastorName: '',
    email: '',
    password: '',
    phone: '',
    cpfCnpj: '',
    birthDate: '',
    incomeValue: '',
    postalCode: '',
  })

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [churchSlug, setChurchSlug] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    if (name === 'churchName' && !form.slug) {
      const auto = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 30)
      setForm(prev => ({ ...prev, slug: auto }))
      checkSlug(auto)
    }
    if (name === 'slug') {
      const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)
      setForm(prev => ({ ...prev, slug: clean }))
      checkSlug(clean)
    }
  }

  function checkSlug(slug: string) {
    if (!slug || slug.length < 3) { setSlugStatus('idle'); return }
    if (slugTimer.current) clearTimeout(slugTimer.current)
    setSlugStatus('checking')
    slugTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/onboarding?slug=${slug}`)
      const data = await res.json()
      setSlugStatus(data.available ? 'available' : 'taken')
    }, 500)
  }

  function nextStep() {
    setErro('')
    if (step === 'igreja') {
      if (!form.churchName || !form.slug) { setErro('Preencha o nome e o subdomínio da igreja.'); return }
      if (slugStatus !== 'available') { setErro('Escolha um subdomínio disponível.'); return }
      setStep('pastor')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!form.pastorName || !form.email || !form.password || !form.phone || !form.cpfCnpj || !form.birthDate) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }
    if (form.password.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (!isValidCpfCnpj(form.cpfCnpj)) {
      setErro('CPF ou CNPJ inválido. Verifique os dígitos.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setErro(data.error || 'Erro ao cadastrar. Tente novamente.')
      setLoading(false)
      return
    }

    setChurchSlug(data.slug)
    setStep('sucesso')
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'ecclesia.marketcontroll.com'

  if (step === 'sucesso') {
    const loginUrl = `https://${churchSlug}.${appDomain}/login`
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Igreja cadastrada!</h1>
          <p className="text-sm text-gray-500 mb-6">
            Seu sistema está pronto. Acesse com o link abaixo.
          </p>
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6 text-sm font-mono text-gray-700 break-all">
            {loginUrl}
          </div>
          <a
            href={loginUrl}
            className="block w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700"
          >
            Acessar minha conta
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-semibold">E</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Ecclesia</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'igreja' ? 'Cadastre sua igreja' : 'Dados do responsável'}
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`h-1 flex-1 rounded-full ${step === 'igreja' ? 'bg-blue-600' : 'bg-blue-600'}`} />
          <div className={`h-1 flex-1 rounded-full ${step === 'pastor' ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>

        {step === 'igreja' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nome da igreja *</label>
              <input
                name="churchName"
                value={form.churchName}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="Igreja Batista Central"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Subdomínio *</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-500">
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 text-sm text-gray-900 focus:outline-none"
                  placeholder="igrejabatista"
                />
                <span className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 whitespace-nowrap">
                  .{appDomain}
                </span>
              </div>
              {slugStatus === 'checking' && (
                <p className="text-xs text-gray-400 mt-1">Verificando...</p>
              )}
              {slugStatus === 'available' && (
                <p className="text-xs text-green-600 mt-1">✓ Disponível</p>
              )}
              {slugStatus === 'taken' && (
                <p className="text-xs text-red-500 mt-1">✗ Já está em uso. Escolha outro.</p>
              )}
            </div>

            {erro && <p className="text-sm text-red-500">{erro}</p>}

            <button
              type="button"
              onClick={nextStep}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 mt-2"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 'pastor' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nome completo *</label>
              <input
                name="pastorName"
                value={form.pastorName}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="Pastor João Silva"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">E-mail *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="pastor@igreja.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Senha *</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">WhatsApp *</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="(27) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">CPF / CNPJ *</label>
              <input
                name="cpfCnpj"
                value={form.cpfCnpj}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="000.000.000-00"
              />
              <p className="text-xs text-gray-400 mt-1">Usado para criar sua conta de recebimento no Asaas</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data de nascimento *</label>
              <input
                name="birthDate"
                type="date"
                value={form.birthDate}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Renda/faturamento mensal estimado (R$) *</label>
              <input
                name="incomeValue"
                type="number"
                min="0"
                value={form.incomeValue}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-400 mt-1">Estimativa de arrecadação mensal da igreja. Pode ser 0.</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">CEP <span className="text-gray-400">(opcional)</span></label>
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="00000-000"
              />
            </div>

            {erro && <p className="text-sm text-red-500">{erro}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setStep('igreja'); setErro('') }}
                className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Cadastrando...' : 'Criar conta'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Já tem conta?{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Acesse pelo link da sua igreja
          </a>
        </p>
      </div>
    </div>
  )
}
