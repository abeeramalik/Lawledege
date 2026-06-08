import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';
import { LIMITS, validateMediaFile, validatePostPayload } from '../lib/validators';

const POST_TYPES = ['Activity Update', 'Awareness', 'Gratitude', 'Success Story'];
const TYPE_COLORS = { 'Activity Update':'#ff8c00', Awareness:'#00bcd4', Gratitude:'#e040fb', 'Success Story':'#00c851' };

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [mode, setMode] = useState('post');
  const [type, setType] = useState('Activity Update');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPrev, setMediaPrev] = useState(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!user) { navigate('/login'); return null; }

  const resetMedia = () => {
    setMediaFile(null);
    setMediaPrev(null);
    setExternalUrl('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (files) => {
    if (!files?.[0]) return;
    const selected = files[0];
    const mediaError = validateMediaFile(selected, { reel: mode === 'reel' });
    if (mediaError) { setError(mediaError); return; }
    setError('');
    setExternalUrl('');
    setMediaFile(selected);
    setMediaPrev(URL.createObjectURL(selected));
  };

  const uploadToSupabase = async (file) => {
    const ext = file.name.split('.').pop();
    const folder = mode === 'reel' ? 'reels' : 'posts';
    const filePath = `${folder}/${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('posts_media').upload(filePath, file, { upsert: true, contentType: file.type });
    if (upErr) throw upErr;
    return supabase.storage.from('posts_media').getPublicUrl(filePath).data.publicUrl;
  };

  const handleSubmit = async () => {
    const validationError = validatePostPayload({ mode, content, location, type, mediaFile, externalUrl });
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');
    try {
      let finalMediaUrl = null;
      if (mediaFile) {
        setUploading(true);
        finalMediaUrl = await uploadToSupabase(mediaFile);
        setUploading(false);
      } else if (externalUrl.trim()) {
        finalMediaUrl = externalUrl.trim();
      }

      const { data, error: postErr } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        type: mode === 'reel' ? 'Reel/Story' : type,
        location: location.trim() || null,
        media_url: finalMediaUrl,
        is_draft: false,
        is_story: mode === 'reel',
        created_at: new Date().toISOString(),
      }).select('id').single();
      if (postErr) throw postErr;

      await supabase.from('activity_logs').insert({ user_id: user.id, action: `${mode === 'reel' ? 'reel_created' : 'post_created'}_${data?.id || Date.now()}` });
      navigate(mode === 'reel' ? '/reels' : '/feed');
    } catch (e) {
      setError(e.message || 'Could not publish. Check Supabase tables/storage bucket.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const ModeButton = ({ value, title }) => (
    <button onClick={() => { setMode(value); resetMedia(); }} style={{ flex: 1, border: `2px solid ${mode === value ? 'var(--primary)' : 'var(--border)'}`, background: mode === value ? 'var(--primary-light)' : '#fff', color: mode === value ? 'var(--primary)' : 'var(--text)', borderRadius: 16, padding: 14, textAlign: 'center', cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontWeight: 900 }}>
      {title}
    </button>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ background:'linear-gradient(135deg,#7b2ff7,#ff0080)', padding:'48px 20px 28px', position:'relative' }}>
        <button onClick={()=>navigate(-1)} style={{ position:'absolute', top:14, left:14, background:'#fff3', border:'none', borderRadius:10, padding:'6px 14px', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13 }}>← Back</button>
        <div style={{ textAlign:'center' }}>
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, marginBottom:4 }}>Create</h1>
          <p style={{ color:'#ffffffbb', fontSize:12 }}>Post to Feed or publish a Reel/Story</p>
        </div>
      </div>

      <div style={{ padding:16, maxWidth:640, margin:'0 auto', paddingBottom:80 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <ModeButton value="post" title="Feed Post" />
          <ModeButton value="reel" title="Reel / Story" />
        </div>

        {mode === 'post' && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:8 }}>Post Type</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {POST_TYPES.map(t => (
                <button key={t} onClick={()=>setType(t)} style={{ padding:'6px 14px', borderRadius:20, border:`2px solid ${type===t?TYPE_COLORS[t]:'var(--border)'}`, background:type===t?`${TYPE_COLORS[t]}18`:'transparent', color:type===t?TYPE_COLORS[t]:'var(--muted)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:6 }}>{mode === 'reel' ? 'Caption *' : "What's on your mind? *"}</div>
          <textarea value={content} onChange={e=>setContent(e.target.value.slice(0, mode === 'reel' ? LIMITS.reelCaptionMax : LIMITS.postMax))} rows={5} maxLength={mode === 'reel' ? LIMITS.reelCaptionMax : LIMITS.postMax}
            placeholder={mode === 'reel' ? 'Write a short caption for this reel/story...' : 'Share your update...'}
            style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:14, padding:'12px 14px', fontSize:14, fontFamily:'Poppins,sans-serif', background:'#fff', color:'var(--text)', resize:'vertical', boxSizing:'border-box', outline:'none' }}
          />
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:6 }}>Location (optional)</div>
          <input value={location} onChange={e=>setLocation(e.target.value.slice(0, LIMITS.locationMax))} placeholder="City / Area" maxLength={LIMITS.locationMax}
            style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'11px 14px', fontSize:14, background:'#fff', color:'var(--text)', fontFamily:'Poppins,sans-serif', boxSizing:'border-box', outline:'none' }}
          />
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:8 }}>{mode === 'reel' ? 'Short Video / Photo or Link *' : 'Photo / Video or Link (optional)'}</div>
          <div onClick={()=>fileRef.current?.click()} style={{ border:'2px dashed var(--border)', borderRadius:14, padding:'20px', textAlign:'center', cursor:'pointer', background:'var(--bg)', marginBottom:10 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--muted)' }}>Click to upload media</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{mode === 'reel' ? 'Upload a short video/photo, or paste a reel link below.' : 'Upload a photo/video, or paste an external link below.'}</div>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={e=>handleFile(e.target.files)}/>
          </div>

          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:6 }}>{mode === 'reel' ? 'Reel / Story link' : 'Attached link'}</div>
            <input
              value={externalUrl}
              onChange={e=>{
                const value = e.target.value.slice(0, LIMITS.reelLinkMax);
                setExternalUrl(value);
                if (value.trim()) { setMediaFile(null); setMediaPrev(null); if (fileRef.current) fileRef.current.value = ''; }
              }}
              placeholder={mode === 'reel' ? 'Paste YouTube, Facebook, Instagram, TikTok, or direct video link' : 'Paste website, Facebook, YouTube, or any http/https link'}
              maxLength={LIMITS.reelLinkMax}
              style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'11px 14px', fontSize:14, background:'#fff', color:'var(--text)', fontFamily:'Poppins,sans-serif', boxSizing:'border-box', outline:'none' }}
            />
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:6, lineHeight:1.5 }}>Use either an upload or a link, not both.</div>
          </div>

          {mediaPrev && (
            <div style={{ position:'relative', borderRadius:12, overflow:'hidden', maxHeight: 400, background: '#000', display: 'flex', justifyContent: 'center' }}>
              {mediaFile?.type?.startsWith('video/') ? <video src={mediaPrev} controls style={{ width:'100%', maxHeight:400, objectFit:'contain' }} /> : <img src={mediaPrev} alt="Preview" style={{ width:'100%', maxHeight:400, objectFit:'contain' }} />}
              <button onClick={(e)=>{e.stopPropagation(); setMediaFile(null); setMediaPrev(null); if (fileRef.current) fileRef.current.value = '';}} style={{ position:'absolute', top:10, right:10, background:'#000a', border:'none', borderRadius:'50%', width:30, height:30, color:'#fff', cursor: 'pointer', zIndex: 10 }}>×</button>
            </div>
          )}
        </div>

        {error && <div style={{ background:'#ffe8e8', color:'#c62828', borderRadius:12, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{error}</div>}

        <button className="btn-rainbow" onClick={handleSubmit} disabled={loading||uploading} style={{ width: '100%', padding: '12px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', opacity: loading||uploading ? 0.7 : 1 }}>
          {uploading ? 'Uploading Media...' : loading ? 'Publishing…' : mode === 'reel' ? 'Publish Reel / Story' : 'Publish Feed Post'}
        </button>
      </div>
    </div>
  );
}
