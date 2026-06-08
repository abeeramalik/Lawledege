import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';
import { LIMITS, validateBroadcast, validateChallenge } from '../lib/validators';
import { ensureVolunteerProfile } from '../lib/volunteerProfile';

const emptyBroadcast = { title: '', body: '', target_role: 'all' };
const emptyChallenge = { title: '', description: '', target: 5, points: 30, active: true };


function Stat({ label, value, color }) {
  return <div style={{ background:'#fff', borderRadius:14, padding:'16px 12px', textAlign:'center', border:'1.5px solid var(--border)', flex:1 }}><div style={{ fontWeight:900, fontSize:24, color }}>{value}</div><div style={{ fontSize:11, color:'var(--muted)', fontWeight:700 }}>{label}</div></div>;
}

function Card({ children }) {
  return <div style={{ background:'#fff', borderRadius:16, padding:16, border:'1.5px solid var(--border)', marginBottom:12, boxShadow:'var(--shadow)' }}>{children}</div>;
}

function smallBtn(label, onClick, bg = 'var(--primary-light)', color = 'var(--primary)') {
  return <button onClick={onClick} style={{ background:bg, color, border:'none', borderRadius:10, padding:'7px 11px', fontSize:12, fontWeight:900, cursor:'pointer' }}>{label}</button>;
}

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('broadcast');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [help, setHelp] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [broadcast, setBroadcast] = useState(emptyBroadcast);
  const [challenge, setChallenge] = useState(emptyChallenge);
  const [msg, setMsg] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setMsg('');
    try {
      const [rRes, pRes, uRes, hRes, chRes, bRes] = await Promise.all([
        supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('posts').select('*, users(full_name, email)').order('created_at', { ascending: false }).limit(200),
        supabase.from('users').select('*, volunteer_profiles(level, points, verified, hours)').order('created_at', { ascending: false }).limit(300),
        supabase.from('help_requests').select('*, users(full_name, email)').order('created_at', { ascending: false }).limit(200),
        supabase.from('challenges').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('broadcast_notifications').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      setReports(rRes.data || []);
      setPosts(pRes.data || []);
      setUsers(uRes.data || []);
      setHelp(hRes.data || []);
      setChallenges(chRes.data || []);
      setBroadcasts(bRes.data || []);
    } catch (e) {
      setMsg(`Admin load error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user && isAdmin) fetchAll(); }, [user, isAdmin]);

  const doAction = async (fn, ok = 'Done') => {
    setMsg('');
    try { await fn(); setMsg(ok); await fetchAll(); } catch (e) { setMsg(e.message || 'Action failed'); }
  };

  const deletePost = (id) => doAction(async () => { const { error } = await supabase.from('posts').delete().eq('id', id); if (error) throw error; }, 'Post/Reel deleted.');
  const deleteHelp = (id) => doAction(async () => { const { error } = await supabase.from('help_requests').delete().eq('id', id); if (error) throw error; }, 'Help request deleted.');
  const closeHelp = (id) => doAction(async () => { const { error } = await supabase.from('help_requests').update({ status: 'closed' }).eq('id', id); if (error) throw error; }, 'Help request closed.');
  const dismissReport = (id) => doAction(async () => { const { error } = await supabase.from('reports').delete().eq('id', id); if (error) throw error; }, 'Report dismissed.');
  const verifyVolunteer = (uid, verified) => doAction(async () => { const { error } = await supabase.from('volunteer_profiles').update({ verified }).eq('user_id', uid); if (error) throw error; }, verified ? 'Volunteer verified.' : 'Verification removed.');
  const setRole = (uid, role) => doAction(async () => {
    const { error } = await supabase.from('users').update({ role, is_volunteer: role === 'volunteer' }).eq('id', uid);
    if (error) throw error;
    if (role === 'volunteer') await ensureVolunteerProfile(uid, { level:'Newbie', availability:'Available', points:0, impact_score:0, hours:0, skills:[], show_contact:true });
  }, 'Role updated.');
  const blockUser = (uid, blocked) => doAction(async () => { const { error } = await supabase.from('users').update({ status: blocked ? 'blocked' : 'active' }).eq('id', uid); if (error) throw error; }, blocked ? 'User blocked. They will be signed out and app access denied.' : 'User unblocked.');

  const sendBroadcast = () => doAction(async () => {
    const validationError = validateBroadcast(broadcast);
    if (validationError) throw new Error(validationError);
    const { error } = await supabase.from('broadcast_notifications').insert({ title: broadcast.title.trim(), body: broadcast.body.trim(), target_role: broadcast.target_role, created_by: user.id });
    if (error) throw error;
    setBroadcast(emptyBroadcast);
  }, 'Notification sent to selected audience.');

  const addChallenge = () => doAction(async () => {
    const validationError = validateChallenge(challenge);
    if (validationError) throw new Error(validationError);
    const { error } = await supabase.from('challenges').insert({ title: challenge.title.trim(), description: challenge.description.trim() || null, target: Number(challenge.target), points: Number(challenge.points) || 30, active: challenge.active });
    if (error) throw error;
    setChallenge(emptyChallenge);
  }, 'Challenge created.');
  const toggleChallenge = (c) => doAction(async () => { const { error } = await supabase.from('challenges').update({ active: !c.active }).eq('id', c.id); if (error) throw error; }, 'Challenge updated.');
  const deleteChallenge = (id) => doAction(async () => { const { error } = await supabase.from('challenges').delete().eq('id', id); if (error) throw error; }, 'Challenge deleted.');

  if (!isAdmin) return null;

  const stats = {
    users: users.length,
    volunteers: users.filter(u => u.role === 'volunteer' || u.is_volunteer).length,
    blocked: users.filter(u => u.status === 'blocked').length,
    posts: posts.filter(p => !p.is_story).length,
    reels: posts.filter(p => p.is_story).length,
    helpOpen: help.filter(h => h.status === 'open').length,
  };


  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ background:'linear-gradient(135deg,#1a0a2e,#7b2ff7)', padding:'48px 0 0' }}>
        <div style={{ padding:'0 20px 20px', maxWidth:880, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}><button onClick={() => navigate('/feed')} style={{ background:'#fff2', border:'none', borderRadius:10, padding:'7px 16px', color:'#fff', cursor:'pointer', fontWeight:900 }}>← Feed</button><h1 style={{ color:'#fff', fontSize:20, fontWeight:900, margin:0 }}>Admin Dashboard</h1><button onClick={fetchAll} style={{ marginLeft:'auto', background:'#fff', color:'#1a0a2e', border:'none', borderRadius:10, padding:'7px 14px', fontWeight:900, cursor:'pointer' }}>Refresh</button></div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}><Stat label="Users" value={stats.users} color="#7b2ff7"/><Stat label="Volunteers" value={stats.volunteers} color="#ff0080"/><Stat label="Blocked" value={stats.blocked} color="#c62828"/><Stat label="Feed Posts" value={stats.posts} color="#00bcd4"/><Stat label="Reels/Stories" value={stats.reels} color="#ff8c00"/><Stat label="Open Help" value={stats.helpOpen} color="#ff1744"/></div>
        </div>
      </div>

      <div style={{ display:'flex', background:'#fff', borderBottom:'1.5px solid var(--border)', overflowX:'auto', maxWidth:880, margin:'0 auto' }}>{[['broadcast','Notification'],['posts','Posts/Reels'],['users','Users'],['help','Help'],['challenges','Challenges']].map(([k,l]) => <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:'13px 10px', border:'none', background:'none', color:tab === k ? 'var(--primary)' : 'var(--muted)', fontWeight:900, fontSize:12, cursor:'pointer', borderBottom:`3px solid ${tab === k ? 'var(--primary)' : 'transparent'}`, whiteSpace:'nowrap' }}>{l}</button>)}</div>

      <div style={{ padding:'16px 12px 80px', maxWidth:880, margin:'0 auto' }}>
        {loading && <div style={{ textAlign:'center', padding:32, color:'var(--muted)' }}>Loading records...</div>}
        {msg && <div style={{ background:msg.includes('error') || msg.includes('failed') ? '#ffe8e8' : '#e8fff3', color:msg.includes('error') || msg.includes('failed') ? '#c62828' : '#1b5e20', borderRadius:12, padding:'10px 14px', fontSize:13, marginBottom:12, fontWeight:800 }}>{msg}</div>}

        {tab === 'broadcast' && !loading && <><Card><div style={{ fontWeight:900, fontSize:16, marginBottom:12 }}>Send Notification</div><input value={broadcast.title} onChange={e => setBroadcast(p => ({ ...p, title:e.target.value.slice(0, LIMITS.broadcastTitleMax) }))} maxLength={LIMITS.broadcastTitleMax} placeholder="Title" style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:12, marginBottom:10, boxSizing:'border-box' }} /><textarea value={broadcast.body} onChange={e => setBroadcast(p => ({ ...p, body:e.target.value.slice(0, LIMITS.broadcastBodyMax) }))} maxLength={LIMITS.broadcastBodyMax} placeholder="Message shown to users/volunteers" rows={3} style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:12, marginBottom:10, boxSizing:'border-box' }} /><select value={broadcast.target_role} onChange={e => setBroadcast(p => ({ ...p, target_role:e.target.value }))} style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:12, marginBottom:12 }}><option value="all">All users and volunteers</option><option value="user">Users only</option><option value="volunteer">Volunteers only</option></select>{smallBtn('Send Notification', sendBroadcast, 'linear-gradient(135deg,#7b2ff7,#ff0080)', '#fff')}</Card>{broadcasts.map(b => <Card key={b.id}><div style={{ fontWeight:900 }}>{b.title}</div><div style={{ fontSize:13, color:'var(--muted)', margin:'6px 0' }}>{b.body}</div><div style={{ fontSize:11, color:'var(--muted)' }}>Target: {b.target_role} · {new Date(b.created_at).toLocaleString()}</div></Card>)}</>}

        {tab === 'posts' && !loading && posts.map(p => <Card key={p.id}><div style={{ display:'flex', justifyContent:'space-between', gap:10, marginBottom:6 }}><div><div style={{ fontWeight:900 }}>{p.users?.full_name || 'Unknown'}</div><div style={{ fontSize:11, color:'var(--muted)' }}>{p.users?.email || p.user_id}</div></div><span style={{ background:p.is_story ? '#ede7f6' : 'var(--primary-light)', color:'var(--primary)', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:900 }}>{p.is_story ? 'Reel/Story' : p.type}</span></div><p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>{p.content?.slice(0,220)}{p.content?.length > 220 ? '…' : ''}</p>{p.media_url && <div style={{ fontSize:11, color:'var(--muted)', marginBottom:10 }}>Media saved: yes</div>}<div style={{ display:'flex', gap:8 }}>{smallBtn('Open Profile', () => navigate(`/profile/${p.user_id}`))}{smallBtn('Delete', () => deletePost(p.id), '#ffe8e8', '#c62828')}</div></Card>)}

        {tab === 'users' && !loading && users.map(u => <Card key={u.id}><div style={{ display:'flex', gap:12, alignItems:'center' }}><div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#7b2ff7,#ff0080)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>{(u.full_name || '?').slice(0,2).toUpperCase()}</div><div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:900 }}>{u.full_name || '—'}</div><div style={{ fontSize:12, color:'var(--muted)' }}>{u.email || u.id} · {u.role || (u.is_volunteer ? 'volunteer' : 'user')} · {u.status || 'active'}</div><div style={{ fontSize:11, color:'var(--muted)' }}>Points: {u.volunteer_profiles?.points || 0} · Level: {u.volunteer_profiles?.level || '-'}</div></div></div><div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>{u.id !== user.id && smallBtn(u.status === 'blocked' ? 'Unblock' : 'Block', () => blockUser(u.id, u.status !== 'blocked'), u.status === 'blocked' ? '#e8fff3' : '#ffe8e8', u.status === 'blocked' ? '#1b5e20' : '#c62828')}{u.role !== 'admin' && smallBtn(u.role === 'volunteer' ? 'Make User' : 'Make Volunteer', () => setRole(u.id, u.role === 'volunteer' ? 'user' : 'volunteer'))}{(u.role === 'volunteer' || u.is_volunteer) && smallBtn(u.volunteer_profiles?.verified ? 'Unverify' : 'Verify Volunteer', () => verifyVolunteer(u.id, !u.volunteer_profiles?.verified))}{smallBtn('Profile', () => navigate(`/profile/${u.id}`))}</div></Card>)}

        {tab === 'help' && !loading && help.map(h => <Card key={h.id}><div style={{ display:'flex', justifyContent:'space-between', gap:10 }}><div><div style={{ fontWeight:900 }}>{h.title}</div><div style={{ fontSize:12, color:'var(--muted)' }}>By {h.users?.full_name || h.created_by} · {h.city} · {h.urgency}</div></div><span style={{ background:h.status === 'open' ? '#e8fff3' : '#ffe8e8', color:h.status === 'open' ? '#1b5e20' : '#c62828', borderRadius:18, padding:'4px 10px', fontSize:11, fontWeight:900 }}>{h.status}</span></div><p style={{ fontSize:13, color:'var(--muted)' }}>{h.description}</p><div style={{ fontSize:12, fontWeight:800, marginBottom:10 }}>Volunteers: {(h.volunteers_assigned || []).length}/{h.volunteers_needed || 2}</div><div style={{ display:'flex', gap:8 }}>{h.status === 'open' && smallBtn('Close', () => closeHelp(h.id), '#fff8e8', '#e65100')}{smallBtn('Delete', () => deleteHelp(h.id), '#ffe8e8', '#c62828')}{smallBtn('Private Room', () => navigate(`/messages?room=help_${h.id}`))}</div></Card>)}

        {tab === 'challenges' && !loading && <><Card><div style={{ fontWeight:900, fontSize:16, marginBottom:12 }}>Create / Manage Challenge</div><input value={challenge.title} onChange={e => setChallenge(p => ({ ...p, title:e.target.value.slice(0, LIMITS.challengeTitleMax) }))} maxLength={LIMITS.challengeTitleMax} placeholder="Challenge title" style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:12, marginBottom:10, boxSizing:'border-box' }} /><textarea value={challenge.description} onChange={e => setChallenge(p => ({ ...p, description:e.target.value.slice(0, LIMITS.challengeDescriptionMax) }))} maxLength={LIMITS.challengeDescriptionMax} placeholder="Description / criteria" rows={2} style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:12, marginBottom:10, boxSizing:'border-box' }} /><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}><label style={{ fontSize:12, color:'var(--muted)', fontWeight:800 }}>Target<input type="number" min="1" max="1000" value={challenge.target} onChange={e => setChallenge(p => ({ ...p, target:e.target.value }))} style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:12, marginTop:6, boxSizing:'border-box' }} /></label><label style={{ fontSize:12, color:'var(--muted)', fontWeight:800 }}>Reward Points<input type="number" min="1" max="1000" value={challenge.points} onChange={e => setChallenge(p => ({ ...p, points:e.target.value }))} style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:12, marginTop:6, boxSizing:'border-box' }} /></label></div>{smallBtn('Add Challenge', addChallenge, 'linear-gradient(135deg,#7b2ff7,#ff0080)', '#fff')}</Card>{challenges.map(c => <Card key={c.id}><div style={{ fontWeight:900 }}>{c.title}</div><div style={{ fontSize:13, color:'var(--muted)', margin:'6px 0' }}>{c.description}</div><div style={{ fontSize:12, fontWeight:800, marginBottom:10 }}>Target: {c.target} · Reward: {c.points || 30} pts · {c.active ? 'Active' : 'Inactive'}</div><div style={{ display:'flex', gap:8 }}>{smallBtn(c.active ? 'Deactivate' : 'Activate', () => toggleChallenge(c))}{smallBtn('Delete', () => deleteChallenge(c.id), '#ffe8e8', '#c62828')}</div></Card>)}</>}

      </div>
    </div>
  );
}
