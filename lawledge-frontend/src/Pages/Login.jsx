import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../lib/roles';
import { onlyDigits, validateCNIC, validateEmail, validateFullName, validatePassword, validatePhone } from '../lib/validators';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const finishLogin = async (authUser) => {
    const meta = authUser.user_metadata || {};
    const normalizedEmail = authUser.email?.toLowerCase() || email.trim().toLowerCase();
    const { data: existingUser } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();

    if (existingUser?.status === 'blocked') {
      await supabase.auth.signOut();
      setError('This account is blocked by admin and cannot login.');
      setLoading(false);
      return;
    }

    const rawName = existingUser?.full_name || meta.full_name || meta.name || normalizedEmail.split('@')[0] || 'User';
    const safeName = validateFullName(rawName, { required: true }) ? 'User' : rawName;
    const rawPhone = onlyDigits(existingUser?.phone || meta.phone || '').slice(0, 11);
    const rawCnic = onlyDigits(existingUser?.cnic || meta.cnic || '').slice(0, 13);
    const isAdminEmail = normalizedEmail === ADMIN_EMAIL;

    await supabase.from('users').upsert({
      id: authUser.id,
      email: normalizedEmail,
      full_name: isAdminEmail ? 'Admin' : safeName,
      phone: rawPhone && !validatePhone(rawPhone, { required: false }) ? rawPhone : null,
      cnic: rawCnic && !validateCNIC(rawCnic, { required: false }) ? rawCnic : null,
      city: existingUser?.city || meta.city || null,
      role: isAdminEmail ? 'admin' : (existingUser?.role || meta.role || 'user'),
      is_volunteer: isAdminEmail ? false : Boolean(existingUser?.is_volunteer || meta.role === 'volunteer'),
      status: existingUser?.status || 'active',
    }, { onConflict: 'id' });

    setLoading(false);
    navigate(isAdminEmail ? '/admin' : '/feed');
  };

  const login = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailError = validateEmail(normalizedEmail);
    if (emailError) { setError(emailError); return; }
    const passwordError = validatePassword(password, { login: true });
    if (passwordError) { setError(passwordError); return; }
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (err) {
      const isAdminBootstrap = normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD && err.message.includes('Invalid login credentials');
      if (isAdminBootstrap) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          options: { data: { full_name: 'Admin', role: 'admin' } },
        });

        if (!signUpErr && signUpData?.session?.user) {
          await finishLogin(signUpData.session.user);
          return;
        }

        if (!signUpErr && signUpData?.user) {
          await supabase.from('users').upsert({
            id: signUpData.user.id,
            email: ADMIN_EMAIL,
            full_name: 'Admin',
            role: 'admin',
            is_volunteer: false,
            status: 'active',
          }, { onConflict: 'id' });
          setError('Admin account was created but Supabase email confirmation is ON. Confirm admin@lawledge.pk in Supabase Authentication, then sign in again.');
        } else {
          setError(`Admin login failed. Create or reset admin@lawledge.pk in Supabase Authentication with password ${ADMIN_PASSWORD}. ${signUpErr?.message || ''}`);
        }
        setLoading(false);
        return;
      }

      if (err.message.includes('Invalid login credentials'))
        setError(normalizedEmail === ADMIN_EMAIL ? `Admin account is missing or password is different. In Supabase Authentication, create/reset admin@lawledge.pk with password ${ADMIN_PASSWORD}.` : 'Incorrect email or password. Please try again.');
      else if (err.message.includes('Email not confirmed'))
        setError('Please confirm your email first, or verify your email settings in Supabase.');
      else
        setError(err.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      await finishLogin(data.user);
      return;
    }

    setLoading(false);
    navigate('/feed');
  };

  return (
    <div className="lawledge-login-page" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Banner Layout */}
      <div style={{ background: 'linear-gradient(135deg,#7b2ff7 0%,#ff0080 60%,#ff8c00 100%)', padding: '72px 28px 88px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: '#ffffff10' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: '#ffffff08' }} />
        <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L3 7l4 9h10l4-9-9-5z" /><line x1="12" y1="22" x2="12" y2="16" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 44, color: '#fff', marginBottom: 8, letterSpacing: '-0.5px' }}>Lawledge</h1>
        <p style={{ color: '#ffffffcc', fontSize: 18 }}>Pakistan's Volunteer Justice Network</p>
        <div style={{ position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)', width: '150%', height: 56, background: 'var(--bg)', borderRadius: '50% 50% 0 0' }} />
      </div>

      <div style={{ flex: 1, padding: '38px 28px', maxWidth: 500, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, color: 'var(--text)', marginBottom: 6 }}>Welcome back</h2>
        <p style={{ color: 'var(--muted)', fontSize: 18, marginBottom: 30 }}>Sign in to continue your mission</p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Email Address</div>
          <input type="email" value={email} placeholder="your@email.com"
            onChange={e => setEmail(e.target.value.toLowerCase().trimStart())} onKeyDown={e => e.key === 'Enter' && login()}
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 14, padding: '16px 18px', fontSize: 18, background: '#fff', color: 'var(--text)', fontFamily: 'Poppins,sans-serif', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Password</div>
          <div style={{ position: 'relative' }}>
            <input className="login-password-input" type="text" value={password} placeholder="••••••••" autoComplete="current-password"
              onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
              style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 14, padding: '16px 54px 16px 18px', fontSize: 18, background: '#fff', color: 'var(--text)', fontFamily: 'Poppins,sans-serif', boxSizing: 'border-box', outline: 'none', WebkitTextSecurity: showPwd ? 'none' : 'disc' }}
            />
            <button onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'flex', alignItems: 'center' }}>
              {showPwd
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              }
            </button>
          </div>
        </div>

        {error && <div style={{ background: '#ffe8e8', color: '#c62828', borderRadius: 12, padding: '10px 14px', fontSize: 16, marginBottom: 18, lineHeight: 1.5 }}>{error}</div>}

        <button className="btn-rainbow" onClick={login} disabled={loading} style={{ marginBottom: 12, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        {/* Keep this button on the Login page only; it does NOT replace the /login route */}
        <button className="btn-outline" onClick={() => navigate('/feed')} style={{ marginBottom: 28 }}>
          Browse as Guest (Read Only)
        </button>


        <p style={{ textAlign: 'center', fontSize: 17, color: 'var(--muted)' }}>
          New volunteer?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Create Account</Link>
        </p>
      </div>
    </div>
  );
}
