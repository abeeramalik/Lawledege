import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';
import { directRoomFor } from '../lib/roles';
import { LIMITS, validateProfileEdit, validateUrl } from '../lib/validators';

const SKILLS_ALL = ['Legal Awareness', 'First Aid', 'Cyber Security', 'FIR Filing', 'Court Support', "Women's Rights", 'Mental Health', 'Document Drafting'];
const BADGES_INFO = [
  { id: 'fir', icon: '⚖️', label: 'FIR Warrior', desc: '10+ FIRs filed', color: '#ff1744', bg: '#ffe8e8' },
  { id: '100h', icon: '🏆', label: '100 Hours Hero', desc: '100 hours contributed', color: '#ff8c00', bg: '#fff3e0' },
  { id: 'women', icon: '🛡️', label: 'Women Guardian', desc: '50 women helped', color: '#e040fb', bg: '#fce4ec' },
  { id: 'legend', icon: '👑', label: 'Legend', desc: '500+ hours', color: '#ffd700', bg: '#fffde7' },
  { id: 'impact', icon: '⭐', label: 'Impact Maker', desc: '1000 people reached', color: '#00bcd4', bg: '#e0f7fa' },
  { id: 'awareness', icon: '📚', label: 'Awareness Guru', desc: '30 sessions done', color: '#00c851', bg: '#e8f5e9' },
];
const LEVEL_COLORS = { Newbie: '#78909c', Active: '#43a047', Leader: '#ff8c00', Legend: '#7b2ff7' };

function getVolunteerLevel(points = 0) {
  const p = Number(points) || 0;
  if (p >= 1000) return 'Legend';
  if (p >= 500) return 'Leader';
  if (p >= 100) return 'Active';
  return 'Newbie';
}

function getNextLevel(level) {
  return { Newbie: 'Active', Active: 'Leader', Leader: 'Legend', Legend: 'Legend' }[level] || 'Active';
}

function getNextThreshold(level) {
  return { Newbie: 100, Active: 500, Leader: 1000, Legend: 1000 }[level] || 100;
}

