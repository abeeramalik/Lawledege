import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../lib/hooks';
import { Spinner, EmptyState } from '../Components/SocialUI';
import ReviewModal from "../Components/ReviewModal";
import Toast from "../Components/ui/Toast";
import { DEPARTMENT_DIRECTORY } from "../lib/whatsappSender"; 
import "./AdminDashboard.css"; 

//admin email and password for gate access
const ADMIN_EMAIL = 'admin@lawledge.pk';
const ADMIN_PASSWORD = 'lawledge@admin2024';

const TAB_ITEMS = [
  { key: 'complaints', label: 'Complaints Portal', icon: '⚖️' },
  { key: 'posts',      label: 'User Content', icon: '📝' },
  { key: 'users',      label: 'Volunteer Ledger', icon: '👥' },
  { key: 'help',       label: 'SOS Inquiries', icon: '🆘' },
];

const STAT_ITEMS = (complaints, users, helpReqs, posts) => [
  { label: 'Complaints', icon: '⚖️', value: complaints.length },
  { label: 'Network Users', icon: '👥', value: users.length },
  { label: 'SOS Open', icon: '🆘', value: helpReqs.filter(x => x.status === 'open').length },
  { label: 'Active Posts', icon: '📝', value: posts.length },
];

/* Helper to resolve directory mismatches caused by whitespace or formatting */
const getDepartmentPhone = (authorityName) => {
  if (!authorityName) return "";
  const entry = DEPARTMENT_DIRECTORY[authorityName.trim()];
  if (!entry) return "";
  let cleaned = entry.phone.toString().replace(/\D/g, "");
  return cleaned.startsWith("0") ? "92" + cleaned.substring(1) : cleaned;
};

