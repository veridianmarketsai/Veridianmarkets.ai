// Veridian Markets — Media upload Lambda
// Returns a presigned S3 PUT URL so the browser can upload a video directly
// to S3 without passing the file through this function.
//
// GET  ?filename=founder-video.mp4&type=video/mp4
// Response: { uploadUrl: "https://s3.presigned...", publicUrl: "https://cdn.example.com/..." }
//
// Environment variables required:
//   BUCKET_NAME      — S3 bucket name (e.g. "vm-media")
//   CDN_BASE_URL     — public base URL for the bucket (e.g. "https://vm-media.s3.amazonaws.com"
//                      or your CloudFront domain)
//   VM_ADMIN_KEY     — secret key; must match X-VM-Admin-Key header sent from the browser

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-VM-Admin-Key',
};

const ok  = (body) => ({ statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const err = (code, msg) => ({ statusCode: code, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: msg }) });

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  // Admin key guard — reuse the same env var pattern as heatmap-query.
  const adminKey = process.env.VM_ADMIN_KEY;
  if (adminKey) {
    const sent = (event.headers || {})['x-vm-admin-key'] || '';
    if (sent !== adminKey) return err(401, 'Unauthorised');
  }

  const { filename = 'video.mp4', type = 'video/mp4' } = event.queryStringParameters || {};
  const bucket = process.env.BUCKET_NAME;
  const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');

  if (!bucket) return err(500, 'BUCKET_NAME not configured');

  // Store under a fixed key so re-uploads replace the previous file.
  const key = `founder-video/${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  const command = new PutObjectCommand({
    Bucket:      bucket,
    Key:         key,
    ContentType: type,
  });

  // Presigned URL expires in 15 minutes — plenty for a single upload.
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  const publicUrl = `${cdnBase}/${key}`;

  return ok({ uploadUrl, publicUrl });
};