function Av({ name, src, size = 80 }) {
  const ini = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const cols = ['#7b2ff7', '#ff0080', '#ff8c00', '#00c851', '#00bcd4', '#e040fb'];
  const c = cols[(name || '').charCodeAt(0) % cols.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: `3px solid #fff`, background: src ? '#000' : `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 800, color: c, fontFamily: "'Playfair Display',serif" }}>
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : ini}
    </div>
  );
}

export default function Profile() {
  const { user, profile: myProfile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const isOwn = !userId || userId === user?.id;
  const targetId = userId || user?.id;

  const [vp, setVp] = useState(null);
  const [ud, setUd] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  
  // REQUIREMENT: Text input field for URL image link to bypass file attachment blocks
  const [imageUrlForm, setImageUrlForm] = useState({ profile_pic: '', cover_photo: '' });
  const [imageError, setImageError] = useState('');
  const [editError, setEditError] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTypeToEdit, setImageTypeToEdit] = useState('');

  const fetchAll = async () => {
    if (!targetId) return;
    setLoading(true);

    if (!isOwn) {
      setSavedPosts([]);
    }

    try {
      const [vpRes, udRes, postsRes, flrRes, flwRes] = await Promise.all([
        supabase.from('volunteer_profiles').select('*').eq('user_id', targetId).maybeSingle(),
        supabase.from('users').select('*').eq('id', targetId).maybeSingle(),
        supabase.from('posts').select('*').eq('user_id', targetId).eq('is_draft', false).eq('is_story', false).order('created_at', { ascending: false }).limit(20),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', targetId),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', targetId),
      ]);

      const volunteerData = vpRes.data;
      setVp(volunteerData);
      setUd(udRes.data);
      setPosts(postsRes.data || []);
      if (volunteerData?.user_id) {
        const derivedLevel = getVolunteerLevel(volunteerData.points || 0);
        if ((volunteerData.level || 'Newbie') !== derivedLevel) {
          await supabase.from('volunteer_profiles').update({ level: derivedLevel }).eq('user_id', volunteerData.user_id);
          setVp({ ...volunteerData, level: derivedLevel });
        }
      }
      setFollowerCount(flrRes.count || 0);
      setFollowingCount(flwRes.count || 0);

      if (vpRes.data) {
        setEditForm({
          bio: vpRes.data.bio || '',
          location: vpRes.data.location || '',
          availability: vpRes.data.availability || 'Available',
          skills: vpRes.data.skills || [],
          show_contact: !!vpRes.data.show_contact
        });
      }

      if (user && !isOwn) {
        const { data: f } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', targetId).maybeSingle();
        setIsFollowing(!!f);
      }

      if (isOwn && user) {
        const { data: sp } = await supabase.from('saved_posts').select('post_id').eq('user_id', user.id);
        if (sp?.length) {
          const { data: sposts } = await supabase.from('posts').select('*').in('id', sp.map(s => s.post_id)).eq('is_draft', false);
          setSavedPosts(sposts || []);
        } else {
          setSavedPosts([]);
        }
      }
    } catch (err) {
      console.error("Error setting up unified profile fields:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAll(); 
  }, [targetId, user]);

  const toggleFollow = async () => {
    if (!user) { navigate('/login'); return; }
    
    const dynamicNextState = !isFollowing;
    setIsFollowing(dynamicNextState);
    setFollowerCount(c => dynamicNextState ? c + 1 : Math.max(0, c - 1));

    try {
      if (!dynamicNextState) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      }
    } catch (err) {
      console.error("Database sync fault on following status update:", err);
      setIsFollowing(!dynamicNextState);
      setFollowerCount(c => !dynamicNextState ? c + 1 : Math.max(0, c - 1));
    }
  };

  const saveEdit = async () => {
    const validationError = validateProfileEdit(editForm, { volunteer: Boolean(isVol) });
    if (validationError) { setEditError(validationError); return; }
    setSaving(true);
    setEditError('');
    try {
      await supabase.from('volunteer_profiles').update({ bio: (editForm.bio || '').trim(), location: (editForm.location || '').trim() || null, availability: editForm.availability, skills: editForm.skills || [], show_contact: editForm.show_contact }).eq('user_id', user.id);
      await refreshProfile();
      setEditing(false);
      fetchAll();
    } catch (err) {
      console.error("Error writing adjustments back down to database layers:", err);
    } finally {
      setSaving(false);
    }
  };

  // REQUIREMENT: Map image string directly to the user record's `profile_pic` field inside the `users` table via an explicit `.update()` matching `user.id`. Ensure the UI preview frame re-renders instantly on success.
  const handleImageUrlSubmit = async () => {
    if (!user) return;
    const urlToSave = (imageUrlForm[imageTypeToEdit] || '').trim();
    const validationError = validateUrl(urlToSave, { required: true, imageOnly: true });
    if (validationError) { setImageError(validationError); return; }
    setSaving(true);
    setImageError('');
    try {
      if (imageTypeToEdit === 'profile_pic') {
        // Update users table for avatar
        await supabase.from('users').update({ profile_pic: urlToSave }).eq('id', user.id);
        // Also update volunteer profile if needed
        await supabase.from('volunteer_profiles').update({ profile_pic: urlToSave }).eq('user_id', user.id);
      } else {
        await supabase.from('volunteer_profiles').update({ cover_photo: urlToSave }).eq('user_id', user.id);
      }
      
      await refreshProfile();
      setShowImageModal(false);
      fetchAll(); // Re-fetch to bind state immediately so UI frame re-renders
    } catch (err) {
      console.error("Image link update error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!targetId && !user) { navigate('/login'); return null; }
  
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9f8', borderTopColor: '#7b2ff7', animation: 'spin 0.7s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  const name = ud?.full_name || user?.user_metadata?.full_name || 'Volunteer';
  const profilePic = ud?.profile_pic || vp?.profile_pic;
  const points = vp?.points || 0;
  const level = getVolunteerLevel(points);
  const nextLevel = getNextLevel(level);
  const nextThreshold = getNextThreshold(level);
  const levelStart = { Newbie: 0, Active: 100, Leader: 500, Legend: 1000 }[level] || 0;
  const progress = level === 'Legend' ? 100 : Math.min(((points - levelStart) / Math.max(nextThreshold - levelStart, 1)) * 100, 100);
  const isVol = ud?.is_volunteer || !!vp;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Cover */}
      <div style={{ position: 'relative', height: 210 }}>
        {vp?.cover_photo ? (
          <img src={vp.cover_photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="cover" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#7b2ff7,#ff0080,#ff8c00)' }} />
        )}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom,transparent 60%,rgba(0,0,0,0.3))' }} />
        <div style={{ position: 'absolute', top: 14, left: 14 }}>
          <button onClick={() => navigate(-1)} style={{ background: '#0005', backdropFilter: 'blur(8px)', border: 'none', borderRadius: 10, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: 13 }}>← Back</button>
        </div>
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8 }}>
          {isOwn && (
            <>
              <button onClick={() => { setImageTypeToEdit('cover_photo'); setImageUrlForm(p => ({ ...p, cover_photo: vp?.cover_photo || '' })); setShowImageModal(true); }} style={{ background: '#0005', backdropFilter: 'blur(8px)', border: 'none', borderRadius: 10, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: 13 }}>
                Cover
              </button>
              <button onClick={() => setShowLogout(true)} style={{ background: '#ff174488', backdropFilter: 'blur(8px)', border: 'none', borderRadius: 10, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: 13 }}>Logout</button>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: '0 16px', maxWidth: 680, margin: '0 auto' }}>
        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -50, marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ padding: 3, background: 'linear-gradient(135deg,#7b2ff7,#ff0080,#ff8c00)', borderRadius: '50%', boxShadow: '0 4px 20px rgba(123,47,247,0.4)' }}>
              <Av name={name} src={profilePic} size={90} />
            </div>
            {isOwn && (
              <>
                <button onClick={() => { setImageTypeToEdit('profile_pic'); setImageUrlForm(p => ({ ...p, profile_pic: profilePic || '' })); setShowImageModal(true); }} style={{ position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#7b2ff7,#ff0080)', border: '2.5px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
                </button>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
            {isOwn ? (
              <>
                <button onClick={() => setEditing(true)} style={{ background: 'linear-gradient(135deg,#7b2ff7,#ff0080)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontSize: 14 }}>Edit Profile</button>
              </>
            ) : user ? (
              <>
                <button onClick={toggleFollow} style={{ background: isFollowing ? 'transparent' : 'linear-gradient(135deg,#7b2ff7,#ff0080)', color: isFollowing ? 'var(--primary)' : '#fff', border: isFollowing ? '2px solid var(--primary)' : 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontSize: 13 }}>
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button onClick={() => navigate(`/messages?room=${directRoomFor(user.id, targetId)}&to=${targetId}&name=${encodeURIComponent(name)}`)} style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontSize: 13 }}>Message</button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} style={{ background: 'linear-gradient(135deg,#7b2ff7,#ff0080)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontSize: 14 }}>Follow</button>
            )}
          </div>
        </div>

        {/* Info card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)', margin: 0 }}>{name}</h1>
            {vp?.verified && <svg width="18" height="18" viewBox="0 0 24 24" fill="#1d9bf0"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
            <span style={{ background: isVol ? '#f0e8ff' : '#e8fff3', color: isVol ? '#7b2ff7' : '#1b5e20', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{isVol ? 'Volunteer' : 'User'}</span>
            {isVol && level && <span style={{ background: `${LEVEL_COLORS[level]}18`, color: LEVEL_COLORS[level], borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{level}</span>}
          </div>
          {vp?.location && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>📍 {vp.location}</div>}
          {vp?.availability && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: vp.availability === 'Available' ? '#e8fff3' : '#fff3e0', color: vp.availability === 'Available' ? '#1b5e20' : '#e65100', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: vp.availability === 'Available' ? '#00c851' : '#ff8c00' }} />
              {vp.availability}
            </div>
          )}
          {vp?.bio && <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.75, marginBottom: 10 }}>{vp.bio}</p>}
          {vp?.skills?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {vp.skills.map(sk => <span key={sk} style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{sk}</span>)}
            </div>
          )}
          {vp?.show_contact && ud?.phone && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>📞 {ud.phone}</div>}
          
          <div style={{ display: 'flex', gap: 24, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            {[{ label: 'Followers', value: followerCount }, { label: 'Following', value: followingCount }, { label: 'Posts', value: posts.length }].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {isVol && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ background: '#f0e8ff', borderRadius: 16, padding: '16px 12px', textAlign: 'center', border: '1.5px solid #7b2ff722' }}>
              <div style={{ fontWeight: 800, fontSize: 24, color: '#7b2ff7' }}>{points}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Points</div>
            </div>
          </div>
        )}

        {isVol && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1.5px solid var(--border)', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Level: {level}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{level === 'Legend' ? `${points} pts` : `${points}/${nextThreshold} pts → ${nextLevel}`}</span>
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 10, height: 10, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#7b2ff7,#ff0080,#ff8c00)', borderRadius: 10, transition: 'width 0.6s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {['Newbie', 'Active', 'Leader', 'Legend'].map(l => (
                <span key={l} style={{ fontSize: 10, color: l === level ? LEVEL_COLORS[l] : 'var(--muted)', fontWeight: l === level ? 700 : 400 }}>{l}</span>
              ))}
            </div>
          </div>
        )}

        {vp?.badges?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1.5px solid var(--border)', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 12 }}>Badges Earned</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {BADGES_INFO.filter(b => vp.badges.includes(b.id)).map(b => (
                <div key={b.id} style={{ background: b.bg, borderRadius: 12, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', border: `1px solid ${b.color}33` }}>
                  <span style={{ fontSize: 24 }}>{b.icon}</span>
                  <div><div style={{ fontWeight: 700, fontSize: 12, color: b.color }}>{b.label}</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>{b.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: '#fff', borderBottom: '1.5px solid var(--border)', display: 'flex', maxWidth: 680, margin: '0 auto' }}>
        <button onClick={() => setActiveTab('posts')} style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 14, cursor: 'pointer', borderBottom: '3px solid var(--primary)', fontFamily: 'Poppins,sans-serif' }}>
          Posts ({posts.length})
        </button>
      </div>

      <div style={{ padding: '0 12px', maxWidth: 680, margin: '0 auto', paddingBottom: 80 }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}><div style={{ fontSize: 40, marginBottom: 12 }}>📝</div><div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>No posts yet</div><div style={{ fontSize: 13 }}>{isOwn ? 'Share your first post!' : "This volunteer hasn't posted yet"}</div></div>
        ) : (
          posts.map(post => {
            const mediaUrl = post.media_url || (post.media && post.media[0]);
            const isVideo = mediaUrl && /\.(mp4|webm|ogg)(\?|$)/i.test(mediaUrl);

            return (
              <div key={post.id} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', marginBottom: 14, padding: 16, boxShadow: 'var(--shadow)', marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#7b2ff7,#ff0080)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
                    U
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>User ID: {post.user_id?.slice(0,8) || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(post.created_at).toLocaleString()}</div>
                  </div>
                </div>
                
                {post.content && <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 12, lineHeight: 1.6 }}>{post.content}</p>}
                
                {mediaUrl && (
                  <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isVideo ? (
                      <video src={mediaUrl} controls muted playsInline style={{ width: "100%", maxHeight: "450px", objectFit: "contain" }} />
                    ) : (
                      <img src={mediaUrl} alt="Post media" style={{ width: "100%", maxHeight: "450px", objectFit: "contain" }} />
                    )}
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <button onClick={(e) => { e.stopPropagation(); }} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '6px 12px', borderRadius: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    Like
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); }} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '6px 12px', borderRadius: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                    Comment
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); }} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '6px 12px', borderRadius: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                    Share
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); }} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '6px 12px', borderRadius: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    Save
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Image URL Modal */}
      {showImageModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#0009', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowImageModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>
                Update {imageTypeToEdit === 'profile_pic' ? 'Profile Picture' : 'Cover Photo'}
              </span>
              <button onClick={() => setShowImageModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>×</button>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Paste direct image web link (JPG/PNG):</div>
              <input 
                type="url" 
                value={imageUrlForm[imageTypeToEdit]} 
                onChange={e => { setImageError(''); setImageUrlForm(p => ({ ...p, [imageTypeToEdit]: e.target.value.slice(0, 500) })); }}
                placeholder="https://example.com/image.jpg"
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: 'Poppins,sans-serif', background: 'var(--bg)', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            
            {imageError && <div style={{ background:'#ffe8e8', color:'#c62828', borderRadius:12, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{imageError}</div>}
            {imageUrlForm[imageTypeToEdit] && (
              <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Preview:</div>
                <img 
                  src={imageUrlForm[imageTypeToEdit]} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 12, objectFit: 'contain', border: '1px solid var(--border)' }} 
                  onError={(e) => { e.target.style.display = 'none'; }}
                  onLoad={(e) => { e.target.style.display = 'inline-block'; }}
                />
              </div>
            )}
            
            <button onClick={handleImageUrlSubmit} disabled={saving} style={{ width: '100%', background: 'linear-gradient(135deg,#7b2ff7,#ff0080)', color: '#fff', border: 'none', borderRadius: 14, padding: 14, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Updating...' : 'Save Image'}
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: '#0009', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setEditing(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 680, margin: '0 auto', background: '#fff', borderRadius: '24px 24px 0 0', padding: 24, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>Edit Profile</span>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>×</button>
            </div>
            {[{ label: 'Bio', key: 'bio', multi: true }, { label: 'City / Location', key: 'location' }].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>{f.label}</div>
                {f.multi ? (
                  <textarea value={editForm[f.key] || ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value.slice(0, LIMITS.bioMax) }))} maxLength={LIMITS.bioMax} rows={3} style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '11px 14px', fontSize: 14, fontFamily: 'Poppins,sans-serif', background: 'var(--bg)', resize: 'none', boxSizing: 'border-box', outline: 'none' }} />
                ) : (
                  <input value={editForm[f.key] || ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value.slice(0, LIMITS.locationMax) }))} maxLength={LIMITS.locationMax} style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '11px 14px', fontSize: 14, fontFamily: 'Poppins,sans-serif', background: 'var(--bg)', boxSizing: 'border-box', outline: 'none' }} />
                )}
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Availability</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Available', 'Busy', 'On Leave'].map(a => (
                  <button key={a} onClick={() => setEditForm(p => ({ ...p, availability: a }))} style={{ padding: '7px 14px', borderRadius: 20, border: `2px solid ${editForm.availability === a ? 'var(--primary)' : 'var(--border)'}`, background: editForm.availability === a ? 'var(--primary-light)' : 'transparent', color: editForm.availability === a ? 'var(--primary)' : 'var(--muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>{a}</button>
                ))}
              </div>
            </div>
            {isVol && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SKILLS_ALL.map(sk => { const on = (editForm.skills || []).includes(sk); return (
                    <button key={sk} onClick={() => setEditForm(p => ({ ...p, skills: on ? p.skills.filter(x => x !== sk) : [...(p.skills || []), sk] }))} style={{ padding: '5px 12px', borderRadius: 20, border: `2px solid ${on ? 'var(--primary)' : 'var(--border)'}`, background: on ? 'var(--primary-light)' : 'transparent', color: on ? 'var(--primary)' : 'var(--muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
                      {on ? '✓ ' : ''}{sk}
                    </button>
                  ); })}
                </div>
              </div>
            )}
            {editError && <div style={{ background:'#ffe8e8', color:'#c62828', borderRadius:12, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{editError}</div>}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
              <div onClick={() => setEditForm(p => ({ ...p, show_contact: !p.show_contact }))} style={{ width: 40, height: 22, borderRadius: 11, background: editForm.show_contact ? 'var(--primary)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: editForm.show_contact ? 20 : 2, transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Show phone number on profile</span>
            </label>
            <button onClick={saveEdit} disabled={saving} style={{ width: '100%', background: 'linear-gradient(135deg,#7b2ff7,#ff0080)', color: '#fff', border: 'none', borderRadius: 14, padding: 14, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Logout confirm */}
      {showLogout && (
        <div style={{ position: 'fixed', inset: 0, background: '#0009', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowLogout(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 340, textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#ffe8e8', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff1744" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>Log out?</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>You will be returned to the login screen.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLogout(false)} style={{ flex: 1, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text)', borderRadius: 14, padding: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontSize: 15 }}>Cancel</button>
              <button onClick={async () => { await logout(); navigate('/login'); }} style={{ flex: 1, background: '#ff1744', color: '#fff', border: 'none', borderRadius: 14, padding: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontSize: 15 }}>Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
