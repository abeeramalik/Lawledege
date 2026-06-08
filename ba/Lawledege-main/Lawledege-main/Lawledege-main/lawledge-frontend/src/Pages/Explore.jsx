import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';
import { directRoomFor, initials } from '../lib/roles';

const COMMUNITIES = [
  { id: 'c1', name: 'Human Rights Commission of Pakistan (HRCP)', city: 'National', members: 300000, url: 'https://www.facebook.com/HRCP87', category: 'Human Rights' },
  { id: 'c2', name: 'Aurat Foundation', city: 'National', members: 180000, url: 'https://www.facebook.com/AuratFoundationofficial/', category: "Women's Rights" },
  { id: 'c3', name: 'Society for the Protection of the Rights of the Child (SPARC)', city: 'National', members: 120000, url: 'https://www.facebook.com/SPARCPK', category: 'Child Rights' },
  { id: 'c4', name: 'Alkhidmat Foundation Pakistan', city: 'National', members: 900000, url: 'https://www.facebook.com/alkhidmat.org/', category: 'Welfare' },
  { id: 'c5', name: 'Akhuwat Foundation', city: 'National', members: 600000, url: 'https://www.facebook.com/AkhuwatOfficial', category: 'Financial Inclusion' },
  { id: 'c6', name: 'Digital Rights Foundation (DRF)', city: 'National', members: 8900, url: 'https://www.facebook.com/DigitalRightsFoundation', category: 'Cyber Rights' },
  { id: 'c7', name: 'Legal Aid Society Pakistan - LAS', city: 'National', members: 15200, url: 'https://www.facebook.com/LegalAidSocietyPakistan', category: 'Legal Aid' },
];

function Avatar({ name, src, size = 46 }) {
  return <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:'2px solid #7b2ff744', background:src?'#000':'#7b2ff718', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.34, fontWeight:900, color:'#7b2ff7' }}>{src ? <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : initials(name)}</div>;
}

