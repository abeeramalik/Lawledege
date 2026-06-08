import { useEffect, useState, useContext, useCallback } from 'react';
import { supabase } from '../supabase';
import { AuthContext } from './contextInstances.js';
import { ADMIN_EMAIL, getRole, isAdmin as computeIsAdmin, isVolunteer as computeIsVolunteer } from './roles';
import { onlyDigits, validateCNIC, validateFullName, validatePhone } from './validators';
import { ensureVolunteerProfile } from './volunteerProfile';

async function ensureUserRow(authUser, meta = {}) {
  const uid = authUser.id;
  const email = (authUser.email || meta.email || '').toLowerCase();

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle();

  const desiredRole = email === ADMIN_EMAIL ? 'admin' : (existing?.role || meta.role || 'user');
  const volunteer = desiredRole === 'volunteer';

  const rawName = existing?.full_name || meta.full_name || meta.name || email.split('@')[0] || 'User';
  const safeName = validateFullName(rawName, { required: true }) ? 'User' : rawName;
  const rawPhone = onlyDigits(existing?.phone || meta.phone || '').slice(0, 11);
  const rawCnic = onlyDigits(existing?.cnic || meta.cnic || '').slice(0, 13);

  const { error: userError } = await supabase.from('users').upsert({
    id: uid,
    email,
    full_name: safeName,
    phone: rawPhone && !validatePhone(rawPhone, { required: false }) ? rawPhone : null,
    cnic: rawCnic && !validateCNIC(rawCnic, { required: false }) ? rawCnic : null,
    city: existing?.city || meta.city || null,
    role: desiredRole,
    is_volunteer: volunteer,
    status: existing?.status || 'active',
  }, { onConflict: 'id' });
  if (userError) throw userError;

  if (volunteer) {
    // Same bio is allowed for multiple volunteers. This save does not depend on
    // an old/missing ON CONFLICT constraint in Supabase.
    await ensureVolunteerProfile(uid, {
      bio: meta.bio || null,
      skills: Array.isArray(meta.skills) ? meta.skills : [],
      location: meta.city || null,
    });
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setAuthError('');
      await ensureUserRow(authUser, authUser.user_metadata || {});

      const [{ data: u, error: userErr }, { data: vp }] = await Promise.all([
        supabase.from('users').select('*').eq('id', authUser.id).maybeSingle(),
        supabase.from('volunteer_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
      ]);
      if (userErr) throw userErr;

      if (u?.status === 'blocked') {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setAuthError('This account is blocked by admin and cannot access Lawledge.');
        setLoading(false);
        return;
      }

      setProfile({ ...(vp || {}), ...(u || {}), id: authUser.id });
    } catch (e) {
      console.error('fetchProfile error:', e);
      const metaRole = authUser.user_metadata?.role === 'volunteer' ? 'volunteer' : (authUser.email === ADMIN_EMAIL ? 'admin' : 'user');
      setProfile({ id: authUser.id, role: metaRole, is_volunteer: metaRole === 'volunteer' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(() => {
    if (user) fetchProfile(user);
  }, [user, fetchProfile]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const role = getRole(profile, user);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      authError,
      role,
      isAdmin: computeIsAdmin(profile, user),
      isVolunteer: computeIsVolunteer(profile, user),
      refreshProfile,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
