import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/AuthContext';

// Instagram-like “single place” for volunteer actions.
// Keeps the user moving forward with explicit primary buttons.
export default function VolunteerHub() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const isVolunteer = !!(profile?.id || profile?.level || profile?.is_volunteer);

  const [loading, setLoading] = useState(true);
  const [myVp, setMyVp] = useState(null);

  const [helpRooms, setHelpRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const fetchMyVolunteerProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setMyVp(data || null);
  };

  const fetchOpenHelpRooms = async () => {
    setRoomsLoading(true);
    try {
      const { data } = await supabase
        .from('help_requests')
        .select('id,title,description,city,urgency,status,volunteers_assigned,volunteers_needed,created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      const open = (data || []).filter(r => (r.status || '').toLowerCase() === 'open');
      setHelpRooms(open);
    } catch (e) {
      console.error('VolunteerHub: open rooms load error', e);
      setHelpRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      try {
        await fetchMyVolunteerProfile();
        await fetchOpenHelpRooms();
        // profile might be stale; refresh but don’t block UI
        refreshProfile?.();
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const myLevel = myVp?.level || profile?.level || 'Newbie';
  const myPoints = myVp?.points ?? profile?.points ?? 0;
  const myHours = myVp?.hours ?? profile?.hours ?? 0;

  const primaryCards = useMemo(() => {
    const cards = [
      {
        title: 'Your Feed',
        subtitle: 'Share, like, and follow the community',
        cta: 'Go to Feed',
        onClick: () => navigate('/feed'),
      },
      {
        title: 'Explore Volunteers',
        subtitle: 'Find helpers by skill & location',
        cta: 'Explore',
        onClick: () => navigate('/explore'),
      },
      {
        title: 'Inbox',
        subtitle: 'Message anyone you follow',
        cta: 'Open Messages',
        onClick: () => navigate('/messages'),
      },
      {
        title: 'Help Rooms',
        subtitle: 'Pick an open SOS request and assist',
        cta: roomsLoading ? 'Loading…' : 'View Open Rooms',
        onClick: () => {
          // Keep forward motion: open Help hub page (existing)
          navigate('/help');
        },
      },
    ];

    if (isVolunteer) {
      cards.splice(3, 0, {
        title: 'Rewards & Impact',
        subtitle: 'Track your points and progress',
        cta: 'View Rewards',
        onClick: () => navigate('/volunteer-rewards'),
      });
    }

    return cards;
  }, [isVolunteer, navigate, roomsLoading]);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!loading && !isVolunteer) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 16 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🤝</div>
          <h2 style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 10 }}>Become a Volunteer</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
            Your account isn’t set up as a volunteer profile yet. Update your profile and then continue here.
          </p>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: '100%',
              maxWidth: 360,
              background: 'linear-gradient(135deg,#7b2ff7,#ff0080)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: 14,
              fontWeight: 900,
              cursor: 'pointer',
              fontFamily: 'Poppins,sans-serif',
            }}
          >
            Go to My Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 16 }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg,#7b2ff7,#ff0080,#ff8c00)',
            borderRadius: 22,
            padding: 16,
            color: '#fff',
            boxShadow: 'var(--shadow)',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>Volunteer Hub</div>
              <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 700 }}>Your social action center</div>
            </div>
            <button
              onClick={() => navigate('/profile')}
              style={{
                background: '#0005',
                color: '#fff',
                border: '1px solid #fff3',
                borderRadius: 14,
                padding: '10px 12px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Profile
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
            <div style={{ background: '#0004', borderRadius: 16, padding: 10, textAlign: 'center', border: '1px solid #fff2' }}>
              <div style={{ fontWeight: 950, fontSize: 18 }}>{myPoints}</div>
              <div style={{ fontSize: 11, opacity: 0.95, fontWeight: 800 }}>Points</div>
            </div>
            <div style={{ background: '#0004', borderRadius: 16, padding: 10, textAlign: 'center', border: '1px solid #fff2' }}>
              <div style={{ fontWeight: 950, fontSize: 18 }}>{myHours}</div>
              <div style={{ fontSize: 11, opacity: 0.95, fontWeight: 800 }}>Hours</div>
            </div>
            <div style={{ background: '#0004', borderRadius: 16, padding: 10, textAlign: 'center', border: '1px solid #fff2' }}>
              <div style={{ fontWeight: 950, fontSize: 18 }}>{myLevel}</div>
              <div style={{ fontSize: 11, opacity: 0.95, fontWeight: 800 }}>Level</div>
            </div>
          </div>
        </div>

        {/* Primary action grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          {primaryCards.map((c) => (
            <div
              key={c.title}
              style={{
                background: '#fff',
                borderRadius: 18,
                border: '1.5px solid var(--border)',
                padding: 14,
                boxShadow: 'var(--shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 950, color: 'var(--text)', fontSize: 14 }}>{c.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.5, flex: 1 }}>{c.subtitle}</div>
              <button
                onClick={c.onClick}
                style={{
                  background: 'linear-gradient(135deg,#7b2ff7,#ff0080)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  padding: '10px 12px',
                  fontWeight: 950,
                  cursor: 'pointer',
                  fontFamily: 'Poppins,sans-serif',
                }}
              >
                {c.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Open help rooms preview (so user doesn’t bounce) */}
        <div style={{ marginTop: 6, marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <div style={{ fontWeight: 950, fontSize: 15, color: 'var(--text)' }}>Open SOS rooms</div>
            <button
              onClick={() => navigate('/help')}
              style={{
                background: 'transparent',
                border: '1.5px solid var(--border)',
                borderRadius: 14,
                padding: '10px 12px',
                cursor: 'pointer',
                fontWeight: 900,
                color: 'var(--text)',
              }}
            >
              See all
            </button>
          </div>

          {roomsLoading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>Loading…</div>
          ) : helpRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No open rooms right now.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {helpRooms.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: '#fff',
                    borderRadius: 18,
                    border: '1.5px solid var(--border)',
                    padding: 14,
                    boxShadow: 'var(--shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontWeight: 950, color: 'var(--text)', fontSize: 14 }}>{r.title}</div>
                    <span style={{ background: '#e8fff3', color: '#1b5e20', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 900 }}>
                      Open
                    </span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.5 }}>
                    {r.city ? `📍 ${r.city} · ` : ''}
                    {r.urgency ? `Urgency: ${r.urgency}` : 'Urgency: —'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{r.description?.slice(0, 120)}{(r.description?.length || 0) > 120 ? '…' : ''}</div>
                  <button
                    onClick={() => navigate(`/messages?room=help_${r.id}`)}
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      border: 'none',
                      borderRadius: 14,
                      padding: '10px 12px',
                      fontWeight: 950,
                      cursor: 'pointer',
                      fontFamily: 'Poppins,sans-serif',
                    }}
                  >
                    Join room
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.05)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9f8', borderTopColor: '#7b2ff7', animation: 'spin 0.7s linear infinite' }} />
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      )}
    </div>
  );
}