export default function Explore() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('communities');
  const [search, setSearch] = useState('');
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(new Set());
  const [catFilter, setCatFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase.from('volunteer_profiles').select('*').order('points', { ascending: false }).limit(100);
      if (error) throw error;
      const ids = (profiles || []).map(v => v.user_id).filter(Boolean);
      const { data: users } = ids.length ? await supabase.from('users').select('id, full_name, profile_pic, city, status, role, is_volunteer, email').in('id', ids) : { data: [] };
      const userMap = new Map((users || []).map(u => [u.id, u]));
      setVolunteers((profiles || []).map(v => ({ ...v, users: userMap.get(v.user_id) })).filter(v => v.users?.status !== 'blocked' && (v.users?.role === 'volunteer' || v.users?.is_volunteer)));

      if (user) {
        const { data: fData } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
        setFollowing(new Set((fData || []).map(f => f.following_id)));
      }
    } catch (e) {
      console.error('Volunteer search load error:', e);
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVolunteers(); }, [user]);

  const handleFollow = async (e, targetId) => {
    e.stopPropagation();
    if (!user) return navigate('/login');
    const isFollowing = following.has(targetId);
    setFollowing(p => { const n = new Set(p); isFollowing ? n.delete(targetId) : n.add(targetId); return n; });
    if (isFollowing) await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
    else await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
  };

  const openMessage = (e, v) => {
    e.stopPropagation();
    if (!user) return navigate('/login');
    if (v.user_id === user.id) return navigate('/profile');
    const name = v.users?.full_name || 'Volunteer';
    navigate(`/messages?room=${directRoomFor(user.id, v.user_id)}&to=${v.user_id}&name=${encodeURIComponent(name)}`);
  };

  const filteredCommunities = COMMUNITIES.filter(c => (!search || c.name.toLowerCase().includes(search.toLowerCase())) && (catFilter === 'All' || c.category === catFilter));
  const filteredVolunteers = volunteers.filter(v => {
    const name = v.users?.full_name || '';
    const skills = Array.isArray(v.skills) ? v.skills : [];
    if (search && !`${name} ${skills.join(' ')} ${v.location || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (cityFilter && v.location !== cityFilter && v.users?.city !== cityFilter) return false;
    if (skillFilter && !skills.includes(skillFilter)) return false;
    return true;
  });

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ background:'linear-gradient(135deg,#7b2ff7,#ff0080)', padding:'48px 20px 24px', textAlign:'center' }}>
        <h1 style={{ color:'#fff', fontSize:24, fontWeight:800, marginBottom:8, fontFamily:"'Playfair Display',serif" }}>Explore Hub</h1>
        <p style={{ color:'#ffffffcc', fontSize:13, marginBottom:20 }}>Find communities and search volunteers.</p>
        <div style={{ position:'relative', maxWidth:400, margin:'0 auto' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab}...`} style={{ width:'100%', border:'none', borderRadius:24, padding:'12px 20px', fontSize:14, background:'#fff', boxShadow:'0 4px 14px rgba(0,0,0,0.1)', fontFamily:'Poppins,sans-serif', boxSizing:'border-box', outline:'none' }} />
        </div>
      </div>

      <div style={{ background:'#fff', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'center', position:'sticky', top:0, zIndex:10 }}>
        {['communities', 'volunteers'].map(t => <button key={t} onClick={() => setTab(t)} style={{ flex:1, maxWidth:240, padding:'14px', border:'none', background:'none', color:tab === t ? 'var(--primary)' : 'var(--muted)', fontWeight:800, fontSize:14, cursor:'pointer', borderBottom:`3px solid ${tab === t ? 'var(--primary)' : 'transparent'}`, textTransform:'capitalize' }}>{t}</button>)}
      </div>

      <div style={{ padding:'16px 12px 88px', maxWidth:680, margin:'0 auto' }}>
        {tab === 'communities' && <>
          <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:16, paddingBottom:4 }}>{['All', 'Human Rights', "Women's Rights", 'Child Rights', 'Welfare', 'Financial Inclusion', 'Legal Aid', 'Cyber Rights'].map(cat => <button key={cat} onClick={() => setCatFilter(cat)} style={{ padding:'6px 14px', borderRadius:20, whiteSpace:'nowrap', border:`1.5px solid ${catFilter === cat ? '#7b2ff7' : 'var(--border)'}`, background:catFilter === cat ? '#7b2ff7' : '#fff', color:catFilter === cat ? '#fff' : 'var(--muted)', fontSize:12, fontWeight:800, cursor:'pointer' }}>{cat}</button>)}</div>
          {filteredCommunities.map(c => <div key={c.id} style={{ background:'#fff', borderRadius:16, border:'1.5px solid var(--border)', marginBottom:12, padding:16, display:'flex', alignItems:'center', gap:14, boxShadow:'var(--shadow)', cursor:'pointer' }} onClick={() => window.open(c.url, '_blank')}>
            <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#7b2ff7,#ff0080)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, flexShrink:0, fontWeight:900 }}>{c.name.charAt(0)}</div>
            <div style={{ flex:1, minWidth:0 }}><h3 style={{ fontWeight:900, fontSize:15, color:'var(--text)', margin:'0 0 4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</h3><div style={{ fontSize:12, color:'var(--muted)', display:'flex', gap:8, flexWrap:'wrap' }}><span>📍 {c.city}</span><span>👥 {c.members.toLocaleString()}</span><span>{c.category}</span></div></div>
            <button onClick={(e) => { e.stopPropagation(); window.open(c.url, '_blank'); }} style={{ background:'#e0f7fa', color:'#00bcd4', border:'none', borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:900, cursor:'pointer' }}>Visit</button>
          </div>)}
        </>}

        {tab === 'volunteers' && <>
          <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:16, paddingBottom:4 }}>
            <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={{ padding:'7px 12px', borderRadius:18, border:'1.5px solid var(--border)', background:'#fff', fontWeight:700 }}><option value="">All Cities</option>{['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Multan', 'Faisalabad', 'Peshawar', 'Quetta'].map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)} style={{ padding:'7px 12px', borderRadius:18, border:'1.5px solid var(--border)', background:'#fff', fontWeight:700 }}><option value="">All Skills</option>{['Legal Awareness', 'First Aid', 'Cyber Security', 'FIR Filing', 'Court Support', "Women's Rights", 'Mental Health', 'Document Drafting'].map(s => <option key={s} value={s}>{s}</option>)}</select>
            <button onClick={fetchVolunteers} style={{ border:'none', background:'var(--primary-light)', color:'var(--primary)', borderRadius:18, padding:'7px 12px', fontWeight:800, cursor:'pointer' }}>Refresh</button>
          </div>

          {loading && <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading volunteers…</div>}
          {!loading && filteredVolunteers.length === 0 && <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>No volunteers found. Make sure volunteer users are registered and the SQL setup was run.</div>}
          {filteredVolunteers.map(v => {
            const name = v.users?.full_name || 'Volunteer';
            const skills = Array.isArray(v.skills) ? v.skills : [];
            return <div key={v.user_id} onClick={() => navigate(`/profile/${v.user_id}`)} style={{ background:'#fff', borderRadius:16, border:'1.5px solid var(--border)', marginBottom:12, padding:16, display:'flex', alignItems:'center', gap:14, boxShadow:'var(--shadow)', cursor:'pointer' }}>
              <Avatar name={name} src={v.users?.profile_pic} />
              <div style={{ flex:1, minWidth:0 }}><div style={{ display:'flex', alignItems:'center', gap:6 }}><h3 style={{ fontWeight:900, fontSize:15, margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</h3>{v.verified && <span style={{ color:'#1d9bf0' }}>✓</span>}</div><div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>{v.level || 'Newbie'} • {v.points || 0} pts {v.location ? `• ${v.location}` : ''}</div><div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>{skills.slice(0, 3).map(s => <span key={s} style={{ background:'var(--bg)', color:'var(--muted)', padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>{s}</span>)}</div></div>
              {user?.id !== v.user_id && <div style={{ display:'flex', gap:6, flexDirection:'column' }}><button onClick={(e) => openMessage(e, v)} style={{ background:'linear-gradient(135deg,#7b2ff7,#ff0080)', color:'#fff', border:'none', borderRadius:18, padding:'7px 12px', fontSize:12, fontWeight:900, cursor:'pointer' }}>Message</button><button onClick={(e) => handleFollow(e, v.user_id)} style={{ background:following.has(v.user_id) ? 'var(--bg)' : '#fff', color:'var(--muted)', border:'1.5px solid var(--border)', borderRadius:18, padding:'6px 12px', fontSize:11, fontWeight:800, cursor:'pointer' }}>{following.has(v.user_id) ? 'Following' : 'Follow'}</button></div>}
            </div>;
          })}
        </>}
      </div>
    </div>
  );
}
