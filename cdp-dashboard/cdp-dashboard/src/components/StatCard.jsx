export default function StatCard({ label, value, sub, accent = '#00d4ff', icon }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '20px 24px',
      position: 'relative',
      overflow: 'hidden',
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }} />
      <div style={{ color: 'var(--text3)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
        {icon} {label}
      </div>
      <div style={{ color: accent, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 6, fontFamily: "'DM Mono', monospace" }}>{sub}</div>}
    </div>
  );
}
