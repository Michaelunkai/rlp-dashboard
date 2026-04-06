// heartbeat.js - Connection status indicator endpoint
// Returns online status and last sync timestamp

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let lastSync = new Date().toISOString();

  // Try to read lastSync from Netlify Blobs if available
  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore('rlp-state');
    const stored = await store.get('last-sync-timestamp', { type: 'text' });
    if (stored) {
      lastSync = stored;
    }
  } catch (e) {
    // Netlify Blobs not available or key not set — use current timestamp
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      online: true,
      lastSync,
      version: '1.0.0'
    })
  };
};
