import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../lib/hooks'; // Integrated to share single state channel
import { Spinner, Badge, EmptyState } from '../Components/SocialUI';
import ReviewModal from "../Components/ReviewModal";
import Button from "../Components/ui/Button";
import Table from "../Components/ui/Table";
import Toast from "../Components/ui/Toast";
import { DEPARTMENT_DIRECTORY } from "../lib/whatsappSender"; 
import "./AdminDashboard.css"; 

// Site Administration Security Baseline Configurations
const ADMIN_EMAIL    = 'admin@lawledge.pk';
const ADMIN_PASSWORD = 'Admin@123';          

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Access Validation Control Gates
  const [gate, setGate]         = useState(false);   
  const [gatePwd, setGatePwd]   = useState('');
  const [gateErr, setGateErr]   = useState('');

  // Primary Workspace Configuration Keys
  const [tab, setTab]           = useState('complaints'); // Default to your core portal
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [toast, setToast]       = useState(null);

  // Teammate Modular State Arrays
  const [reports, setReports]   = useState([]);
  const [posts, setPosts]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [helpReqs, setHelpReqs] = useState([]);
  const [loading, setLoading]   = useState(false);

  // FIXED: Security access validation gate rewritten with explicit history state replacements
  useEffect(() => {
    // If authorization state is still loading or undetermined, wait!
    if (user === undefined) return;

    if (!user) { 
      // replace: true overwrites the history index so clicking 'back' doesn't cause loop traps
      navigate('/login', { replace: true }); 
      return; 
    }
    
    if (user.email !== ADMIN_EMAIL) { 
      navigate('/feed', { replace: true }); 
    }
  }, [user, navigate]);

  // Unified Centralized Data Acquisition Engine
  const fetchAllDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [complaintsRes, reportsRes, postsRes, usersRes, helpRes] = await Promise.all([
        supabase.from("complaints").select("*").order("created_at", { ascending: false }),
        supabase.from('reports').select('*, users!reported_by(full_name)').order('created_at', { ascending: false }).limit(50),
        supabase.from('posts').select('*, users(full_name)').order('created_at', { ascending: false }).limit(50),
        supabase.from('users').select('*, volunteer_profiles(level,points,verified)').order('created_at', { ascending: false }).limit(50),
        supabase.from('help_requests').select('*').order('created_at', { ascending: false }).limit(30),
      ]);

      if (complaintsRes.data) setComplaints(complaintsRes.data);
      setReports(reportsRes.data || []);
      setPosts(postsRes.data || []);
      setUsers(usersRes.data || []);
      setHelpReqs(helpRes.data || []);
    } catch (err) {
      console.error("Dashboard engine failed parsing record rows:", err);
      setToast({ type: "error", message: "Database sync failed." });
    }
    setLoading(false);
  }, []);

  const unlockAdmin = () => {
    if (gatePwd === ADMIN_PASSWORD) {
      setGate(true);
      setGateErr('');
      fetchAllDashboardData();
    } else {
      setGateErr('Incorrect admin password.');
    }
  };

  // Pure memory computation filters items dynamically during render layout loops.
  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = activeFilter === "all" || c.status === activeFilter;
    
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (c.tracking_code?.toLowerCase().includes(lowerSearch)) ||
      (c.complainant_name?.toLowerCase().includes(lowerSearch));
      
    return matchesStatus && matchesSearch;
  });

  // ── Official Complaint Workflow Actions ──
  async function handlePurge(id, filePath) {
    if (!confirm("This will permanently delete the complaint record and the evidence. Are you sure?")) return;
    setToast({ type: "loading", message: "Purging data..." });
    await supabase.storage.from('evidence').remove([filePath]);
    const { error } = await supabase.from("complaints").delete().eq("id", id);

    if (!error) {
      setToast({ type: "success", message: "Complaint record purged." });
      fetchAllDashboardData(); 
    } else {
      setToast({ type: "error", message: `Purge failed: ${error.message}` });
    }
    setSelected(null);
  }

  async function handleApprove(id) {
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return;

    const { error } = await supabase.from("complaints").update({ status: 'approved' }).eq("id", id);
    
    if (error) {
      setToast({ type: "error", message: `Approval failed: ${error.message}` });
    } else {
      setToast({ type: "success", message: "Complaint approved. Sending dispatch copies..." });
      const authorityInfo = DEPARTMENT_DIRECTORY.find(d => d.name === complaint.assigned_authority);
      
      try {
        await emailjs.send('your_emailjs_service_id', 'your_emailjs_template_id', {
          to_email: authorityInfo?.email || 'admin@lawledge.gov.pk',
          from_name: 'Lawledge Portal',
          to_name: complaint.assigned_authority,
          subject: `Official Complaint - Tracking ID: ${complaint.tracking_code}`,
          message: `Respected ${complaint.assigned_authority},\n\nA complaint has been approved and forwarded to your department for action.\n\nTracking ID: ${complaint.tracking_code}\nComplainant: ${complaint.complainant_name}\nCategory: ${complaint.category}\nLocation: ${complaint.location}\nSeverity: ${complaint.severity}\n\nDetails:\n${complaint.complaint_text}\n\nLaw Section: ${complaint.ppc_mapping || 'General'}\n\nPlease take necessary action and update the status accordingly.\n\nRegards,\nLawledge Portal Team`
        }, 'your_emailjs_user_id');
      } catch (e) {
        console.warn('Authority notification failure:', e);
      }

      if (complaint.complainant_email) {
        try {
          await emailjs.send('your_emailjs_service_id', 'your_emailjs_template_id', {
            to_email: complaint.complainant_email,
            from_name: 'Lawledge Portal',
            to_name: complaint.complainant_name,
            subject: `Complaint Approved - Tracking ID: ${complaint.tracking_code}`,
            message: `Dear ${complaint.complainant_name},\n\nYour complaint has been APPROVED and forwarded to the concerned authority for immediate action.\n\nTracking ID: ${complaint.tracking_code}\nCategory: ${complaint.category}\nStatus: Approved\n\nThe authority will review your complaint and take appropriate action. You can track the progress at: https://lawledgeportal.com/track?code=${complaint.tracking_code}\n\nThank you for bringing this matter to our attention.\n\nBest regards,\nLawledge Portal Team`
          }, 'your_emailjs_user_id');
        } catch (e) {
          console.warn('Complainant notification failure:', e);
        }
      }
      fetchAllDashboardData(); 
    }
    setSelected(null);
  }

  // ── Teammate Moderator System Actions ──
  const deletePost    = async (id)     => { await supabase.from('posts').delete().eq('id', id); setPosts(p => p.filter(x => x.id !== id)); };
  const verifyUser    = async (uid, v) => { await supabase.from('volunteer_profiles').update({ verified: v }).eq('user_id', uid); fetchAllDashboardData(); };
  const closeHelp     = async (id)     => { await supabase.from('help_requests').update({ status: 'closed' }).eq('id', id); setHelpReqs(p => p.map(h => h.id===id?{...h,status:'closed'}:h)); };
  const dismissReport = async (id)     => { await supabase.from('reports').delete().eq('id', id); setReports(p => p.filter(r => r.id !== id)); };

  // Password Gate Security Layer
  if (!gate) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* FIXED: Added a dedicated, clean UI Exit button so users have an alternative escape route out of the gate */}
        <button 
          onClick={() => navigate('/', { replace: true })}
          style={{ position: 'absolute', top: 24, left: 24, background: '#fff', border: '1.5px solid var(--border)', padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          ← Exit to Portal
        </button>

        <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 24, padding: 32, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#1a0a2e,#7b2ff7)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: 'var(--text)', marginBottom: 6 }}>Admin Access</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Enter the secure credentials key</p>

          <input
            type="password"
            value={gatePwd}
            onChange={e => setGatePwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && unlockAdmin()}
            placeholder="••••••••"
            style={{ marginBottom: 14, padding: '12px', border: '1.5px solid var(--border)', borderRadius: 12, width: '100%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.15em' }}
          />
          {gateErr && <div style={{ background: '#ffe8e8', color: '#c62828', borderRadius: 12, padding: '10px', fontSize: 13, marginBottom: 14 }}>{gateErr}</div>}
          <button className="btn-rainbow" onClick={unlockAdmin} style={{ width: '100%', padding: '12px', fontWeight: 800, border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer' }}>Unlock Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Metrics Banner Container */}
      <div style={{ background: 'linear-gradient(135deg,#1a0a2e,#7b2ff7)', padding: '48px 0 24px' }}>
        <div className="page-wrap" style={{ padding: '0 20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>Command Control Center</h1>
            {/* ADDED: UI Nav Header Button to offer alternative manual route exit layout mappings */}
            <button 
              onClick={() => navigate('/', { replace: true })}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              ← Leave Panel
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {[
              { label: 'Complaints', value: complaints.length, icon: '⚖️' },
              { label: 'Network Users', value: users.length, icon: '👥' },
              { label: 'SOS Hubs', value: helpReqs.filter(x=>x.status==='open').length, icon: '🆘' },
              { label: 'Alert Ticks', value: reports.length, icon: '⚠️' },
              { label: 'Active Posts', value: posts.length, icon: '📝' },
            ].map(s => (
              <div key={s.label} style={{ background: '#ffffff18', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 22, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#ffffffaa' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Module Switcher Tabs */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid var(--border)', overflowX: 'auto' }}>
        <div className="page-wrap" style={{ display: 'flex' }}>
          {[
            ['complaints', 'Complaints Portal'],
            ['reports', 'Infraction Reports'],
            ['posts', 'User Content'],
            ['users', 'Volunteer Ledger'],
            ['help', 'SOS Inquiries']
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '14px 8px', border: 'none', background: 'none', color: tab === key ? 'var(--primary)' : 'var(--muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderBottom: `3px solid ${tab === key ? 'var(--primary)' : 'transparent'}`, whiteSpace: 'nowrap' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Main Workspace Display Blocks */}
      <div style={{ padding: '20px 0 80px' }}>
        <div className="page-wrap" style={{ padding: '0 12px' }}>
          {loading ? <Spinner /> : (
            <>
              {/* Tab 1: Official Portal Complaints */}
              {tab === 'complaints' && (
                <div className="card shadow" style={{ background: '#fff', borderRadius: 20, padding: 16 }}>
                  <div className="filter-bar" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <input 
                      className="search-input" 
                      placeholder="Search by ID code or target name..." 
                      style={{ flex: 1, padding: 12, border: '1.5px solid var(--border)', borderRadius: 12 }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['all', 'pending', 'approved', 'resolved'].map(status => (
                        <Button key={status} variant={activeFilter === status ? "primary" : "outline"} onClick={() => setActiveFilter(status)}>
                          {status.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Table
                    headers={["Code", "Complainant", "Category", "Status", "Actions"]}
                    rows={filteredComplaints.map(c => [
                      <strong key={`code-${c.id}`}>{c.tracking_code}</strong>,
                      c.complainant_name,
                      c.category,
                      <span key={`badge-${c.id}`} className={`badge ${c.status || 'pending'}`}>{c.status || 'pending'}</span>,
                      <div key={`act-${c.id}`} className="flex gap-2">
                        <Button onClick={() => setSelected(c)}>Review File</Button>
                      </div>
                    ])}
                  />
                </div>
              )}

              {/* Tab 2: Infraction Reports */}
              {tab === 'reports' && (
                reports.length === 0
                  ? <EmptyState icon="🔍" text="All systems clear" sub="No outstanding content violations flags recorded." />
                  : reports.map(r => (
                    <div key={r.id} className="card" style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1.5px solid var(--border)', textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Reported by {r.users?.full_name || 'Anonymous User'}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>Reason: {r.reason}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>Logged: {new Date(r.created_at).toLocaleDateString()}</div>
                      <button onClick={() => dismissReport(r.id)} style={{ border: 'none', background: '#e8fff3', color: '#1b5e20', cursor: 'pointer', fontWeight: 700, padding: '8px 18px', borderRadius: 10 }}>Dismiss Infraction</button>
                    </div>
                  ))
              )}

              {/* Tab 3: User Content Feed Filtering */}
              {tab === 'posts' && (
                posts.length === 0 ? <EmptyState icon="📝" text="No active posts" /> : posts.map(p => (
                  <div key={p.id} className="card" style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1.5px solid var(--border)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Author: {p.users?.full_name}</div>
                      <Badge text={p.type} small />
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>{p.content?.slice(0, 140)}{p.content?.length > 140 ? '...' : ''}</p>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>Date: {new Date(p.created_at).toLocaleDateString()}</div>
                    <button onClick={() => deletePost(p.id)} style={{ border: 'none', background: '#ffe8e8', color: '#c62828', cursor: 'pointer', fontWeight: 700, padding: '8px 18px', borderRadius: 10 }}>Delete Post Content</button>
                  </div>
                ))
              )}

              {/* Tab 4: Network Verification Ledger */}
              {tab === 'users' && (
                users.length === 0 ? <EmptyState icon="👥" text="No ledger entries found" /> : users.map(u => (
                  <div key={u.id} className="card" style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7b2ff7,#ff0080)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                      {(u.full_name || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{u.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Rank Level: {u.volunteer_profiles?.level || 'Newbie'} · Points: {u.volunteer_profiles?.points || 0}</div>
                    </div>
                    {u.volunteer_profiles?.verified ? (
                      <button onClick={() => verifyUser(u.id, false)} style={{ border: 'none', background: '#ffe8e8', color: '#c62828', cursor: 'pointer', fontWeight: 700, borderRadius: 10, padding: '7px 14px' }}>Revoke Verification</button>
                    ) : (
                      <button onClick={() => verifyUser(u.id, true)} style={{ border: 'none', background: '#e8fff3', color: '#1b5e20', cursor: 'pointer', fontWeight: 700, borderRadius: 10, padding: '7px 14px' }}>Verify Volunteer</button>
                    )}
                  </div>
                ))
              )}

              {/* Tab 5: SOS Help Emergency Tracker */}
              {tab === 'help' && (
                helpReqs.length === 0 ? <EmptyState icon="🆘" text="No active emergencies logged" /> : helpReqs.map(h => (
                  <div key={h.id} className="card" style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1.5px solid var(--border)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{h.title}</div>
                      <Badge text={h.status} type={h.status === 'open' ? 'open' : 'closed'} small />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Jurisdiction: {h.city} · Open Quota: {h.required_volunteers} helpers needed</div>
                    {h.status === 'open' && (
                      <button onClick={() => closeHelp(h.id)} style={{ border: 'none', background: '#ffe8e8', color: '#c62828', cursor: 'pointer', fontWeight: 700, borderRadius: 10, padding: '8px 18px' }}>Close Request Channel</button>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      <ReviewModal complaint={selected} onClose={() => setSelected(null)} onApprove={handleApprove} onPurge={handlePurge} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}