import { supabase } from '../supabase';

const cleanPayload = (payload = {}) => {
  const cleaned = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) cleaned[key] = value;
  });
  return cleaned;
};

/**
 * Save a volunteer profile without relying on Supabase upsert(onConflict: 'user_id').
 * Some existing databases were created without a UNIQUE/PK rule on volunteer_profiles.user_id,
 * so upsert can fail with: "no unique or exclusion constraint matching the ON CONFLICT specification".
 * This helper works with both old and fixed databases. The SQL migration still adds the correct
 * unique index after deduplicating old rows.
 */
export async function saveVolunteerProfile(userId, payload = {}) {
  if (!userId) throw new Error('Missing volunteer user id.');
  const dataToSave = cleanPayload(payload);

  const { data: existingRows, error: selectError } = await supabase
    .from('volunteer_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .limit(1);

  if (selectError) throw selectError;

  if (existingRows && existingRows.length > 0) {
    const { error: updateError } = await supabase
      .from('volunteer_profiles')
      .update(dataToSave)
      .eq('user_id', userId);
    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabase
    .from('volunteer_profiles')
    .insert({ user_id: userId, ...dataToSave });
  if (insertError) throw insertError;
}

export async function ensureVolunteerProfile(userId, payload = {}) {
  const defaults = {
    bio: null,
    skills: [],
    location: null,
    level: 'Newbie',
    availability: 'Available',
    points: 0,
    impact_score: 0,
    hours: 0,
    verified: false,
    show_contact: true,
    ...payload,
  };
  await saveVolunteerProfile(userId, defaults);
}
