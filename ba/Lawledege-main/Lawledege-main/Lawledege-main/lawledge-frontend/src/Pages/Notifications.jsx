import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';

function NIcon({ type }) {
  const icon = type === 'broadcast' ? '🔔' : type === 'like' ? '❤️' : type === 'comment' ? '💬' : type === 'follow' ? '👥' : type === 'help' ? '🆘' : '🔔';
  return <div style={{ width:44, height:44, borderRadius:14, background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>{icon}</div>;
}

export default function Notifications() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const items = [];
      const [{ data: myPosts }, { data: broadcasts }, { data: follows }, { data: volunteerProfile }] = await Promise.all([
        supabase.from('posts').select('id, content').eq('user_id', user.id),
        supabase.from('broadcast_notifications').select('*').in('target_role', ['all', role || 'user']).order('created_at', { ascending: false }).limit(50),
        supabase.from('follows').select('id, follower_id, created_at, users!follower_id(full_name)').eq('following_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('volunteer_profiles').select('location').eq('user_id', user.id).maybeSingle(),
      ]);

      (broadcasts || []).forEach(b => items.push({ id:`broadcast-${b.id}`, type:'broadcast', user:'Admin', text:`${b.title}: ${b.body}`, time:b.created_at }));

      const postIds = (myPosts || []).map(p => p.id);
      const postMap = Object.fromEntries((myPosts || []).map(p => [p.id, p.content?.slice(0, 50) || 'your post']));
      if (postIds.length) {
        const [likesRes, commentsRes] = await Promise.all([
          supabase.from('likes').select('*, users(id, full_name)').in('post_id', postIds).neq('user_id', user.id).order('created_at', { ascending:false }).limit(30),
          supabase.from('comments').select('*, users(id, full_name)').in('post_id', postIds).neq('user_id', user.id).order('created_at', { ascending:false }).limit(30),
        ]);
        (likesRes.data || []).forEach(l => items.push({ id:`like-${l.id}`, type:'like', user:l.users?.full_name || 'Someone', userId:l.user_id, text:`liked your post: "${postMap[l.post_id]}"`, time:l.created_at, postId:l.post_id }));
        (commentsRes.data || []).forEach(c => items.push({ id:`comment-${c.id}`, type:'comment', user:c.users?.full_name || 'Someone', userId:c.user_id, text:`commented: "${(c.content || '').slice(0, 60)}"`, time:c.created_at, postId:c.post_id }));
      }

      (follows || []).forEach(f => items.push({ id:`follow-${f.id}`, type:'follow', user:f.users?.full_name || 'Someone', userId:f.follower_id, text:'started following you', time:f.created_at }));

      if (role === 'volunteer' && volunteerProfile?.location) {
        const { data: help } = await supabase.from('help_requests').select('id,title,city,created_at').eq('city', volunteerProfile.location).eq('status', 'open').order('created_at', { ascending:false }).limit(10);
        (help || []).forEach(h => items.push({ id:`help-${h.id}`, type:'help', user:'Help Request', text:`New request near you: "${h.title}" in ${h.city}`, time:h.created_at, helpId:h.id }));
      }

      items.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
      setNotifs(items);
    } catch (err) {
      console.error('Notifications error:', err);
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchNotifs();
    const ch = supabase.channel(`notifications-${user.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'broadcast_notifications' }, fetchNotifs)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'likes' }, fetchNotifs)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'comments' }, fetchNotifs)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'follows' }, fetchNotifs)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchNotifs, navigate]);

  const ago = ts => {
    if (!ts) return 'Recently';
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  const handleTap = n => {
    if (n.type === 'help') navigate('/help');
    else if (n.type === 'follow' && n.userId) navigate(`/profile/${n.userId}`);
    else if (n.postId) navigate('/feed');
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ background:'#fff', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ height:3, background:'linear-gradient(90deg,#ff0080,#ff8c00,#ffd700,#00c851,#00bcd4,#7b2ff7)' }}/>
        <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:12, maxWidth:680, margin:'0 auto' }}><button onClick={() => navigate(-1)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, fontWeight:900 }}>←</button><h2 style={{ fontWeight:900, fontSize:20, color:'var(--text)', flex:1 }}>Notifications</h2>{notifs.length > 0 && <span style={{ background:'var(--primary)', color:'#fff', borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:800 }}>{notifs.length}</span>}</div>
      </div>
      <div style={{ padding:'12px 12px 80px', maxWidth:680, margin:'0 auto' }}>
        {loading ? <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading…</div> : notifs.length === 0 ? <div style={{ textAlign:'center', padding:48, color:'var(--muted)' }}><div style={{ fontSize:50 }}>🔔</div><div style={{ fontWeight:800, fontSize:16, color:'var(--text)', marginBottom:6 }}>No notifications yet</div></div> : notifs.map(n => <div key={n.id} onClick={() => handleTap(n)} style={{ background:'#fff', borderRadius:16, padding:'14px 16px', border:'1.5px solid var(--border)', marginBottom:10, display:'flex', alignItems:'center', gap:12, cursor:'pointer', boxShadow:'var(--shadow)' }}><NIcon type={n.type}/><div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:14, color:'var(--text)', lineHeight:1.5 }}><strong style={{ color:'var(--primary)' }}>{n.user}</strong> {n.text}</div><div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{ago(n.time)}</div></div><span style={{ color:'var(--border)' }}>›</span></div>)}
      </div>
    </div>
  );
}
