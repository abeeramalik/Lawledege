export const ADMIN_EMAIL = 'admin@lawledge.pk';
export const ADMIN_PASSWORD = 'Admin@123';

function metadataRole(user) {
  const role = user?.user_metadata?.role || user?.app_metadata?.role || '';
  return String(role).toLowerCase();
}

export function getRole(profile, user) {
  const email = (user?.email || '').toLowerCase();
  if (email === ADMIN_EMAIL) return 'admin';
  if (profile?.role === 'admin') return 'admin';
  if (profile?.role === 'volunteer' || profile?.is_volunteer || profile?.level) return 'volunteer';
  // Important for new/empty Supabase projects: while public.users / volunteer_profiles
  // rows are being created or the schema cache is catching up, keep the selected
  // signup role from Supabase Auth metadata so volunteers do not temporarily look
  // like regular users in Justice Hub.
  if (metadataRole(user) === 'volunteer') return 'volunteer';
  if (metadataRole(user) === 'admin') return 'admin';
  return 'user';
}

export function isAdmin(profile, user) {
  return getRole(profile, user) === 'admin';
}

export function isVolunteer(profile, user) {
  const role = getRole(profile, user);
  return role === 'volunteer' || role === 'admin';
}

export function directRoomFor(a, b) {
  return ['direct', ...[a, b].sort()].join('_');
}

export function initials(name = '', fallback = '?') {
  const cleaned = String(name || '').trim();
  if (!cleaned) return fallback;
  return cleaned.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}
