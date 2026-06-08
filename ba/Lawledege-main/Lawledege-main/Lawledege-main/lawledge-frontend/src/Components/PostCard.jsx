import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';
import { directRoomFor, initials } from '../lib/roles';
import { LIMITS, validateTextLength } from '../lib/validators';
import { formatDateTime } from '../lib/time';
import { getLinkLabel, getYouTubeEmbedUrl, isDirectImageUrl, isDirectVideoUrl, isKnownSocialUrl } from '../lib/media';

const TYPE_STYLE = {
  'Success Story': { bg:'#e8fff3', color:'#1b5e20' },
  Awareness: { bg:'#e3f2fd', color:'#0d47a1' },
  'Activity Update': { bg:'#fffde7', color:'#e65100' },
  Gratitude: { bg:'#fce4ec', color:'#880e4f' },
  'Reel/Story': { bg:'#ede7f6', color:'#4527a0' },
};

function Avatar({ name, src, size=42 }) {
  const c = '#7b2ff7';
  return <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:`2px solid ${c}44`, background:src?'#000':`${c}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.34, fontWeight:800, color:c }}>
    {src ? <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : initials(name)}
  </div>;
}

function MediaBlock({ url }) {
  const [fallback, setFallback] = useState('');
  if (!url) return null;
  const isVideo = isDirectVideoUrl(url);
  const isImage = isDirectImageUrl(url);
  const youtube = getYouTubeEmbedUrl(url);
  const knownSocial = isKnownSocialUrl(url);
  const showLink = fallback === 'link' || (!isVideo && !isImage && !youtube && knownSocial);

  if (isVideo && fallback !== 'link') {
    return <div style={{ borderRadius:16, overflow:'hidden', background:'#000', marginTop:10, maxHeight:520, display:'flex', justifyContent:'center' }}>
      <video src={url} controls onError={() => setFallback('link')} style={{ width:'100%', maxHeight:520, objectFit:'contain' }} />
    </div>;
  }

  if ((isImage || (!knownSocial && !youtube && fallback !== 'link')) && fallback !== 'video') {
    return <div style={{ borderRadius:16, overflow:'hidden', background:'#000', marginTop:10, maxHeight:520, display:'flex', justifyContent:'center' }}>
      <img src={url} alt="Post media" onError={() => setFallback('link')} style={{ width:'100%', maxHeight:520, objectFit:'contain' }} />
    </div>;
  }

  if (youtube && fallback !== 'link') {
    return <div style={{ borderRadius:16, overflow:'hidden', background:'#000', marginTop:10, height:360 }}>
      <iframe title="Attached YouTube video" src={youtube} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ width:'100%', height:'100%', border:0 }} />
    </div>;
  }

  if (showLink) {
    return <div style={{ borderRadius:16, overflow:'hidden', marginTop:10 }}>
      <button onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} style={{ width:'100%', minHeight:120, background:'linear-gradient(135deg,#1a0a2e,#7b2ff7)', color:'#fff', border:'none', cursor:'pointer', fontWeight:900, fontSize:15 }}>Open {getLinkLabel(url)} ↗</button>
    </div>;
  }

  return null;
}

async function loadProfiles(userIds = []) {
  if (!userIds.length) return new Map();
  let result = await supabase
    .from('public_profiles')
    .select('id, full_name, profile_pic')
    .in('id', userIds);

  if (result.error) {
    result = await supabase
      .from('users')
      .select('id, full_name, profile_pic')
      .in('id', userIds);
  }

  return new Map((result.data || []).map(u => [u.id, u]));
}

export default function PostCard({ post, onChanged }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(Boolean(post.user_liked));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [busy, setBusy] = useState(false);

  const authorName = post.users?.full_name || post.author_name || 'Lawledge User';
  const style = TYPE_STYLE[post.type] || TYPE_STYLE.Awareness;
  const mediaUrl = post.media_url;

  useEffect(() => {
    setLiked(Boolean(post.user_liked));
    setLikeCount(post.like_count || 0);
    setCommentCount(post.comment_count || 0);
  }, [post]);

  const loadComments = async () => {
    if (!post.id) return;
    setCommentError('');
    const { data, error } = await supabase.from('comments')
      .select('id, user_id, post_id, content, created_at')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (error) {
      setComments([]);
      setCommentError(`Comments could not load: ${error.message}`);
      return;
    }

    const userIds = [...new Set((data || []).map(c => c.user_id).filter(Boolean))];
    const profiles = await loadProfiles(userIds);
    setComments((data || []).map(c => ({ ...c, users: profiles.get(c.user_id) || null })));
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next) await loadComments();
  };

  const toggleLike = async () => {
    if (!user) return navigate('/login');
    if (busy) return;
    setBusy(true);
    try {
      if (liked) {
        const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', post.id);
        if (error) throw error;
        setLiked(false);
        setLikeCount(c => Math.max(0, c - 1));
      } else {
        const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
        if (error) throw error;
        await supabase.from('activity_logs').insert({ user_id: user.id, action: `post_liked_${post.id}` });
        setLiked(true);
        setLikeCount(c => c + 1);
      }
    } catch (e) {
      alert(e.message || 'Unable to update like.');
    } finally {
      setBusy(false);
      onChanged?.();
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    const commentErrorText = validateTextLength(commentText, { required: true, max: LIMITS.commentMax, label: 'Comment' });
    if (commentErrorText) { setCommentError(commentErrorText); return; }
    const text = commentText.trim();
    setCommentText('');
    setCommentError('');

    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: user.id, post_id: post.id, content: text, created_at: new Date().toISOString() })
      .select('id, user_id, post_id, content, created_at')
      .single();

    if (error) {
      setCommentText(text);
      setCommentError(`Comment not posted: ${error.message}`);
      return;
    }

    await supabase.from('activity_logs').insert({ user_id: user.id, action: `comment_created_${data.id}` });
    const profiles = await loadProfiles([user.id]);
    const newComment = { ...data, users: profiles.get(user.id) || { full_name: user.email?.split('@')[0] || 'You' } };
    setComments(p => [...p, newComment]);
    setCommentCount(c => c + 1);
    onChanged?.();
  };

  const openMessage = () => {
    if (!user) return navigate('/login');
    if (!post.user_id || post.user_id === user.id) return navigate('/messages');
    navigate(`/messages?room=${directRoomFor(user.id, post.user_id)}&to=${post.user_id}&name=${encodeURIComponent(authorName)}`);
  };

  const openProfile = () => {
    if (!post.user_id) return;
    if (!user) return navigate('/login');
    navigate(`/profile/${post.user_id}`);
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/feed?post=${post.id}`;
    const text = post.content || 'Lawledge post';
    try {
      if (navigator.share) await navigator.share({ title: 'Lawledge Post', text, url });
      else {
        await navigator.clipboard?.writeText(`${text}\n${url}`);
        alert('Post link copied.');
      }
    } catch {
      // user cancelled native share
    }
  };

  return (
    <article style={{ background:'#fff', borderRadius:20, border:'1.5px solid var(--border)', marginBottom:14, overflow:'hidden', boxShadow:'var(--shadow)' }}>
      <div style={{ padding:'14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <button onClick={openProfile} style={{ border:'none', background:'none', padding:0, cursor:'pointer' }}><Avatar name={authorName} src={post.users?.profile_pic} /></button>
          <div style={{ flex:1, minWidth:0 }}>
            <div onClick={openProfile} style={{ fontWeight:800, fontSize:14, cursor:'pointer', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{authorName}</div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>{post.location || 'Pakistan'} · {formatDateTime(post.created_at)}</div>
          </div>
          <span style={{ background:style.bg, color:style.color, padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:800 }}>{post.type || 'Post'}</span>
        </div>

        {post.content && <p style={{ fontSize:14, lineHeight:1.75, color:'var(--text)', whiteSpace:'pre-wrap' }}>{post.content}</p>}

        <MediaBlock url={mediaUrl} />

        <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:12, borderTop:'1px solid var(--border)', paddingTop:10 }}>
          <button onClick={toggleLike} style={{ background:'none', border:'none', color:liked?'#ff0080':'var(--muted)', cursor:'pointer', fontWeight:800 }}>❤️ {likeCount}</button>
          <button onClick={toggleComments} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontWeight:800 }}>💬 {commentCount}</button>
          <button onClick={sharePost} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontWeight:800 }}>↗ Share</button>
          {post.user_id !== user?.id && <button onClick={openMessage} style={{ marginLeft:'auto', background:'var(--primary-light)', color:'var(--primary)', border:'none', borderRadius:18, padding:'7px 12px', cursor:'pointer', fontWeight:800, fontSize:12 }}>Message</button>}
        </div>

        {showComments && <div style={{ marginTop:12, background:'var(--bg)', borderRadius:16, padding:12 }}>
          {commentError && <div style={{ background:'#ffe8e8', color:'#c62828', borderRadius:12, padding:'9px 10px', fontSize:12, marginBottom:10 }}>{commentError}</div>}
          {comments.length === 0 && !commentError && <div style={{ color:'var(--muted)', fontSize:12, marginBottom:10 }}>No comments yet.</div>}
          {comments.map(c => <div key={c.id} style={{ display:'flex', gap:8, marginBottom:10 }}>
            <Avatar name={c.users?.full_name} src={c.users?.profile_pic} size={28} />
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, padding:'7px 10px', flex:1 }}>
              <div style={{ fontSize:11, fontWeight:800 }}>{c.users?.full_name || 'User'} <span style={{ color:'var(--muted)', fontWeight:600 }}>· {formatDateTime(c.created_at)}</span></div>
              <div style={{ fontSize:13, lineHeight:1.5 }}>{c.content}</div>
            </div>
          </div>)}
          {user ? (
            <form onSubmit={submitComment} style={{ display:'flex', gap:8 }}>
              <input value={commentText} onChange={e => setCommentText(e.target.value.slice(0, LIMITS.commentMax))} maxLength={LIMITS.commentMax} placeholder="Write a comment..." style={{ flex:1, border:'1.5px solid var(--border)', borderRadius:18, padding:'10px 12px', fontFamily:'Poppins,sans-serif' }} />
              <button disabled={!commentText.trim()} style={{ border:'none', borderRadius:18, padding:'0 14px', background:'linear-gradient(135deg,#7b2ff7,#ff0080)', color:'#fff', fontWeight:800 }}>Send</button>
            </form>
          ) : (
            <button onClick={() => navigate('/login')} style={{ border:'none', borderRadius:18, padding:'10px 14px', background:'linear-gradient(135deg,#7b2ff7,#ff0080)', color:'#fff', fontWeight:800, width:'100%', cursor:'pointer' }}>Login to comment</button>
          )}
        </div>}
      </div>
    </article>
  );
}
