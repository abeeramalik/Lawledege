import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';
import { directRoomFor, initials } from '../lib/roles';
import { LIMITS, validateTextLength } from '../lib/validators';
import { formatTime, timeAgo } from '../lib/time';

function nameFromRoom(room, userId) {
  if (room?.startsWith('help_')) return `Help Request ${room.replace('help_', '').slice(0, 8)}`;
  if (!room?.startsWith('direct_')) return room || 'Messages';
  return 'Direct Chat';
}

export default function Messages() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedRoom = searchParams.get('room') || '';
  const receiverId = searchParams.get('to') || '';
  const receiverName = searchParams.get('name') || '';
  const roomId = useMemo(() => requestedRoom || (receiverId && user ? directRoomFor(user.id, receiverId) : ''), [requestedRoom, receiverId, user]);

  const [msgs, setMsgs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [allowed, setAllowed] = useState(true);
  const [roomTitle, setRoomTitle] = useState(receiverName || nameFromRoom(roomId, user?.id));
  const bottomRef = useRef(null);

  const checkRoomAccess = useCallback(async () => {
    if (!user || !roomId) return true;
    if (isAdmin) return true;

    if (roomId.startsWith('direct_')) return roomId.includes(user.id);
    if (roomId.startsWith('help_')) {
      const requestId = roomId.replace('help_', '');
      const { data } = await supabase.from('help_requests').select('id,title,created_by,volunteers_assigned').eq('id', requestId).maybeSingle();
      const assigned = Array.isArray(data?.volunteers_assigned) ? data.volunteers_assigned : [];
      const ok = data?.created_by === user.id || assigned.includes(user.id);
      if (data?.title) setRoomTitle(data.title);
      return ok;
    }
    return false;
  }, [user, roomId, isAdmin]);

  const loadInbox = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id},room_id.ilike.%${user.id}%`)
      .order('created_at', { ascending: false })
      .limit(100);

    const latest = new Map();
    (data || []).forEach(m => { if (!latest.has(m.room_id)) latest.set(m.room_id, m); });
    const list = Array.from(latest.values());
    const otherIds = [...new Set(list.flatMap(m => [m.sender_id, m.receiver_id]).filter(id => id && id !== user.id))];
    const { data: users } = otherIds.length ? await supabase.from('users').select('id, full_name, profile_pic, status').in('id', otherIds) : { data: [] };
    const userMap = new Map((users || []).map(u => [u.id, u]));
    setConversations(list.map(m => {
      const other = userMap.get(m.sender_id === user.id ? m.receiver_id : m.sender_id);
      return { ...m, title: other?.full_name || nameFromRoom(m.room_id, user.id), avatar: other?.profile_pic };
    }));
    setLoading(false);
  }, [user]);

  const fetchMsgs = useCallback(async () => {
    if (!user) return;
    if (!roomId) return loadInbox();
    setLoading(true);
    const ok = await checkRoomAccess();
    setAllowed(ok);
    if (!ok) { setMsgs([]); setLoading(false); return; }

    const { data } = await supabase.from('messages')
      .select('*, users!sender_id(full_name, profile_pic)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    setMsgs(data || []);
    setLoading(false);
  }, [user, roomId, loadInbox, checkRoomAccess]);

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchMsgs(); }, [user, fetchMsgs, navigate]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  useEffect(() => {
    if (!user || !roomId) return;
    const ch = supabase.channel(`messages-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, async payload => {
        const { data } = await supabase.from('messages').select('*, users!sender_id(full_name, profile_pic)').eq('id', payload.new.id).single();
        setMsgs(p => p.some(m => m.id === payload.new.id) ? p : [...p, data || payload.new]);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, roomId]);

  const send = async () => {
    if (!roomId || !allowed) return;
    const messageError = validateTextLength(newMsg, { required: true, max: LIMITS.messageMax, label: 'Message' });
    if (messageError) return alert(messageError);
    setSending(true);
    const text = newMsg.trim();
    setNewMsg('');
    const payload = { sender_id: user.id, receiver_id: receiverId || null, room_id: roomId, message: text, created_at: new Date().toISOString() };
    const { data, error } = await supabase.from('messages').insert(payload).select('*, users!sender_id(full_name, profile_pic)').single();
    if (!error && data) setMsgs(p => p.some(m => m.id === data.id) ? p : [...p, data]);
    setSending(false);
  };



  if (!user) return null;

  if (!roomId) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
        <div style={{ background:'#fff', borderBottom:'1px solid var(--border)', padding:'14px 16px', position:'sticky', top:0, zIndex:5 }}>
          <div style={{ maxWidth:680, margin:'0 auto', display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => navigate('/feed')} style={{ border:'none', background:'none', fontWeight:900, cursor:'pointer' }}>←</button>
            <div><div style={{ fontWeight:900, fontSize:18 }}>Messages</div><div style={{ fontSize:12, color:'var(--muted)' }}>Messenger-style direct and help-request chats</div></div>
          </div>
        </div>
        <div style={{ maxWidth:680, margin:'0 auto', padding:'16px 12px 80px' }}>
          {loading ? <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading conversations…</div> : conversations.length === 0 ? (
            <div style={{ textAlign:'center', padding:48, color:'var(--muted)' }}>
              <div style={{ fontSize:44 }}>💬</div>
              <div style={{ fontWeight:800, color:'var(--text)', margin:'8px 0' }}>No conversations yet</div>
              <button onClick={() => navigate('/explore')} style={{ background:'var(--primary-light)', color:'var(--primary)', border:'none', borderRadius:14, padding:'10px 18px', fontWeight:800, cursor:'pointer' }}>Search Volunteers</button>
            </div>
          ) : conversations.map(c => (
            <div key={c.room_id} onClick={() => navigate(`/messages?room=${c.room_id}`)} style={{ background:'#fff', border:'1.5px solid var(--border)', borderRadius:16, padding:14, marginBottom:10, display:'flex', alignItems:'center', gap:12, cursor:'pointer', boxShadow:'var(--shadow)' }}>
              <div style={{ width:46, height:46, borderRadius:'50%', background:'linear-gradient(135deg,#7b2ff7,#ff0080)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>{initials(c.title)}</div>
              <div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.title}</div><div style={{ fontSize:12, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.message}</div></div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{timeAgo(c.created_at)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)' }}>
      <div style={{ background:'#fff', borderBottom:'1px solid var(--border)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12, flexShrink:0, position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#7b2ff7,#ff0080)' }} />
        <button onClick={() => navigate('/messages')} style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center' }}>←</button>
        <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#7b2ff7,#ff0080)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900 }}>{initials(roomTitle)}</div>
        <div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:800, fontSize:16, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{roomTitle || 'Chat'}</div><div style={{ fontSize:12, color:'var(--muted)' }}>{roomId.startsWith('help_') ? 'Private help-request room' : 'Direct message'}</div></div>
      </div>

      {!allowed ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:30, textAlign:'center', color:'var(--muted)' }}>You do not have access to this private chat.</div> : (
        <>
          <div style={{ flex:1, overflowY:'auto', padding:'16px 12px', display:'flex', flexDirection:'column' }}>
            {loading && msgs.length === 0 && <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading history...</div>}
            {!loading && msgs.length === 0 && <div style={{ textAlign:'center', padding:40, color:'var(--muted)', fontSize:14 }}>Start the conversation.</div>}
            {msgs.map((m, i) => {
              const mine = m.sender_id === user.id;
              return <div key={m.id || i} style={{ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom:12, flexDirection:'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                {!mine && <div style={{ fontSize:11, color:'var(--muted)', marginLeft:12, marginBottom:2 }}>{m.users?.full_name || 'User'}</div>}
                <div style={{ maxWidth:'85%', padding:'10px 14px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: mine ? 'linear-gradient(135deg,#7b2ff7,#ff0080)' : '#fff', color: mine ? '#fff' : 'var(--text)', fontSize:14, lineHeight:1.5, border: mine ? 'none' : '1.5px solid var(--border)', boxShadow:'var(--shadow)' }}>
                  {m.message}<div style={{ fontSize:10, opacity:0.65, marginTop:4, textAlign: mine ? 'right' : 'left' }}>{formatTime(m.created_at)}</div>
                </div>
              </div>;
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ background:'#fff', borderTop:'1px solid var(--border)', padding:'12px 12px 28px', display:'flex', gap:8, flexShrink:0 }}>
            <input value={newMsg} onChange={e => setNewMsg(e.target.value.slice(0, LIMITS.messageMax))} maxLength={LIMITS.messageMax} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message..." style={{ flex:1, border:'1.5px solid var(--border)', borderRadius:22, padding:'11px 16px', fontSize:14, background:'var(--bg)', fontFamily:'Poppins,sans-serif', outline:'none' }} />
            <button onClick={send} disabled={sending || !newMsg.trim()} style={{ background:'linear-gradient(135deg,#7b2ff7,#ff0080)', color:'#fff', border:'none', borderRadius:'50%', width:46, height:46, cursor:'pointer', flexShrink:0, opacity:sending ? 0.7 : 1 }}>➤</button>
          </div>
        </>
      )}
    </div>
  );
}
