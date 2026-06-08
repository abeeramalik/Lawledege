import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';
import { LIMITS, validateHelpRequest } from '../lib/validators';

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Multan', 'Faisalabad', 'Peshawar', 'Quetta'];
const URGENCY_COLOR = { urgent: '#ff1744', normal: '#ff8c00', low: '#00c851' };

export default function HelpRequests() {
  const { user, isVolunteer, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterUrg, setFilterUrg] = useState('');
  const [processingSlots, setProcessingSlots] = useState(new Set());
  const [form, setForm] = useState({ title: '', description: '', city: '', area: '', volunteers_needed: 2, urgency: 'normal', date_time: '' });

  const canCreateHelpRequest = Boolean(user) && !authLoading && (!isVolunteer || isAdmin);
  const canRespondToHelpRequest = Boolean(user) && !authLoading && isVolunteer && !isAdmin;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // First try Supabase's relationship join. If the new database is missing
      // a foreign-key relationship/cache, fall back to plain rows and then
      // load creator names separately so Help Requests still works.
      let q = supabase.from('help_requests').select('*, users(full_name, phone)').order('created_at', { ascending: false });
      if (filterCity) q = q.eq('city', filterCity);
      if (filterUrg) q = q.eq('urgency', filterUrg);
      let { data, error } = await q;

      if (error) {
        let fallback = supabase.from('help_requests').select('*').order('created_at', { ascending: false });
        if (filterCity) fallback = fallback.eq('city', filterCity);
        if (filterUrg) fallback = fallback.eq('urgency', filterUrg);
        const fallbackResult = await fallback;
        if (fallbackResult.error) throw fallbackResult.error;
        data = fallbackResult.data || [];

        const creatorIds = [...new Set(data.map(r => r.created_by).filter(Boolean))];
        if (creatorIds.length) {
          const { data: creators } = await supabase.from('users').select('id, full_name, phone').in('id', creatorIds);
          const creatorMap = new Map((creators || []).map(u => [u.id, u]));
          data = data.map(r => ({ ...r, users: creatorMap.get(r.created_by) || null }));
        }
      }

      setRequests(data || []);
    } catch (e) {
      console.error('Help requests load error:', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filterCity, filterUrg]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const channel = supabase.channel('help-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const respond = async (req) => {
    if (!user) return navigate('/login');
    if (!canRespondToHelpRequest) return;
    if (processingSlots.has(req.id)) return;
    setProcessingSlots(p => new Set([...p, req.id]));

    try {
      const { data, error } = await supabase.rpc('claim_help_request', { p_request_id: req.id });
      if (error) throw error;
      if (data?.success === false) {
        alert(data.message || 'This request is already fulfilled.');
      } else {
        // Update the UI immediately so the volunteer sees 1/2, 2/3, etc. without waiting for realtime.
        setRequests(prev => prev.map(item => {
          if (item.id !== req.id) return item;
          const assigned = Array.isArray(item.volunteers_assigned) ? item.volunteers_assigned : [];
          const nextAssigned = assigned.includes(user.id) ? assigned : [...assigned, user.id];
          const needed = Number(item.volunteers_needed || data?.volunteers_needed || 2);
          return {
            ...item,
            volunteers_assigned: nextAssigned,
            status: nextAssigned.length >= needed ? 'closed' : 'open',
          };
        }));
      }
      await load();
    } catch (e) {
      alert(e.message || 'Unable to respond to this help request. Please make sure the Supabase RPC SQL has been run.');
      await load();
    } finally {
      setProcessingSlots(p => { const s = new Set(p); s.delete(req.id); return s; });
    }
  };

  const submit = async () => {
    if (!user) return navigate('/login');
    if (isVolunteer && !isAdmin) { setSubmitErr('Volunteers respond to help requests; only users can create them.'); return; }
    const validationError = validateHelpRequest(form);
    if (validationError) { setSubmitErr(validationError); return; }

    setSubmitting(true);
    setSubmitErr('');
    const { data, error } = await supabase.from('help_requests').insert({
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city,
      area: form.area.trim(),
      volunteers_needed: Math.max(1, Math.min(10, Number(form.volunteers_needed) || 2)),
      volunteers_assigned: [],
      urgency: form.urgency,
      date_time: form.date_time || null,
      created_by: user.id,
      status: 'open',
      created_at: new Date().toISOString(),
    }).select('id').single();

    if (error) setSubmitErr(error.message);
    else {
      setForm({ title: '', description: '', city: '', area: '', volunteers_needed: 2, urgency: 'normal', date_time: '' });
      setShowCreate(false);
      await supabase.from('activity_logs').insert({ user_id: user.id, action: `help_posted_${data?.id || Date.now()}` });
      await load();
    }
    setSubmitting(false);
  };

  const openPrivateChat = (req) => navigate(`/messages?room=help_${req.id}&name=${encodeURIComponent(req.title)}`);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ background:'linear-gradient(135deg,#ff1744,#ff6d00)', padding:'48px 20px 24px', textAlign:'center' }}>
        <div style={{ fontSize:44, marginBottom:8 }}>🤝</div>
        <h1 style={{ color:'#fff', fontSize:22, fontWeight:900, marginBottom:4 }}>Help Requests</h1>
        <p style={{ color:'#ffffffcc', fontSize:12, marginBottom:16 }}>{canRespondToHelpRequest ? 'Respond to help requests — first required volunteers earn points.' : 'Post a request — assigned volunteers can chat with you privately.'}</p>
        {canCreateHelpRequest && <button onClick={() => setShowCreate(true)} style={{ background:'#fff', color:'#ff1744', border:'none', borderRadius:14, padding:'10px 24px', fontWeight:900, cursor:'pointer', fontSize:14 }}>+ Post Help Request</button>}
      </div>

      <div style={{ background:'#fff', borderBottom:'1px solid var(--border)', padding:'12px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:680, margin:'0 auto', display:'flex', gap:8, overflowX:'auto' }}>
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ padding:'8px 12px', borderRadius:18, border:'1.5px solid var(--border)', fontWeight:700 }}><option value="">All Cities</option>{CITIES.map(c => <option key={c}>{c}</option>)}</select>
          <select value={filterUrg} onChange={e => setFilterUrg(e.target.value)} style={{ padding:'8px 12px', borderRadius:18, border:'1.5px solid var(--border)', fontWeight:700 }}><option value="">All Urgency</option><option value="urgent">Urgent</option><option value="normal">Normal</option><option value="low">Low</option></select>
          <button onClick={load} style={{ border:'none', background:'var(--primary-light)', color:'var(--primary)', borderRadius:18, padding:'8px 12px', fontWeight:900, cursor:'pointer' }}>Refresh</button>
        </div>
      </div>

      {showCreate && <div style={{ position:'fixed', inset:0, background:'#0007', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={() => setShowCreate(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:20, width:'100%', maxWidth:680, maxHeight:'90vh', overflowY:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}><h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>New Help Request</h2><button onClick={() => setShowCreate(false)} style={{ border:'none', background:'var(--bg)', borderRadius:'50%', width:32, height:32, cursor:'pointer' }}>×</button></div>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value.slice(0, LIMITS.helpTitleMax) }))} maxLength={LIMITS.helpTitleMax} placeholder="Title *" style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'12px 14px', marginBottom:10, boxSizing:'border-box' }} />
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value.slice(0, LIMITS.helpDescriptionMax) }))} maxLength={LIMITS.helpDescriptionMax} placeholder="Describe the issue... *" rows={4} style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'12px 14px', marginBottom:10, boxSizing:'border-box', resize:'none' }} />
          <input value={form.area} onChange={e => setForm(p => ({ ...p, area:e.target.value.slice(0, LIMITS.locationMax) }))} maxLength={LIMITS.locationMax} placeholder="Area / address hint *" style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'12px 14px', marginBottom:10, boxSizing:'border-box' }} />
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>{CITIES.map(c => <button key={c} onClick={() => setForm(p => ({ ...p, city:c }))} style={{ padding:'7px 12px', borderRadius:20, border:`2px solid ${form.city === c ? '#ff1744' : 'var(--border)'}`, background:form.city === c ? '#ffe8e8' : 'transparent', color:form.city === c ? '#ff1744' : 'var(--muted)', fontWeight:800, cursor:'pointer' }}>{c}</button>)}</div>
          <div style={{ display:'flex', gap:10, marginBottom:12 }}><input type="number" min="1" max="10" value={form.volunteers_needed} onChange={e => setForm(p => ({ ...p, volunteers_needed:e.target.value }))} placeholder="Volunteers needed" style={{ flex:1, border:'1.5px solid var(--border)', borderRadius:12, padding:'12px', boxSizing:'border-box' }} /><select value={form.urgency} onChange={e => setForm(p => ({ ...p, urgency:e.target.value }))} style={{ flex:1, border:'1.5px solid var(--border)', borderRadius:12, padding:'12px' }}><option value="urgent">Urgent</option><option value="normal">Normal</option><option value="low">Low</option></select></div>
          <input type="datetime-local" value={form.date_time} onChange={e => setForm(p => ({ ...p, date_time:e.target.value }))} style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'12px 14px', marginBottom:12, boxSizing:'border-box' }} />
          {submitErr && <div style={{ background:'#ffe8e8', color:'#c62828', borderRadius:12, padding:'10px 14px', fontSize:13, marginBottom:12 }}>{submitErr}</div>}
          <button onClick={submit} disabled={submitting} style={{ width:'100%', background:'linear-gradient(135deg,#ff1744,#ff6d00)', color:'#fff', border:'none', borderRadius:14, padding:14, fontWeight:900, fontSize:15, cursor:'pointer', opacity:submitting ? 0.7 : 1 }}>{submitting ? 'Posting…' : 'Post Help Request'}</button>
        </div>
      </div>}

      <div style={{ padding:'16px 12px 88px', maxWidth:680, margin:'0 auto' }}>
        {loading ? <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading…</div> : requests.length === 0 ? <div style={{ textAlign:'center', padding:48, color:'var(--muted)' }}><div style={{ fontSize:50 }}>🤝</div><div style={{ fontWeight:900, color:'var(--text)', margin:'8px 0' }}>No help requests</div><div>{canCreateHelpRequest ? 'Post one using the button above.' : 'Check back soon.'}</div></div> : requests.map(req => {
          const currentVols = Array.isArray(req.volunteers_assigned) ? req.volunteers_assigned : [];
          const assignedToMe = user && currentVols.includes(user.id);
          const createdByMe = user && req.created_by === user.id;
          const needed = req.volunteers_needed || 2;
          const full = currentVols.length >= needed || req.status === 'closed';
          const uc = URGENCY_COLOR[req.urgency] || '#ff8c00';
          const canChat = isAdmin || createdByMe || assignedToMe;
          const canClaim = canRespondToHelpRequest && !createdByMe && !assignedToMe && req.status === 'open' && !full;
          return <div key={req.id} style={{ background:'#fff', borderRadius:20, marginBottom:14, overflow:'hidden', border:`2px solid ${req.urgency === 'urgent' ? '#ff174480' : uc + '40'}`, boxShadow:'var(--shadow)' }}>
            <div style={{ height:4, background:`linear-gradient(90deg,${uc},transparent)` }} />
            <div style={{ padding:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:10, marginBottom:8 }}><div style={{ flex:1 }}><h3 style={{ margin:'0 0 4px', fontSize:16, fontWeight:900 }}>{req.title}</h3><div style={{ fontSize:12, color:'var(--muted)' }}>📍 {req.city}{req.area ? ` · ${req.area}` : ''} · by {req.users?.full_name || 'User'}</div></div><span style={{ background:req.status === 'open' ? '#e8fff3' : '#ffe8e8', color:req.status === 'open' ? '#1b5e20' : '#c62828', borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:900, height:22 }}>{full ? 'fulfilled' : req.status}</span></div>
              {req.description && <p style={{ fontSize:13, lineHeight:1.6, color:'var(--text)', whiteSpace:'pre-wrap' }}>{req.description}</p>}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, borderTop:'1px solid var(--border)', paddingTop:12 }}><div style={{ fontSize:12, fontWeight:800, color:full ? '#1b5e20' : 'var(--muted)' }}>👥 {currentVols.length}/{needed} volunteers joined</div><div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>{canChat && <button onClick={() => openPrivateChat(req)} style={{ background:'#e8f5e9', border:'1.5px solid #a5d6a7', borderRadius:10, padding:'7px 12px', fontSize:12, fontWeight:900, cursor:'pointer', color:'#2e7d32' }}>Private Chat</button>}{canClaim && <button onClick={() => respond(req)} disabled={processingSlots.has(req.id)} style={{ background:'linear-gradient(135deg,#ff1744,#ff6d00)', color:'#fff', border:'none', borderRadius:10, padding:'7px 14px', fontSize:12, fontWeight:900, cursor:'pointer', opacity:processingSlots.has(req.id) ? 0.6 : 1 }}>Respond +100</button>}{!canClaim && canRespondToHelpRequest && !assignedToMe && full && <span style={{ fontSize:12, color:'var(--muted)', fontWeight:700 }}>Fulfilled</span>}</div></div>
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}
