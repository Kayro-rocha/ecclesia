export default function RelatorioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Georgia, serif; background: white; color: #1a1a2e; font-size: 13px; }
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12px; }
          .page { padding: 20px !important; }
        }
      `}</style>
      {children}
    </>
  )
}
