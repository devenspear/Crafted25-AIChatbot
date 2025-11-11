/**
 * Vercel KV Client Configuration
 * Handles environment variable prefix (crafted_)
 */

import { createClient } from '@vercel/kv';

// Check for prefixed environment variables
const KV_REST_API_URL =
  process.env.crafted_KV_REST_API_URL ||
  process.env.KV_REST_API_URL;

const KV_REST_API_TOKEN =
  process.env.crafted_KV_REST_API_TOKEN ||
  process.env.KV_REST_API_TOKEN;

// Create KV client
export const kv = KV_REST_API_URL && KV_REST_API_TOKEN
  ? createClient({
      url: KV_REST_API_URL,
      token: KV_REST_API_TOKEN,
    })
  : null;

// Export flag to check if KV is available
export const isKVAvailable = kv !== null;
