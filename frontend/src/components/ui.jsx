// Small shared UI primitives.

export function ProbBar({ yesProb, showLabels = true }) {
  const yes = Math.round((yesProb ?? 0.5) * 100)
  return (
    <div>
      {showLabels && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-yes">YES {yes}%</span>
          <span className="text-no">NO {100 - yes}%</span>
        </div>
      )}
      <div className="h-2 rounded-full overflow-hidden bg-no/40 flex">
        <div className="bg-yes h-full" style={{ width: `${yes}%` }} />
      </div>
    </div>
  )
}

export function StatCard({ label, value, sub }) {
  return (
    <div className="bg-panel border border-edge rounded-lg px-4 py-3">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-panel2 text-muted border-edge',
    open: 'bg-accent/15 text-accent border-accent/30',
    closed: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    resolved: 'bg-green-500/15 text-green-400 border-green-500/30',
    builtin: 'bg-accent/15 text-accent border-accent/30',
    external: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    YES: 'bg-yes/15 text-yes border-yes/30',
    NO: 'bg-no/15 text-no border-no/30',
  }
  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${
        tones[children] || tones[tone] || tones.default
      }`}
    >
      {children}
    </span>
  )
}

export function Spinner({ label = 'loading…' }) {
  return <div className="text-muted text-sm py-8 text-center animate-pulse">{label}</div>
}

export function Panel({ children, className = '' }) {
  return <div className={`bg-panel border border-edge rounded-lg ${className}`}>{children}</div>
}
