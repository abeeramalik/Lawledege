import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';

function LeaderboardAvatar({ name, src, size = 44 }) {
  const ini = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const cols = ['#7b2ff7', '#ff0080', '#ff8c00', '#00c851', '#00bcd4', '#e040fb'];
  const c = cols[(name || '').charCodeAt(0) % cols.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2.5px solid ${c}`, background: src ? '#000' : `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 800, color: c }}>
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : ini}
    </div>
  );
}

const LEVEL_COLORS = { Newbie: '#78909c', Active: '#43a047', Leader: '#ff8c00', Legend: '#7b2ff7' };

function levelFromPoints(points = 0) {
  const p = Number(points) || 0;
  if (p >= 1000) return 'Legend';
  if (p >= 500) return 'Leader';
  if (p >= 100) return 'Active';
  return 'Newbie';
}

function normalizeText(v = '') {
  return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function challengeConfig(challenge) {
  const text = normalizeText(`${challenge?.title || ''} ${challenge?.description || ''}`);
  const target = Number(challenge?.target) || 1;
  const points = Number(challenge?.points) || 30;

  if (text.includes('like')) return { mode: 'auto', label: 'Like posts/reels', prefixes: ['post_liked_', 'reel_liked_'], target, points };
  if (text.includes('comment')) return { mode: 'auto', label: 'Comment on posts', prefixes: ['comment_created_'], target, points };
  if (text.includes('reel') || text.includes('story') || text.includes('video')) return { mode: 'auto', label: 'Create reels/stories', prefixes: ['reel_created_'], target, points };
  if (text.includes('post') || text.includes('content')) return { mode: 'auto', label: 'Create feed posts', prefixes: ['post_created_'], target, points };
  if (text.includes('help') || text.includes('respond') || text.includes('claim') || text.includes('request')) return { mode: 'auto', label: 'Respond to help requests', prefixes: ['help_claimed_'], target, points };
  if (text.includes('fir')) return { mode: 'manual', label: 'Record FIR support progress', prefixes: [`challenge_manual_${challenge.id}_`], target, points };
  if (text.includes('awareness') || text.includes('session')) return { mode: 'manual', label: 'Record awareness session', prefixes: [`challenge_manual_${challenge.id}_`], target, points };
  if (text.includes('recruit') || text.includes('volunteer')) return { mode: 'manual', label: 'Record volunteer recruitment', prefixes: [`challenge_manual_${challenge.id}_`], target, points };
  return { mode: 'manual', label: 'Record progress', prefixes: [`challenge_manual_${challenge.id}_`], target, points };
}

function countMatchingActions(logs, prefixes) {
  return (logs || []).filter(l => prefixes.some(prefix => String(l.action || '').startsWith(prefix))).length;
}

function isMonthlyActive(challenge) {
  const created = new Date(challenge?.created_at || Date.now()).getTime();
  if (!Number.isFinite(created)) return true;
  return Date.now() - created < 30 * 24 * 60 * 60 * 1000;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [myProgress, setMyProgress] = useState({});
  const [completed, setCompleted] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [myRank, setMyRank] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setMsg('');

    let q = supabase.from('volunteer_profiles').select('*, users(full_name, id)').order('points', { ascending: false }).limit(100);
    if (tab === 'city' && user) {
      const { data: vp } = await supabase.from('volunteer_profiles').select('location').eq('user_id', user.id).maybeSingle();
      if (vp?.location) q = q.eq('location', vp.location);
    }

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [{ data: profiles }, { data: chs }] = await Promise.all([
      q,
      supabase.from('challenges').select('*').eq('active', true).gte('created_at', monthAgo).order('created_at', { ascending: false }).limit(20),
    ]);

    const normalizedProfiles = (profiles || []).map(v => ({ ...v, level: levelFromPoints(v.points || 0) }));
    setLeaders(normalizedProfiles);
    const monthlyChallenges = (chs || []).filter(isMonthlyActive);
    setChallenges(monthlyChallenges);

    if (user) {
      const idx = normalizedProfiles.findIndex(p => p.user_id === user.id);
      setMyRank(idx >= 0 ? idx + 1 : null);

      const { data: logs } = await supabase.from('activity_logs').select('action').eq('user_id', user.id);
      const allLogs = logs || [];
      const progress = {};
      const completedSet = new Set(allLogs.filter(l => String(l.action || '').startsWith('challenge_completed_')).map(l => String(l.action).replace('challenge_completed_', '')));
      let awarded = false;

      for (const c of monthlyChallenges) {
        const cfg = challengeConfig(c);
        const done = countMatchingActions(allLogs, cfg.prefixes);
        progress[c.id] = done;
        if (done >= cfg.target && !completedSet.has(c.id)) {
          const { error } = await supabase.from('activity_logs').insert({ user_id: user.id, action: `challenge_completed_${c.id}` });
          if (!error) {
            await supabase.rpc('increment_volunteer_points', { p_user_id: user.id, p_points: cfg.points });
            completedSet.add(c.id);
            awarded = true;
          }
        }
      }

      setMyProgress(progress);
      setCompleted(completedSet);
      if (awarded) {
        setMsg('Challenge completed — points awarded.');
        setTimeout(() => fetchAll(), 700);
      }
    } else {
      setMyProgress({});
      setCompleted(new Set());
    }

    setLoading(false);
  }, [tab, user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const recordManualProgress = async (challenge) => {
    if (!user) return navigate('/login');
    const cfg = challengeConfig(challenge);
    if (cfg.mode !== 'manual') return;
    const done = myProgress[challenge.id] || 0;
    if (done >= cfg.target || completed.has(challenge.id)) return;
    const uniqueAction = `challenge_manual_${challenge.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { error } = await supabase.from('activity_logs').insert({ user_id: user.id, action: uniqueAction });
    if (error) {
      setMsg(error.message || 'Could not record progress.');
      return;
    }
    await fetchAll();
  };

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'linear-gradient(135deg,#ffd700,#ff8c00,#ff0080)', padding: '48px 20px 24px', textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
          <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Top Volunteers</h1>
        <p style={{ color: '#ffffffcc', fontSize: 13 }}>Pakistan's most impactful legal volunteers</p>
        {myRank && <div style={{ marginTop: 10, background: '#ffffff22', borderRadius: 20, padding: '6px 20px', display: 'inline-block', color: '#fff', fontSize: 13, fontWeight: 700 }}>Your Rank: #{myRank}</div>}
      </div>

      <div style={{ display: 'flex', background: '#fff', borderBottom: '1.5px solid var(--border)' }}>
        {[['all', 'All Time'], ['month', 'This Month'], ['city', 'My City']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '13px', border: 'none', background: 'none', color: tab === k ? 'var(--primary)' : 'var(--muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderBottom: `3px solid ${tab === k ? 'var(--primary)' : 'transparent'}`, fontFamily: 'Poppins,sans-serif' }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: '16px 12px 80px', maxWidth: 680, margin: '0 auto' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading…</div> : (
          <>
            {msg && <div style={{ background: '#e8fff3', color: '#1b5e20', borderRadius: 14, padding: '10px 14px', fontSize: 13, fontWeight: 800, marginBottom: 12 }}>{msg}</div>}

            {leaders.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: 8, marginBottom: 20, alignItems: 'flex-end' }}>
                {[top3[1], top3[0], top3[2]].map((v, i) => {
                  if (!v) return <div key={i} />;
                  const rank = i === 1 ? 0 : i === 0 ? 1 : 2;
                  const name = v.users?.full_name || 'Volunteer';
                  const isMe = v.user_id === user?.id;
                  const level = levelFromPoints(v.points || 0);
                  return (
                    <div key={v.user_id || v.id} onClick={() => navigate(`/profile/${v.user_id}`)} style={{ background: isMe ? 'linear-gradient(135deg,#f0e8ff,#ffe8f5)' : '#fff', borderRadius: 18, padding: '16px 8px 14px', textAlign: 'center', border: isMe ? '2px solid var(--primary)' : rank === 0 ? '2px solid #ffd700' : '1.5px solid var(--border)', cursor: 'pointer', boxShadow: rank === 0 ? '0 4px 24px rgba(255,215,0,0.35)' : 'var(--shadow)' }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{medals[rank]}</div>
                      <LeaderboardAvatar name={name} src={v.profile_pic} size={rank === 0 ? 52 : 44} />
                      <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--text)', marginTop: 8, marginBottom: 2 }}>{name.split(' ')[0]}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{v.location || 'PK'}</div>
                      <div style={{ fontWeight: 900, fontSize: 18, background: 'linear-gradient(90deg,#7b2ff7,#ff0080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{(v.points || 0).toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)' }}>pts</div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{ background: `${LEVEL_COLORS[level]}18`, color: LEVEL_COLORS[level], borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700 }}>{level}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {rest.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid var(--border)', overflow: 'hidden', marginBottom: 20, boxShadow: 'var(--shadow)' }}>
                {rest.map((v, i) => {
                  const name = v.users?.full_name || 'Volunteer';
                  const isMe = v.user_id === user?.id;
                  const level = levelFromPoints(v.points || 0);
                  return (
                    <div key={v.user_id || v.id} onClick={() => navigate(`/profile/${v.user_id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < rest.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', background: isMe ? 'var(--primary-light)' : 'transparent' }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--muted)', width: 28, textAlign: 'center' }}>#{i + 4}</span>
                      <LeaderboardAvatar name={name} src={v.profile_pic} size={38} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: isMe ? 'var(--primary)' : 'var(--text)' }}>{name} {isMe && '(You)'}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{v.location || 'Pakistan'} · <span style={{ color: LEVEL_COLORS[level], fontWeight: 700 }}>{level}</span></div>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 17, color: 'var(--primary)' }}>{(v.points || 0).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {leaders.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)', fontSize: 14 }}>No volunteers yet in this category</div>}

            <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid var(--border)', padding: 18, marginBottom: 16, boxShadow: 'var(--shadow)' }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)', marginBottom: 6 }}>Monthly Challenges</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>Challenges stay active for one month. Points are awarded once when the target is completed.</div>

              {challenges.length > 0 ? challenges.map(c => {
                const cfg = challengeConfig(c);
                const done = myProgress[c.id] || 0;
                const pct = Math.min((done / cfg.target) * 100, 100);
                const comp = pct >= 100 || completed.has(c.id);
                return (
                  <div key={c.id} style={{ background: comp ? 'linear-gradient(135deg,#e8fff3,#f0fff8)' : 'linear-gradient(135deg,#f0e8ff,#ffe8f5)', borderRadius: 14, padding: 14, marginBottom: 12, border: `1.5px solid ${comp ? '#00c851' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, color: comp ? '#1b5e20' : 'var(--primary)', fontSize: 14, flex: 1, paddingRight: 8 }}>{c.title}</div>
                      <span style={{ background: comp ? '#00c851' : 'var(--primary)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{comp ? 'Completed' : `+${cfg.points} pts`}</span>
                    </div>
                    {c.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.5 }}>{c.description}</div>}
                    <div style={{ background: comp ? '#c8e6c9' : 'var(--border)', borderRadius: 10, height: 8, marginBottom: 6 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: comp ? '#00c851' : 'linear-gradient(90deg,#7b2ff7,#ff0080)', borderRadius: 10, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' }}>
                      <span>{Math.min(done, cfg.target)}/{cfg.target} completed</span>
                      <span>{comp ? 'Points awarded' : cfg.mode === 'auto' ? 'Keep using the app' : 'Record your progress'}</span>
                    </div>
                    {user && cfg.mode === 'manual' && !comp && (
                      <button onClick={e => { e.stopPropagation(); recordManualProgress(c); }} style={{ marginTop: 10, width: '100%', background: 'linear-gradient(135deg,#7b2ff7,#ff0080)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
                        Record Progress
                      </button>
                    )}
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: 26, color: 'var(--muted)', fontSize: 13 }}>No active monthly challenges.</div>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid var(--border)', padding: 18, boxShadow: 'var(--shadow)' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 14 }}>How to Earn Points</div>
              {[
                ['Create a post', '+10 pts'],
                ['Post or reel gets liked', '+2 pts'],
                ['Claim a help request slot', '+100 pts'],
                ['Complete a monthly challenge', '+challenge points'],
                ['Get verified', '+50 pts'],
              ].map(([action, pts]) => (
                <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{action}</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 13 }}>{pts}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
