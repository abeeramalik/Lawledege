export const LIMITS = {
  nameMin: 2,
  nameMax: 60,
  passwordMin: 8,
  bioMax: 500,
  locationMax: 80,
  postMax: 2000,
  reelCaptionMax: 300,
  reelLinkMax: 500,
  commentMax: 500,
  messageMax: 1000,
  helpTitleMax: 120,
  helpDescriptionMax: 1000,
  broadcastTitleMax: 100,
  broadcastBodyMax: 800,
  challengeTitleMax: 100,
  challengeDescriptionMax: 500,
  maxPostMediaBytes: 50 * 1024 * 1024,
  maxReelMediaBytes: 80 * 1024 * 1024,
};

export const allowedCities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Multan', 'Faisalabad', 'Peshawar', 'Quetta'];
export const allowedUrgency = ['urgent', 'normal', 'low'];
export const allowedRoles = ['user', 'volunteer', 'admin'];
export const allowedBroadcastTargets = ['all', 'user', 'volunteer'];
export const allowedPostTypes = ['Activity Update', 'Awareness', 'Gratitude', 'Success Story'];
export const allowedAvailability = ['Available', 'Busy', 'On Leave'];

export function onlyDigits(value = '') {
  return String(value || '').replace(/\D/g, '');
}

export function normalizeText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function cleanMultiline(value = '') {
  return String(value || '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

export function validateFullName(value, { required = true } = {}) {
  const name = normalizeText(value);
  if (!name) return required ? 'Full name is required.' : '';
  if (name.length < LIMITS.nameMin) return 'Full name must be at least 2 characters.';
  if (name.length > LIMITS.nameMax) return `Full name cannot be more than ${LIMITS.nameMax} characters.`;
  if (/\d/.test(name)) return 'Full name cannot contain digits.';
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ .'-]+$/.test(name)) return 'Full name can only contain letters, spaces, dot, apostrophe, or hyphen.';
  return '';
}

export function validateEmail(value) {
  const email = normalizeText(value).toLowerCase();
  if (!email) return 'Email is required.';
  if (email.length > 254) return 'Email is too long.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Enter a valid email address.';
  return '';
}

export function validatePassword(value, { login = false } = {}) {
  const password = String(value || '');
  if (!password) return 'Password is required.';
  if (login) return '';
  if (password.length < LIMITS.passwordMin) return `Password must be at least ${LIMITS.passwordMin} characters.`;
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/\d/.test(password)) return 'Password must include at least one number.';
  return '';
}

export function validatePhone(value, { required = true } = {}) {
  const phone = onlyDigits(value);
  if (!phone) return required ? 'Phone number is required.' : '';
  if (phone.length !== 11) return 'Phone number must be exactly 11 digits.';
  if (!phone.startsWith('03')) return 'Phone number must be a Pakistani mobile number starting with 03.';
  return '';
}

export function validateCNIC(value, { required = true } = {}) {
  const cnic = onlyDigits(value);
  if (!cnic) return required ? 'CNIC is required.' : '';
  if (cnic.length !== 13) return 'CNIC must be exactly 13 digits.';
  return '';
}

export function validateCity(value, { required = true } = {}) {
  const city = normalizeText(value);
  if (!city) return required ? 'City is required.' : '';
  if (!allowedCities.includes(city)) return 'Please select a valid city from the list.';
  return '';
}

export function validateShortLocation(value, { required = false, label = 'Location' } = {}) {
  const text = normalizeText(value);
  if (!text) return required ? `${label} is required.` : '';
  if (text.length > LIMITS.locationMax) return `${label} cannot be more than ${LIMITS.locationMax} characters.`;
  if (/[<>]/.test(text)) return `${label} cannot contain < or > characters.`;
  return '';
}

export function validateBio(value, { required = false } = {}) {
  const text = cleanMultiline(value);
  if (!text) return required ? 'Bio is required.' : '';
  if (text.length > LIMITS.bioMax) return `Bio cannot be more than ${LIMITS.bioMax} characters.`;
  return '';
}

export function validateOneOf(value, allowed, label) {
  if (!allowed.includes(value)) return `${label} is invalid.`;
  return '';
}

export function validatePositiveInteger(value, { min = 1, max = 999, label = 'Number' } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n)) return `${label} must be a whole number.`;
  if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
  return '';
}

