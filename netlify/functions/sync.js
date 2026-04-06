import { getStore } from '@netlify/blobs';

const BLOB_KEY = 'rlp-state';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function respond(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

export const handler = async (event) => {
  const method = event.httpMethod;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  try {
    const store = getStore('rlp-dashboard');

    if (method === 'GET') {
      const raw = await store.get(BLOB_KEY);

      if (raw === null || raw === undefined) {
        return respond(200, { state: null, message: 'No state found' });
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }

      return respond(200, { state: parsed });
    }

    if (method === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return respond(400, { error: 'Invalid JSON body' });
      }

      const stateToStore = body.state !== undefined ? body.state : body;
      const serialized = JSON.stringify(stateToStore);

      await store.set(BLOB_KEY, serialized);

      return respond(200, { success: true, message: 'State stored successfully' });
    }

    return respond(405, { error: `Method ${method} not allowed` });
  } catch (err) {
    console.error('[sync] Error:', err);
    return respond(500, { error: 'Internal server error', details: err.message });
  }
};