/* ─── Role Gate Overlay ─────────────────────────────────────────────────── */
function RoleGate({ onRoleSelect }) {
  const [step, setStep] = useState('choose'); // 'choose' | 'admin-login'
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleAdminLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onRoleSelect('admin');
    } else {
      setPwError('Incorrect password. Access denied.');
      setPassword('');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.92)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '1.25rem',
        boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
        padding: '2.5rem 2.25rem',
        width: '100%',
        maxWidth: 420,
        fontFamily: 'Arial, sans-serif',
      }}>
        {step === 'choose' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚖️</div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Command Control Center
              </h2>
              <p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.92rem', fontWeight: 600 }}>
                How are you accessing this panel?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <button
                onClick={() => setStep('admin-login')}
                style={{
                  width: '100%', padding: '0.85rem 1.25rem',
                  background: '#0f172a', color: '#fff',
                  border: 'none', borderRadius: '0.65rem',
                  fontSize: '0.97rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem',
                  transition: 'background 0.18s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
              >
                <span style={{ fontSize: '1.2rem' }}>🔐</span>
                <span>I am an Admin</span>
                <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '0.85rem' }}>Full Access →</span>
              </button>

              <button
                onClick={() => onRoleSelect('user')}
                style={{
                  width: '100%', padding: '0.85rem 1.25rem',
                  background: '#f1f5f9', color: '#334155',
                  border: '1.5px solid #e2e8f0', borderRadius: '0.65rem',
                  fontSize: '0.97rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem',
                  transition: 'background 0.18s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                <span style={{ fontSize: '1.2rem' }}>👁️</span>
                <span>I am a User</span>
                <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '0.85rem' }}>Read-Only →</span>
              </button>
            </div>
          </>
        )}

        {step === 'admin-login' && (
          <>
            <button
              onClick={() => { setStep('choose'); setPwError(''); setPassword(''); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6b7280', fontWeight: 700, fontSize: '0.9rem',
                marginBottom: '1.25rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}
            >
              ← Back
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🔐</div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                Admin Authentication
              </h2>
              <p style={{ margin: '0.4rem 0 0', color: '#6b7280', fontSize: '0.88rem', fontWeight: 600 }}>
                Enter your admin password to continue
              </p>
            </div>

            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Admin password"
                value={password}
                onChange={e => { setPassword(e.target.value); setPwError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                style={{
                  width: '100%', padding: '0.8rem 3rem 0.8rem 1rem',
                  border: `1.5px solid ${pwError ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '0.65rem', fontSize: '0.97rem',
                  fontFamily: 'Arial, sans-serif', fontWeight: 600,
                  outline: 'none', color: '#0f172a', background: '#f8fafc',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', fontSize: '1rem',
                }}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>

            {pwError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '0.5rem', padding: '0.6rem 0.9rem',
                color: '#dc2626', fontSize: '0.85rem', fontWeight: 700,
                marginBottom: '0.75rem',
              }}>
                ⚠️ {pwError}
              </div>
            )}

            <button
              onClick={handleAdminLogin}
              style={{
                width: '100%', padding: '0.85rem',
                background: '#0f172a', color: '#fff',
                border: 'none', borderRadius: '0.65rem',
                fontSize: '0.97rem', fontWeight: 700, cursor: 'pointer',
                transition: 'background 0.18s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
              onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
            >
              Unlock Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Read-Only Banner ──────────────────────────────────────────────────── */
function ReadOnlyBanner({ onExit }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'linear-gradient(90deg, #0f172a 0%, #1e3a5f 100%)',
      color: '#fff', padding: '0.65rem 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: 'Arial, sans-serif', fontSize: '0.88rem', fontWeight: 700,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <span>👁️ READ-ONLY VIEW — You are browsing as a guest. No actions are available.</span>
      <button
        onClick={onExit}
        style={{
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff', borderRadius: '0.4rem', padding: '0.3rem 0.85rem',
          fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
        }}
      >
        ← Exit
      </button>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 'pending' = show gate | 'user' = readonly | 'admin' = full access
  const [role, setRole] = useState('pending');

  const [tab, setTab] = useState('complaints');
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [posts, setPosts]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [helpReqs, setHelpReqs] = useState([]);
  const [loading, setLoading]   = useState(false);

  // Security: Restrict full admin actions to admin email
  useEffect(() => {
    if (user === undefined) return;
    if (user && user.email !== ADMIN_EMAIL && role === 'admin') navigate('/feed', { replace: true });
  }, [user, navigate, role]);

  const fetchAllDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [complaintsRes, postsRes, usersRes, helpRes] = await Promise.all([
        supabase.from("complaints").select("*").order("created_at", { ascending: false }),
        supabase.from('posts').select('*, users(full_name)').order('created_at', { ascending: false }).limit(50),
        supabase.from('users').select('*, volunteer_profiles(level,points,verified)').order('created_at', { ascending: false }).limit(50),
        supabase.from('help_requests').select('*').order('created_at', { ascending: false }).limit(30),
      ]);
      if (complaintsRes.data) setComplaints(complaintsRes.data);
      setPosts(postsRes.data || []);
      setUsers(usersRes.data || []);
      setHelpReqs(helpRes.data || []);
    } catch {
      setToast({ type: "error", message: "Database sync failed." });
    }
    setLoading(false);
  }, []);

  // Fetch data once a role is chosen
  useEffect(() => {
    if (role !== 'pending') fetchAllDashboardData();
  }, [role, fetchAllDashboardData]);

  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = activeFilter === "all" || c.status === activeFilter;
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      (c.tracking_code?.toLowerCase().includes(lowerSearch)) ||
      (c.complainant_name?.toLowerCase().includes(lowerSearch));
    return matchesStatus && matchesSearch;
  });

  // Administrative Actions — only available to admin role
  async function handleApprove(id) {
    if (role !== 'admin') return;
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return;
    const { error } = await supabase.from("complaints").update({ status: 'approved' }).eq("id", id);
    if (error) { setToast({ type: "error", message: `Approval failed: ${error.message}` }); }
    else { setToast({ type: "success", message: "Complaint approved." }); fetchAllDashboardData(); }
    setSelected(null);
  }

  async function handlePurge(id, filePath) {
    if (role !== 'admin') return;
    if (!confirm("This will permanently delete the complaint record. Are you sure?")) return;
    await supabase.storage.from('evidence').remove([filePath]);
    const { error } = await supabase.from("complaints").delete().eq("id", id);
    if (!error) { setToast({ type: "success", message: "Complaint record purged." }); fetchAllDashboardData(); }
    else { setToast({ type: "error", message: `Purge failed: ${error.message}` }); }
    setSelected(null);
  }

  const deletePost    = async (id) => { if (role !== 'admin') return; await supabase.from('posts').delete().eq('id', id); setPosts(p => p.filter(x => x.id !== id)); };
  const verifyUser    = async (uid, v) => { if (role !== 'admin') return; await supabase.from('volunteer_profiles').update({ verified: v }).eq('user_id', uid); fetchAllDashboardData(); };
  const closeHelp     = async (id) => { if (role !== 'admin') return; await supabase.from('help_requests').update({ status: 'closed' }).eq('id', id); setHelpReqs(p => p.map(h => h.id === id ? { ...h, status: 'closed' } : h)); };
  const statItems = STAT_ITEMS(complaints, users, helpReqs, posts);

  const filterPillClass = (f) => {
    if (activeFilter !== f) return "filter-pill";
    return `filter-pill active-${f}`;
  };

  const isReadOnly = role === 'user';

  return (
    <>
      {/* Role Gate — shown until a role is chosen */}
      {role === 'pending' && (
        <RoleGate onRoleSelect={setRole} />
      )}

      <div style={{ minHeight: '100vh', background: '#f8fafc', filter: role === 'pending' ? 'blur(4px)' : 'none', pointerEvents: role === 'pending' ? 'none' : 'auto' }}>

        {/* Read-Only Banner for user role */}
        {isReadOnly && (
          <ReadOnlyBanner onExit={() => navigate('/', { replace: true })} />
        )}

        {/* Hero Banner */}
        <div className="admin-hero">
          <div className="admin-hero-top">
            <div>
              <h1 className="admin-hero-title">⚖️ Command Control Center</h1>
              <p className="admin-hero-sub">Lawledge Administration Dashboard</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Role badge */}
              <span style={{
                background: isReadOnly ? 'rgba(255,255,255,0.15)' : 'rgba(34,197,94,0.25)',
                color: isReadOnly ? '#cbd5e1' : '#86efac',
                border: `1px solid ${isReadOnly ? 'rgba(255,255,255,0.2)' : 'rgba(34,197,94,0.4)'}`,
                borderRadius: '2rem', padding: '0.3rem 0.9rem',
                fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Arial, sans-serif',
                letterSpacing: '0.04em',
              }}>
                {isReadOnly ? '👁 READ ONLY' : '🔐 ADMIN'}
              </span>
              <button className="btn-leave" onClick={() => navigate('/', { replace: true })}>← Leave Panel</button>
            </div>
          </div>
          <div className="admin-stats-grid">
            {statItems.map(s => (
              <div key={s.label} className="admin-stat-card">
                <span className="admin-stat-icon">{s.icon}</span>
                <span className="admin-stat-value">{s.value}</span>
                <span className="admin-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="admin-tab-bar">
          {TAB_ITEMS.map(({ key, label, icon }) => (
            <button key={key} className={`admin-tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="admin-content">
          {loading ? <Spinner /> : (
            <>
              {/* Tab 1: Complaints */}
              {tab === 'complaints' && (
                <>
                  <div className="admin-filter-bar">
                    <input className="admin-search-input" placeholder="🔍 Search by ID code or complainant name..."
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    {['all', 'pending', 'approved', 'resolved'].map(f => (
                      <button key={f} className={filterPillClass(f)} onClick={() => setActiveFilter(f)}>
                        {f === 'all' ? '📋 All' : f === 'pending' ? '⏳ Pending' : f === 'approved' ? '✅ Approved' : '✓ Resolved'}
                      </button>
                    ))}
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Complainant</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComplaints.map(c => (
                          <tr key={c.id}>
                            <td><strong>{c.tracking_code}</strong></td>
                            <td style={{fontWeight:700}}>{c.complainant_name}</td>
                            <td>{c.category}</td>
                            <td><span className={`status-pill ${c.status || 'pending'}`}>{c.status || 'pending'}</span></td>
                            <td>
                              {isReadOnly ? (
                                <button
                                  className="btn-review"
                                  style={{ background: '#94a3b8', cursor: 'not-allowed' }}
                                  title="Read-only mode — login as admin to take actions"
                                  disabled
                                >
                                  🔒 Locked
                                </button>
                              ) : (
                                <button className="btn-review" style={{ background: '#0f172a' }} onClick={() => setSelected(c)}>Review File</button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredComplaints.length === 0 && (
                          <tr><td colSpan="5" style={{textAlign:'center', padding:'2.5rem', color:'#9ca3af', fontFamily:'Arial', fontSize:'1.05rem'}}>No complaints match this filter.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Tab 3: User Content */}
              {tab === 'posts' && (
                posts.length === 0 ? <EmptyState icon="📝" text="No active posts" /> : posts.map(p => (
                  <div key={p.id} className="admin-item-card">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem'}}>
                      <div className="admin-item-title">Author: {p.users?.full_name}</div>
                      <span className="badge">{p.type}</span>
                    </div>
                    <div className="admin-item-sub">{p.content?.slice(0, 160)}{p.content?.length > 160 ? '…' : ''}</div>
                    <div className="admin-item-date">Posted: {new Date(p.created_at).toLocaleDateString()}</div>
                    {isReadOnly ? (
                      <button disabled className="btn-danger" style={{ opacity: 0.45, cursor: 'not-allowed' }} title="Read-only mode">🔒 Delete (locked)</button>
                    ) : (
                      <button onClick={() => deletePost(p.id)} className="btn-danger">🗑 Delete Post</button>
                    )}
                  </div>
                ))
              )}

              {/* Tab 4: Users */}
              {tab === 'users' && (
                users.length === 0 ? <EmptyState icon="👥" text="No ledger entries" /> : users.map(u => (
                  <div key={u.id} className="admin-item-card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                    <div className="user-avatar">{(u.full_name || '?').slice(0, 2).toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div className="admin-item-title" style={{marginBottom:'0.25rem'}}>{u.full_name}</div>
                      <div style={{fontFamily:'Arial', fontSize:'0.9rem', color:'#6b7280', fontWeight:600}}>
                        Level: {u.volunteer_profiles?.level || 'Newbie'} · Points: {u.volunteer_profiles?.points || 0}
                      </div>
                    </div>
                    {isReadOnly ? (
                      <button disabled className="btn-success" style={{ opacity: 0.45, cursor: 'not-allowed' }} title="Read-only mode">🔒 Locked</button>
                    ) : (
                      u.volunteer_profiles?.verified
                        ? <button onClick={() => verifyUser(u.id, false)} className="btn-danger">Revoke</button>
                        : <button onClick={() => verifyUser(u.id, true)} className="btn-success">✓ Verify</button>
                    )}
                  </div>
                ))
              )}

              {/* Tab 5: SOS Help */}
              {tab === 'help' && (
                helpReqs.length === 0 ? <EmptyState icon="🆘" text="No active emergencies" /> : helpReqs.map(h => (
                  <div key={h.id} className="admin-item-card">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem'}}>
                      <div className="admin-item-title">{h.title}</div>
                      <span className={`status-pill ${h.status}`}>{h.status}</span>
                    </div>
                    <div className="admin-item-sub">City: {h.city} · {h.required_volunteers} volunteers needed</div>
                    {h.status === 'open' && (
                      isReadOnly ? (
                        <button disabled className="btn-danger" style={{ opacity: 0.45, cursor: 'not-allowed' }} title="Read-only mode">🔒 Close (locked)</button>
                      ) : (
                        <button onClick={() => closeHelp(h.id)} className="btn-danger">Close Request</button>
                      )
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* ReviewModal only shown to admin */}
        {!isReadOnly && (
          <ReviewModal complaint={selected} onClose={() => setSelected(null)} onApprove={handleApprove} onPurge={handlePurge} />
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </>
  );
}