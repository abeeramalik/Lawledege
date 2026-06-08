export function Avatar({ initials, src, size = 40, ring = false }) {
  const colors = ['#ff0080','#ff8c00','#ffd700','#00c851','#00bcd4','#7b2ff7','#e040fb','#ff4500'];
  const color = colors[(initials?.charCodeAt(0) || 0) % colors.length];
  const img = (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: src ? 'transparent' : `${color}22`,
      border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color,
      flexShrink: 0, overflow: 'hidden',
      fontFamily: "'Playfair Display', serif",
    }}>
      {src ? <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (initials || '?')}
    </div>
  );
  if (!ring) return img;
  return <div className="avatar-ring" style={{ flexShrink: 0 }}>{img}</div>;
}

export function Badge({ text, type = 'default', small }) {
  const types = {
    default: { bg: '#f0e8ff', color: '#7b2ff7' },
    urgent: { bg: '#ffe8e8', color: '#c62828' },
    success: { bg: '#e8fff3', color: '#1b5e20' },
    gold: { bg: '#fffde7', color: '#e65100' },
    open: { bg: '#e8f5e9', color: '#2e7d32' },
    closed: { bg: '#fce4ec', color: '#880e4f' },
    info: { bg: '#e3f2fd', color: '#0d47a1' },
  };
  const s = types[type] || types.default;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: small ? '2px 8px' : '3px 12px',
      borderRadius: 20, fontSize: small ? 10 : 11,
      fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>{text}</span>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid #ede9f8',
        borderTopColor: '#7b2ff7',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function RainbowBar() {
  return (
    <div style={{
      height: 3,
      background: 'linear-gradient(90deg, #ff0080, #ff8c00, #ffd700, #00c851, #00bcd4, #7b2ff7)',
    }} />
  );
}

export function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div className="slide-up card" onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, margin: '0 auto',
        borderRadius: '24px 24px 0 0', padding: 24, maxHeight: '90vh',
        overflowY: 'auto', background: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {title && <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>{title}</span>}
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--muted)', marginLeft: 'auto' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>}
      <input style={{
        width: '100%', border: '1.5px solid var(--border)',
        borderRadius: 12, padding: '11px 14px', fontSize: 14,
        background: 'var(--bg)', color: 'var(--text)',
        boxSizing: 'border-box', outline: 'none'
      }} {...props} />
    </div>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>}
      <textarea style={{
        width: '100%', border: '1.5px solid var(--border)',
        borderRadius: 12, padding: '11px 14px', fontSize: 14,
        background: 'var(--bg)', color: 'var(--text)',
        resize: 'vertical', fontFamily: 'Poppins, sans-serif',
        boxSizing: 'border-box', outline: 'none'
      }} {...props} />
    </div>
  );
}

export function LevelBadge({ level }) {
  // Syncing layout styles with our system gamification tiers
  const levels = {
    'Newbie': { bg: '#e3f2fd', color: '#0277bd', icon: '🌱' },
    'Bronze Ally': { bg: '#efebe9', color: '#5d4037', icon: '🛡️' },
    'Silver Guard': { bg: '#eceff1', color: '#455a64', icon: '⚡' },
    'Grandmaster Advocate': { background: 'linear-gradient(135deg,#ffd70033,#ff008033)', color: '#7b2ff7', icon: '👑' },
  };
  
  const l = levels[level] || levels['Newbie'];
  
  return (
    <span style={{
      background: l.bg || 'transparent',
      backgroundBlendMode: 'normal',
      backgroundImage: l.background || 'none',
      color: l.color, 
      padding: '3px 10px',
      borderRadius: 20, 
      fontSize: 11, 
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }}>{l.icon} {level}</span>
  );
}

export function EmptyState({ icon, text, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>{text}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  );
}
