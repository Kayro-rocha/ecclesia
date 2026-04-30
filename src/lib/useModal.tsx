'use client'

import { useState, useCallback } from 'react'

type Variant = 'danger' | 'warning' | 'info' | 'default'

interface ModalConfig {
  type: 'confirm' | 'alert'
  title: string
  message: string
  confirmText: string
  cancelText: string
  variant: Variant
  resolve: (v: boolean) => void
}

function ModalUI({ config, onConfirm, onCancel }: {
  config: ModalConfig
  onConfirm: () => void
  onCancel: () => void
}) {
  const btnColor =
    config.variant === 'danger' ? '#dc2626' :
    config.variant === 'warning' ? '#d97706' :
    'var(--primary, #6c2bd9)'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '400px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 10px' }}>
          {config.title}
        </h2>
        <p style={{ fontSize: '14px', color: '#718096', margin: '0 0 24px', lineHeight: 1.6 }}>
          {config.message}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {config.type === 'confirm' && (
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                border: '1.5px solid #e2e8f0', background: 'white',
                color: '#4a5568', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
              }}
            >
              {config.cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
              background: btnColor, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useModal() {
  const [config, setConfig] = useState<ModalConfig | null>(null)

  const confirm = useCallback((message: string, opts: {
    title?: string
    confirmText?: string
    cancelText?: string
    variant?: Variant
  } = {}): Promise<boolean> => {
    return new Promise(resolve => {
      setConfig({
        type: 'confirm',
        title: opts.title ?? 'Confirmar',
        message,
        confirmText: opts.confirmText ?? 'Confirmar',
        cancelText: opts.cancelText ?? 'Cancelar',
        variant: opts.variant ?? 'default',
        resolve,
      })
    })
  }, [])

  const alert = useCallback((message: string, opts: {
    title?: string
    confirmText?: string
    variant?: Variant
  } = {}): Promise<void> => {
    return new Promise(resolve => {
      setConfig({
        type: 'alert',
        title: opts.title ?? 'Atenção',
        message,
        confirmText: opts.confirmText ?? 'OK',
        cancelText: '',
        variant: opts.variant ?? 'info',
        resolve: () => resolve(),
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    config?.resolve(true)
    setConfig(null)
  }, [config])

  const handleCancel = useCallback(() => {
    config?.resolve(false)
    setConfig(null)
  }, [config])

  const modalNode = config ? (
    <ModalUI config={config} onConfirm={handleConfirm} onCancel={handleCancel} />
  ) : null

  return { confirm, alert, modalNode }
}
