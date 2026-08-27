// Canonical Arena components. See DESIGN.md.

export function Panel({ children, className = '' }) {
  return (
    <div className={`bg-raised border border-line rounded ${className}`}>{children}</div>
  )
}

// The signature element: a YES/NO probability meter with a big mono percentage.
export function ProbMeter({ yesProb, size = 'md' }) {
  const yes = Math.round((yesProb ?? 0.5) * 100)
  const big = size === 'lg'
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={`font-display font-bold text-yes ${big ? 'text-4xl' : 'text-lg'}`}>
          {yes}
          <span className="text-dim font-mono text-xs font-normal ml-0.5">% YES</span>
        </span>
        <span className={`text-no font-mono ${big ? 'text-base' : 'text-xs'}`}>
          {100 - yes}% NO
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-no/25 flex">
        <div
          className="bg-yes h-full transition-all duration-500"
          style={{ width: `${yes}%`, boxShadow: '0 0 8px rgba(70,198,107,0.5)' }}
        />
      </div>
    </div>
  )
}

export function Stat({ label, value, delta, sub }) {
  return (
    <div className="bg-raised border border-line rounded px-4 py-3">
      <div className="font-display text-2xl font-bold text-text leading-none">{value}</div>
      <div className="eyebrow mt-2">{label}</div>
      {delta != null && (
        <div className={`text-xs mt-1 ${delta >= 0 ? 'text-yes' : 'text-no'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}
        </div>
      )}
      {sub && <div className="text-xs text-dim mt-1">{sub}</div>}
    </div>
  )
}

const BADGE = {
  default: 'text-dim border-line',
  open: 'text-amber border-amber/40',
  closed: 'text-dim border-line-bright',
  resolved: 'text-yes border-yes/40',
  builtin: 'text-amber border-amber/40',
  external: 'text-text border-line-bright',
  active: 'text-yes border-yes/40',
  off: 'text-faint border-line',
  YES: 'text-yes border-yes/40',
  NO: 'text-no border-no/40',
}

export function Badge({ children, tone }) {
  const cls = BADGE[children] || BADGE[tone] || BADGE.default
  return (
    <span
      className={`inline-block font-mono uppercase px-1.5 py-0.5 rounded border leading-none ${cls}`}
      style={{ fontSize: 10, letterSpacing: '0.06em' }}
    >
      {children}
    </span>
  )
}

export function Delta({ value, suffix = '' }) {
  if (value == null) return <span className="text-faint">—</span>
  const pos = value >= 0
  return (
    <span className={pos ? 'text-yes' : 'text-no'}>
      {pos ? '+' : ''}
      {value}
      {suffix}
    </span>
  )
}

export function Spinner({ label = 'reading tape' }) {
  return (
    <div className="text-dim text-sm py-10 text-center font-mono">
      {label}
      <span className="cursor">.</span>
    </div>
  )
}
