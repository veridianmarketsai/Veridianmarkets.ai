// Lambda: POST /heatmap/events
// Receives batches of interaction events from heatmap_tracker.jsx and
// writes them to DynamoDB. Deployed as an AWS Lambda function with a
// public HTTP API Gateway route (no auth needed — fire-and-forget from clients).
//
// DynamoDB table:  vm-heatmap-events
// Partition key:   page  (String)
// Sort key:        sk    (String)  →  "{timestamp}#{sessionId}#{rand6}"
// TTL attribute:   expiry (Number) →  Unix seconds, auto-deletes after 90 days

import { DynamoDBClient, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const db     = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const TABLE  = process.env.TABLE_NAME || 'vm-heatmap-events';
const TTL_S  = 90 * 24 * 3600;   // 90-day retention

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-VM-Key',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export const handler = async (event) => {
  // Preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS };
  }

  let events;
  try {
    events = JSON.parse(event.body || '[]');
    if (!Array.isArray(events)) events = [events];
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'invalid JSON' }) };
  }

  if (!events.length) return { statusCode: 200, headers: CORS, body: '{"ok":true}' };

  // Cap to 100 events per batch to guard against abuse.
  const items = events.slice(0, 100).map(ev => {
    const rand = Math.random().toString(36).slice(2, 8);
    const sk   = `${ev.ts || Date.now()}#${ev.sid || 'anon'}#${rand}`;
    return {
      PutRequest: {
        Item: marshall({
          page:   ev.page   || 'unknown',
          sk,
          t:      ev.t      || 'unknown',
          x:      ev.x      ?? null,
          y:      ev.y      ?? null,
          ts:     ev.ts     || Date.now(),
          sid:    ev.sid    || 'anon',
          sw:     ev.sw     || null,
          sh:     ev.sh     || null,
          el:     ev.el     || null,
          dur:    ev.dur    || null,
          depth:  ev.depth  || null,
          maxDepth: ev.maxDepth || null,
          n:      ev.n      || null,
          len:    ev.len    || null,
          expiry: Math.floor(Date.now() / 1000) + TTL_S,
        }, { removeUndefinedValues: true }),
      },
    };
  });

  // BatchWriteItem accepts max 25 items at a time.
  for (let i = 0; i < items.length; i += 25) {
    await db.send(new BatchWriteItemCommand({
      RequestItems: { [TABLE]: items.slice(i, i + 25) },
    }));
  }

  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, stored: items.length }) };
};
