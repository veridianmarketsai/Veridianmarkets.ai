// Veridian Markets — profile photo upload (vm-avatar-upload Lambda → S3).
// Same shape as billing.jsx: a config object + one function, global via
// Object.assign so AccountSettings.jsx can call it with no local wiring.

const VM_AVATAR = {
  apiBase: 'https://tjm2rqjtjljgikdlucblj3kiyq0brefs.lambda-url.us-east-1.on.aws/',   // vm-avatar-upload Lambda
  bucket: 'veridianmarkets-avatars',
  region: 'us-east-1',
};

// The deterministic public S3 URL for a user's avatar (vm-avatar-upload always
// writes to key `avatars/<sub>.jpg`, overwritten on re-upload) — lets any
// signed-in device show the real photo without needing localStorage to have
// seen it first. Whether the file actually exists is discovered by the <img>
// loading or firing onError (a plain <img> tag doesn't need bucket CORS,
// unlike a `fetch()` HEAD check would).
function vmAvatarS3Url(sub) {
  return sub ? `https://${VM_AVATAR.bucket}.s3.${VM_AVATAR.region}.amazonaws.com/avatars/${sub}.jpg` : '';
}

// Upload an already-resized data URL (from vmResizeImageFile) to S3 via the
// Lambda. Returns { ok:true, url } with the real S3 URL on success, or
// { ok:false, error } — the caller falls back to a local-only (localStorage)
// copy when this fails or isn't configured.
async function vmUploadAvatar(dataUrl) {
  if (!VM_AVATAR.apiBase) return { ok: false, error: 'not configured' };
  let session = null; try { session = JSON.parse(localStorage.getItem('vm_session') || 'null'); } catch {}
  if (!session || !session.access) return { ok: false, error: 'not signed in' };
  try {
    const res = await fetch(VM_AVATAR.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access}` },
      body: JSON.stringify({ image: dataUrl }),
    });
    const data = await res.json();
    if (data.url) return { ok: true, url: data.url };
    return { ok: false, error: data.error || 'upload failed' };
  } catch { return { ok: false, error: 'network error' }; }
}

// Deletes the real S3 object (best-effort — silently no-ops if not
// configured/signed in, so "Remove" always at least clears the local copy).
// Without this, a "removed" photo would reappear on next load from the real
// S3 URL that vmAvatarS3Url() always tries first.
async function vmDeleteAvatar() {
  if (!VM_AVATAR.apiBase) return { ok: false, error: 'not configured' };
  let session = null; try { session = JSON.parse(localStorage.getItem('vm_session') || 'null'); } catch {}
  if (!session || !session.access) return { ok: false, error: 'not signed in' };
  try {
    const res = await fetch(VM_AVATAR.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access}` },
      body: JSON.stringify({ action: 'delete' }),
    });
    const data = await res.json();
    return data.ok ? { ok: true } : { ok: false, error: data.error || 'delete failed' };
  } catch { return { ok: false, error: 'network error' }; }
}

Object.assign(window, { VM_AVATAR, vmAvatarS3Url, vmUploadAvatar, vmDeleteAvatar });
