import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';
import { getLinkLabel, getYouTubeEmbedUrl, isDirectImageUrl, isDirectVideoUrl, isKnownSocialUrl } from '../lib/media';
import { formatDateTime } from '../lib/time';

const gradients = ['linear-gradient(160deg,#7b2ff7,#ff0080)', 'linear-gradient(160deg,#00c851,#00bcd4)', 'linear-gradient(160deg,#ff8c00,#ffd700)', 'linear-gradient(160deg,#ff0080,#ff8c00)', 'linear-gradient(160deg,#e040fb,#7b2ff7)'];


async function loadProfiles(userIds = []) {
  if (!userIds.length) return new Map();
  let result = await supabase
    .from('public_profiles')
    .select('id, full_name, profile_pic, city')
    .in('id', userIds);

  if (result.error) {
    result = await supabase
      .from('users')
      .select('id, full_name, profile_pic, city')
      .in('id', userIds);
  }

  return new Map((result.data || []).map(u => [u.id, u]));
}

export default function Reels() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState([]);
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState(new Set());
  const [saved, setSaved] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const touchY = useRef(0);
  const scrollLock = useRef(false);

  const fetchReels = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('posts')
        .select('*')
        .eq('is_story', true)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;

      const rows = data || [];
      const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
      const postIds = rows.map(r => r.id);
      const [userMap, { data: likes }, { data: saves }] = await Promise.all([
        loadProfiles(userIds),
        postIds.length ? supabase.from('likes').select('post_id,user_id').in('post_id', postIds) : { data: [] },
        user && postIds.length ? supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds) : { data: [] },
      ]);
      const likeCounts = new Map();
      const myLiked = new Set();
      (likes || []).forEach(l => { likeCounts.set(l.post_id, (likeCounts.get(l.post_id) || 0) + 1); if (l.user_id === user?.id) myLiked.add(l.post_id); });
      setLiked(myLiked);
      setSaved(new Set((saves || []).map(s => s.post_id)));
      setReels(rows.map((r, i) => ({ ...r, users: userMap.get(r.user_id), gradient: gradients[i % gradients.length], likes: likeCounts.get(r.id) || 0 })));
      setIdx(0);
    } catch (err) {
      console.error('Reels load error:', err);
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchReels(); }, [fetchReels]);
  useEffect(() => { if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; videoRef.current.load(); } }, [idx]);

  const goNext = () => setIdx(i => Math.min(i + 1, reels.length - 1));
  const goPrev = () => setIdx(i => Math.max(i - 1, 0));
  const onTouchStart = e => { touchY.current = e.touches[0].clientY; };
  const onTouchEnd = e => { const diff = touchY.current - e.changedTouches[0].clientY; if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev(); };
  const onWheel = e => { e.preventDefault(); if (scrollLock.current) return; scrollLock.current = true; e.deltaY > 0 ? goNext() : goPrev(); setTimeout(() => { scrollLock.current = false; }, 600); };

  const toggleLike = async (id) => {
    if (!user) return navigate('/login');
    const isLiked = liked.has(id);
    setLiked(prev => { const s = new Set(prev); isLiked ? s.delete(id) : s.add(id); return s; });
    setReels(prev => prev.map(r => r.id === id ? { ...r, likes: Math.max(0, (r.likes || 0) + (isLiked ? -1 : 1)) } : r));
    if (isLiked) await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', id);
    else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: id });
      await supabase.from('activity_logs').insert({ user_id: user.id, action: `reel_liked_${id}` });
    }
  };

  const toggleSave = async (id) => {
    if (!user) return navigate('/login');
    const isSaved = saved.has(id);
    setSaved(prev => { const s = new Set(prev); isSaved ? s.delete(id) : s.add(id); return s; });
    if (isSaved) await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', id);
    else await supabase.from('saved_posts').insert({ user_id: user.id, post_id: id });
  };

  const shareReel = (r) => {
    if (!r) return;
    const url = `${window.location.origin}/reels`;
    if (navigator.share) navigator.share({ title: 'Lawledge Reel', text: r.content, url }).catch(() => {});
    else navigator.clipboard?.writeText(`${r.content}\n${url}`);
  };

  if (loading) return <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1a0a2e', color:'#fff' }}>Loading reels…</div>;
  if (!reels.length) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1a0a2e', flexDirection:'column', gap:16, color:'#ffffffaa' }}>
      <div style={{ fontSize: 56 }}>🎬</div>
      <div style={{ fontSize: 16, fontWeight: 800 }}>No reels/stories yet</div>
      <button onClick={() => navigate(user ? '/create' : '/login')} style={{ background:'linear-gradient(135deg,#7b2ff7,#ff0080)', color:'#fff', border:'none', borderRadius:14, padding:'11px 24px', fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontSize:14 }}>{user ? 'Create First Reel' : 'Login to Create Reels'}</button>
      <button onClick={() => navigate('/feed')} style={{ background:'transparent', color:'#fff', border:'1px solid #ffffff44', borderRadius:14, padding:'9px 20px', fontWeight:700, cursor:'pointer' }}>Back to Feed</button>
    </div>
  );

  const reel = reels[idx];
  const mediaUrl = reel?.media_url;
  const isVid = mediaUrl && isDirectVideoUrl(mediaUrl);
  const isImg = mediaUrl && isDirectImageUrl(mediaUrl);
  const youtubeEmbedUrl = mediaUrl ? getYouTubeEmbedUrl(mediaUrl) : '';
  const isExternalLink = !!mediaUrl && !isVid && !isImg;
  const shouldTryImage = !!mediaUrl && !isVid && !youtubeEmbedUrl && !isKnownSocialUrl(mediaUrl);
  const isLiked = liked.has(reel?.id);
  const isSaved = saved.has(reel?.id);

  return (
    <div style={{ height:'100vh', background:'#000', position:'relative', overflow:'hidden', userSelect:'none' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onWheel={onWheel}>
      <div style={{ position:'absolute', inset:0, background: reel?.gradient || '#000' }} />
      {mediaUrl && <div style={{ position:'absolute', inset:0 }}>
        {isVid ? (
          <video ref={videoRef} src={mediaUrl} autoPlay loop muted playsInline controls style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : isImg ? (
          <img src={mediaUrl} alt="Reel" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : shouldTryImage ? (
          <img src={mediaUrl} alt="Reel" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : youtubeEmbedUrl ? (
          <iframe title="YouTube reel" src={youtubeEmbedUrl} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ width:'100%', height:'100%', border:0, background:'#000' }} />
        ) : (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center', color:'#fff' }}>
            <div style={{ background:'#0008', border:'1px solid #ffffff33', borderRadius:24, padding:'28px 22px', maxWidth:360, boxShadow:'0 20px 70px #0008' }}>
              <div style={{ fontSize:54, marginBottom:10 }}>🔗</div>
              <div style={{ fontSize:18, fontWeight:900, marginBottom:8 }}>{getLinkLabel(mediaUrl)}</div>
              <div style={{ fontSize:12, lineHeight:1.6, color:'#ffffffcc', wordBreak:'break-all', marginBottom:16 }}>{mediaUrl}</div>
              <button onClick={() => window.open(mediaUrl, '_blank', 'noopener,noreferrer')} style={{ border:'none', borderRadius:14, padding:'11px 20px', background:'linear-gradient(135deg,#ff8c00,#ff0080)', color:'#fff', fontWeight:900, cursor:'pointer' }}>Open Reel Link</button>
            </div>
          </div>
        )}
      </div>}

      <button onClick={() => navigate('/feed')} style={{ position:'absolute', top:18, left:16, zIndex:5, background:'#0008', color:'#fff', border:'1px solid #ffffff33', borderRadius:12, padding:'8px 12px', fontWeight:800, cursor:'pointer' }}>← Feed</button>
      <div style={{ position:'absolute', top:18, right:16, zIndex:5, display:'flex', alignItems:'center', gap:8 }}>
        {!user && <button onClick={() => navigate('/login')} style={{ color:'#fff', fontWeight:800, background:'#0008', border:'1px solid #ffffff33', borderRadius:12, padding:'7px 11px', fontSize:12, cursor:'pointer' }}>Login</button>}
        <div style={{ color:'#fff', fontWeight:800, background:'#0008', borderRadius:12, padding:'7px 11px', fontSize:12 }}>{idx + 1}/{reels.length}</div>
      </div>

      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'80px 20px 24px', background:'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.3), transparent)', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:20 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div onClick={() => reel?.user_id && navigate(user ? `/profile/${reel.user_id}` : '/login')} style={{ fontWeight:800, fontSize:16, marginBottom:10, cursor:'pointer' }}>@{reel?.users?.full_name || 'Lawledge User'}</div>
          <p style={{ fontSize:14, lineHeight:1.5, margin:0, whiteSpace:'pre-wrap' }}>{reel?.content}</p>
          <div style={{ fontSize:11, color:'#ffffffbb', marginTop:8 }}>{formatDateTime(reel?.created_at)}</div>
          {isExternalLink && (
            <button onClick={() => window.open(mediaUrl, '_blank', 'noopener,noreferrer')} style={{ marginTop:12, border:'1px solid #ffffff55', borderRadius:14, padding:'9px 14px', background:'#ffffff22', color:'#fff', fontWeight:900, cursor:'pointer' }}>
              Open {getLinkLabel(mediaUrl)} ↗
            </button>
          )}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'center' }}>
          <button onClick={() => toggleLike(reel.id)} style={{ background:'none', border:'none', cursor:'pointer', color:isLiked?'#ff0080':'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}><span style={{ fontSize:28 }}>♥</span><span style={{ fontSize:12, color:'#fff' }}>{reel.likes || 0}</span><span style={{ fontSize:10, color:'#fff' }}>Like</span></button>
          <button onClick={() => toggleSave(reel.id)} style={{ background:'none', border:'none', cursor:'pointer', color:isSaved?'#ffd700':'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}><span style={{ fontSize:26 }}>🔖</span><span style={{ fontSize:10, color:'#fff' }}>Save</span></button>
          <button onClick={() => shareReel(reel)} style={{ background:'none', border:'none', cursor:'pointer', color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}><span style={{ fontSize:26 }}>↗</span><span style={{ fontSize:10, color:'#fff' }}>Share</span></button>
          {idx < reels.length - 1 && <button onClick={goNext} style={{ background:'#fff2', color:'#fff', border:'none', borderRadius:'50%', width:38, height:38, cursor:'pointer' }}>↓</button>}
          {idx > 0 && <button onClick={goPrev} style={{ background:'#fff2', color:'#fff', border:'none', borderRadius:'50%', width:38, height:38, cursor:'pointer' }}>↑</button>}
        </div>
      </div>
    </div>
  );
}