export function validateFutureDateTime(value, { required = false } = {}) {
  if (!value) return required ? 'Date/time is required.' : '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Date/time is invalid.';
  if (d.getTime() < Date.now() - 60_000) return 'Date/time cannot be in the past.';
  return '';
}

export function validateTextLength(value, { required = false, max = 1000, min = 1, label = 'Text' } = {}) {
  const text = cleanMultiline(value);
  if (!text) return required ? `${label} is required.` : '';
  if (text.length < min) return `${label} must be at least ${min} character${min === 1 ? '' : 's'}.`;
  if (text.length > max) return `${label} cannot be more than ${max} characters.`;
  return '';
}

export function validateUrl(value, { required = false, imageOnly = false, label = 'URL', max = 500 } = {}) {
  const url = normalizeText(value);
  if (!url) return required ? `${label} is required.` : '';
  if (url.length > max) return `${label} cannot be more than ${max} characters.`;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return 'Only http/https URLs are allowed.';
    if (imageOnly && !/\.(jpg|jpeg|png|webp|gif)(\?|#|$)/i.test(parsed.pathname + parsed.search)) return 'Image URL must end with JPG, PNG, WEBP, or GIF.';
    return '';
  } catch {
    return `Enter a valid ${label.toLowerCase()}.`;
  }
}

export function validateReelExternalUrl(value, { required = false } = {}) {
  const error = validateUrl(value, { required, label: 'Reel link', max: LIMITS.reelLinkMax });
  if (error) return error;
  const url = normalizeText(value);
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const path = `${parsed.pathname}${parsed.search}`;
    const allowedHosts = ['youtube.com', 'youtu.be', 'facebook.com', 'fb.watch', 'instagram.com', 'tiktok.com'];
    const isAllowedPlatform = allowedHosts.some(domain => host === domain || host.endsWith(`.${domain}`));
    const isDirectMedia = /\.(mp4|webm|mov|ogg|jpg|jpeg|png|webp|gif)(\?|#|$)/i.test(path);
    if (!isAllowedPlatform && !isDirectMedia) return 'Reel link must be from YouTube, Facebook, Instagram, TikTok, or a direct video/image link.';
    return '';
  } catch {
    return 'Enter a valid reel link.';
  }
}

export function validateMediaFile(file, { reel = false } = {}) {
  if (!file) return reel ? 'Reels/Stories must include a short video or image.' : '';
  const isImage = file.type?.startsWith('image/');
  const isVideo = file.type?.startsWith('video/');
  if (!isImage && !isVideo) return 'Only image or video files are allowed.';
  const max = reel ? LIMITS.maxReelMediaBytes : LIMITS.maxPostMediaBytes;
  if (file.size > max) return `Media file is too large. Maximum allowed is ${Math.round(max / 1024 / 1024)}MB.`;
  return '';
}

export function firstValidationError(errors) {
  return errors.find(Boolean) || '';
}

export function normalizeRegistrationForm(form) {
  return {
    name: normalizeText(form.name),
    email: normalizeText(form.email).toLowerCase(),
    password: String(form.password || ''),
    phone: onlyDigits(form.phone).slice(0, 11),
    cnic: onlyDigits(form.cnic).slice(0, 13),
    city: normalizeText(form.city),
    bio: cleanMultiline(form.bio),
    skills: Array.isArray(form.skills) ? form.skills : [],
  };
}

export function validateRegistrationStep(step, role, form) {
  const f = normalizeRegistrationForm(form);
  if (step === 1) return validateOneOf(role, ['user', 'volunteer'], 'Role');
  if (step === 2) return firstValidationError([
    validateFullName(f.name),
    validateEmail(f.email),
    validatePassword(f.password),
    validatePhone(f.phone),
  ]);
  if (step === 3) return firstValidationError([
    validateCity(f.city),
    validateCNIC(f.cnic),
  ]);
  if (step === 4 && role === 'volunteer') return firstValidationError([
    f.skills.length === 0 ? 'Select at least one volunteer skill.' : '',
    validateBio(f.bio, { required: true }),
  ]);
  return '';
}

export function validateRegistrationForm(role, form) {
  const f = normalizeRegistrationForm(form);
  return firstValidationError([
    validateOneOf(role, ['user', 'volunteer'], 'Role'),
    validateFullName(f.name),
    validateEmail(f.email),
    validatePassword(f.password),
    validatePhone(f.phone),
    validateCity(f.city),
    validateCNIC(f.cnic),
    role === 'volunteer' && f.skills.length === 0 ? 'Select at least one volunteer skill.' : '',
    role === 'volunteer' ? validateBio(f.bio, { required: true }) : validateBio(f.bio, { required: false }),
  ]);
}

export function validatePostPayload({ mode, content, location, type, mediaFile, externalUrl }) {
  const isReel = mode === 'reel';
  const hasExternalUrl = !!normalizeText(externalUrl);
  return firstValidationError([
    validateOneOf(mode, ['post', 'reel'], 'Post mode'),
    isReel ? '' : validateOneOf(type, allowedPostTypes, 'Post type'),
    validateTextLength(content, { required: true, max: isReel ? LIMITS.reelCaptionMax : LIMITS.postMax, label: isReel ? 'Caption' : 'Post content' }),
    validateShortLocation(location, { required: false, label: 'Location' }),
    isReel && !mediaFile && !hasExternalUrl ? 'Reels/Stories must include an uploaded short video/photo or a Facebook/YouTube reel link.' : '',
    mediaFile ? validateMediaFile(mediaFile, { reel: isReel }) : '',
    hasExternalUrl ? (isReel ? validateReelExternalUrl(externalUrl) : validateUrl(externalUrl, { label: 'Attached link', max: LIMITS.reelLinkMax })) : '',
    mediaFile && hasExternalUrl ? 'Use either uploaded media or an external link, not both.' : '',
  ]);
}

export function validateHelpRequest(form) {
  return firstValidationError([
    validateTextLength(form.title, { required: true, max: LIMITS.helpTitleMax, min: 5, label: 'Help request title' }),
    validateTextLength(form.description, { required: true, max: LIMITS.helpDescriptionMax, min: 1, label: 'Description' }),
    validateCity(form.city),
    validateShortLocation(form.area, { required: true, label: 'Area / address hint' }),
    validatePositiveInteger(Number(form.volunteers_needed), { min: 1, max: 10, label: 'Volunteers needed' }),
    validateOneOf(form.urgency, allowedUrgency, 'Urgency'),
    validateFutureDateTime(form.date_time, { required: false }),
  ]);
}

export function validateBroadcast(form) {
  return firstValidationError([
    validateTextLength(form.title, { required: true, max: LIMITS.broadcastTitleMax, min: 3, label: 'Notification title' }),
    validateTextLength(form.body, { required: true, max: LIMITS.broadcastBodyMax, min: 5, label: 'Notification message' }),
    validateOneOf(form.target_role, allowedBroadcastTargets, 'Notification target'),
  ]);
}

export function validateChallenge(form) {
  return firstValidationError([
    validateTextLength(form.title, { required: true, max: LIMITS.challengeTitleMax, min: 3, label: 'Challenge title' }),
    validateTextLength(form.description, { required: false, max: LIMITS.challengeDescriptionMax, label: 'Challenge description' }),
    validatePositiveInteger(Number(form.target), { min: 1, max: 1000, label: 'Challenge target' }),
  ]);
}

export function validateProfileEdit(form, { volunteer = false } = {}) {
  return firstValidationError([
    validateBio(form.bio, { required: volunteer }),
    validateShortLocation(form.location, { required: false, label: 'Location' }),
    validateOneOf(form.availability || 'Available', allowedAvailability, 'Availability'),
    volunteer && (!Array.isArray(form.skills) || form.skills.length === 0) ? 'Select at least one volunteer skill.' : '',
  ]);
}
