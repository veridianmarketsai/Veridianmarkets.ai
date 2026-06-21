// Lambda: GET /heatmap/events
// Returns filtered heatmap events for the admin dashboard.
// Protected by a shared secret header: X-VM-Admin-Key
// (set the same value in ADMIN_KEY env var and in HeatmapAdmin.jsx).
//
// Query params:
//   page    — page name or "all"  (default: all)
//   since   — epoch ms cutoff     (default: last 24 h)
//   type    — comma-separated event types to include (optional)
//   limit   — max rows returned   (default: 2000, max: 5000)

import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const db    = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const TABLE = process.env.TABLE_NAME  || 'vm-heatmap-events';
const KEY   = process.env.ADMIN_KEY   || '';    // set a strong random string in Lambda env vars

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-VM-Admin-Key',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS };
  }

  // Auth check — reject missing or wrong key.
  const provided = event.headers?.['x-vm-admin-key'] || event.headers?.['X-VM-Admin-Key'] || '';
  if (KEY && provided !== KEY) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'forbidden' }) };
  }

  const qs     = event.queryStringParameters || {};
  const page   = qs.page  || 'all';
  const since  = parseInt(qs.since  || String(Date.now() - 86_400_000));
  const limit  = Math.min(5000, parseInt(qs.limit || '2000'));
  const types  = qs.type ? new Set(qs.type.split(',')) : null;

  // Sort-key lower bound: we store sk as "{ts}#..." so string comparison works.
  const skMin = `${since}#`;

  let items = [];

  if (page !== 'all') {
    // Efficient key query for a single page.
    const res = await db.send(new QueryCommand({
      TableName:                 TABLE,
      KeyConditionExpression:    'page = :p AND sk >= :sk',
      ExpressionAttributeValues: {
        ':p':  { S: page },
        ':sk': { S: skMin },
      },
      Limit:             limit,
      ScanIndexForward:  false,   // newest first
    }));
    items = (res.Items || []).map(unmarshall);
  } else {
    // Full scan when "all pages" selected — acceptable for admin-only use.
    const res = await db.send(new ScanCommand({
      TableName:                 TABLE,
      FilterExpression:          'ts >= :since',
      ExpressionAttributeValues: { ':since': { N: String(since) } },
      Limit:                     limit,
    }));
    items = (res.Items || []).map(unmarshall);
  }

  // Optional type filter applied in-memory (avoids expensive GSI for v1).
  if (types) items = items.filter(e => types.has(e.t));

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ events: items, count: items.length }),
  };
};
