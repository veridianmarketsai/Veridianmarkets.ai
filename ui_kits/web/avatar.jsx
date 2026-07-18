// Veridian Markets — profile photo upload (vm-avatar-upload Lambda → S3).
// Same shape as billing.jsx: a config object + one function, global via
// Object.assign so AccountSettings.jsx can call it with no local wiring.

const VM_AVATAR = {
  apiBase: 'https://tjm2rqjtjljgikdlucblj3kiyq0brefs.lambda-url.us-east-1.on.aws/',   // vm-avatar-upload Lambda
};

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

Object.assign(window, { VM_AVATAR, vmUploadAvatar });
