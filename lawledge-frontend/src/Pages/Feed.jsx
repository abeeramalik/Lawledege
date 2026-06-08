import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';
import PostCard from '../Components/PostCard';
import { initials } from '../lib/roles';

function Spinner() {
  return <div style={{ display:'flex', justifyContent:'center', padding:32 }}><div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #ede9f8', borderTopColor:'#7b2ff7', animation:'spin 0.7s linear infinite' }} /><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>;
}

async function loadProfiles(userIds = []) {
  if (!userIds.length) return new Map();

  let result = await supabase
    .from('public_profiles')
    .select('id, full_name, profile_pic, city, role, status')
    .in('id', userIds);

  if (result.error) {
    result = await supabase
      .from('users')
      .select('id, full_name, profile_pic, city, role, status')
      .in('id', userIds);
  }

  return new Map((result.data || []).map(u => [u.id, u]));
}

async function hydratePosts(rows, currentUserId) {
  const posts = rows || [];
  if (!posts.length) return [];
  const postIds = posts.map(p => p.id).filter(Boolean);
  const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))];

  const [userMap, { data: likes }, { data: comments }] = await Promise.all([
    loadProfiles(userIds),
    postIds.length ? supabase.from('likes').select('post_id, user_id').in('post_id', postIds) : { data: [] },
    postIds.length ? supabase.from('comments').select('post_id').in('post_id', postIds) : { data: [] },
  ]);

  const likeCounts = new Map();
  const userLiked = new Set();
  (likes || []).forEach(l => {
    likeCounts.set(l.post_id, (likeCounts.get(l.post_id) || 0) + 1);
    if (l.user_id === currentUserId) userLiked.add(l.post_id);
  });
  const commentCounts = new Map();
  (comments || []).forEach(c => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) || 0) + 1));

  return posts.map(p => ({
    ...p,
    users: userMap.get(p.user_id) || null,
    author_name: userMap.get(p.user_id)?.full_name || 'Lawledge User',
    like_count: likeCounts.get(p.id) || 0,
    comment_count: commentCounts.get(p.id) || 0,
    user_liked: userLiked.has(p.id),
  }));
}

export default function Feed() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const isGuest = !user;
  const authorName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest';

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data, error } = await supabase.from('posts')
        .select('*')
        .eq('is_draft', false)
        .eq('is_story', false)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setPosts(await hydratePosts(data || [], user?.id));
    } catch (e) {
      console.error('Feed load error:', e);
      setPosts([]);
      setLoadError(isGuest ? 'Guest feed is not enabled in Supabase yet. Run the v5 public guest SQL, then refresh.' : e.message || 'Unable to load feed.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isGuest]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const channel = supabase.channel('feed-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const requireLogin = () => navigate('/login');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#ff0080,#ff8c00,#ffd700,#00c851,#00bcd4,#7b2ff7)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', maxWidth: 680, margin: '0 auto' }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 22, background: 'linear-gradient(90deg,#7b2ff7,#ff0080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lawledge</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isAdmin && <button onClick={() => navigate('/admin')} style={{ background:'#1a0a2e', color:'#fff', border:'none', borderRadius:14, padding:'8px 12px', fontWeight:800, cursor:'pointer', fontSize:12 }}>Admin</button>}
            <button onClick={() => navigate('/reels')} style={{ background:'var(--primary-light)', color:'var(--primary)', border:'none', borderRadius:14, padding:'8px 12px', fontWeight:800, cursor:'pointer', fontSize:12 }}>Reels</button>
            {user ? (
              <>
                <button onClick={() => navigate('/notifications')} style={{ background:'none', border:'none', cursor:'pointer', padding:6 }} title="Notifications">🔔</button>
                <button onClick={() => navigate('/messages')} style={{ background:'none', border:'none', cursor:'pointer', padding:6 }} title="Messages">💬</button>
                <button onClick={() => navigate('/profile')} style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#7b2ff7,#ff0080)', border:'none', color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer' }}>{initials(authorName, user?.email?.[0]?.toUpperCase() || '?')}</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} style={{ background:'#fff', color:'var(--primary)', border:'1.5px solid var(--border)', borderRadius:14, padding:'8px 12px', fontWeight:800, cursor:'pointer', fontSize:12 }}>Login</button>
                <button onClick={() => navigate('/register')} style={{ background:'linear-gradient(135deg,#7b2ff7,#ff0080)', color:'#fff', border:'none', borderRadius:14, padding:'8px 12px', fontWeight:800, cursor:'pointer', fontSize:12 }}>Join</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px 88px', maxWidth: 680, margin: '0 auto' }}>
        <div onClick={user ? () => navigate('/create') : requireLogin} style={{ background: '#fff', borderRadius: 16, padding: '12px 14px', border: '1.5px solid var(--border)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#7b2ff7,#ff0080)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>{initials(authorName)}</div>
          <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 20, padding: '10px 16px', fontSize: 13, color: 'var(--muted)' }}>{user ? "What's on your mind?" : 'Login to create posts, reels, and help requests'}</div>
          <span style={{ fontWeight:900, color:'var(--primary)' }}>＋</span>
        </div>

        {loadError && <div style={{ background:'#ffe8e8', color:'#c62828', borderRadius:14, padding:'12px 14px', marginBottom:14, fontSize:13, lineHeight:1.5 }}>{loadError}</div>}

        {loading ? <Spinner /> : posts.length === 0 ? (
          <div style={{ textAlign:'center', padding:48, color:'var(--muted)' }}>
            <div style={{ fontSize:48, marginBottom:10 }}>📝</div>
            <div style={{ fontWeight:800, color:'var(--text)', marginBottom:6 }}>No feed posts yet</div>
            <div style={{ fontSize:13 }}>Create a normal feed post. Reels/Stories appear in the Reels section only.</div>
          </div>
        ) : posts.map(post => <PostCard key={post.id} post={post} onChanged={fetchPosts} />)}
      </div>
    </div>
  );
}
