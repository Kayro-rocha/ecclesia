'use client'

import { useRef, useState } from 'react'

interface Props {
  onClose: () => void
  children: React.ReactNode
}

const CLOSE_THRESHOLD = 110 // px para fechar

export default function BottomSheet({ onClose, children }: Props) {
  const startYRef = useRef(0)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)

  function onTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY
    setDragging(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - startYRef.current
    if (delta > 0) setDragY(delta)
  }

  function onTouchEnd() {
    setDragging(false)
    if (dragY > CLOSE_THRESHOLD) {
      onClose()
    }
    setDragY(0)
  }

  // Opacity do backdrop diminui conforme arrasta
  const backdropOpacity = Math.max(0.1, 0.5 - dragY / 500)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: `rgba(0,0,0,${backdropOpacity})`,
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.15s ease',
        transition: dragging ? 'none' : 'background 0.2s',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxHeight: '90dvh',
          background: 'white', borderRadius: '20px 20px 0 0',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: `translateY(${dragY}px)`,
          transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
          animation: dragging ? 'none' : 'slideUp 0.25s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle — área de swipe */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            padding: '12px 0 8px', display: 'flex', justifyContent: 'center',
            flexShrink: 0, cursor: 'grab', touchAction: 'none',
          }}
        >
          <div style={{
            width: '36px', height: '4px', borderRadius: '2px',
            background: dragY > 40 ? '#94a3b8' : '#e2e8f0',
            transition: 'background 0.15s',
          }} />
        </div>

        {children}
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}
