const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CustomTooltip({ active, payload, label, year }) {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0]?.value ?? 0;
  const month = MONTHS[parseInt(label)] || label;

  return (
    <div style={{
      background: 'rgba(13,18,32,0.97)',
      border: '1px solid rgba(0,212,255,0.3)',
      borderRadius: '10px',
      padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      fontFamily: "'DM Mono', monospace",
      minWidth: 140,
    }}>
      <div style={{ color: '#8899bb', fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>
        {month} {year}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ color: '#00d4ff', fontSize: 24, fontWeight: 500 }}>{val}</span>
        <span style={{ color: '#4a5f80', fontSize: 11 }}>New Users</span>
      </div>
    </div>
  );
}
