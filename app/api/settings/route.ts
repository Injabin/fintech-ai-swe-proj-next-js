import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getCached, setCached } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export interface KeyHealth {
  keyName: string;
  provider: string;
  label: string;
  status: 'healthy' | 'missing' | 'error' | 'rate-limited';
  errorDetails?: string;
}

// Check function for Finnhub keys
async function checkFinnhubKey(key: string | undefined, keyName: string, label: string, bypassCache: boolean): Promise<KeyHealth> {
  if (!key) {
    return { keyName, provider: 'Finnhub', label, status: 'missing' };
  }

  const cacheKey = `finnhub_health_${key.slice(-6)}`;
  if (!bypassCache) {
    const cachedStatus = getCached<'healthy' | 'error' | 'rate-limited'>('settings', cacheKey);
    if (cachedStatus) {
      return { keyName, provider: 'Finnhub', label, status: cachedStatus };
    }
  }

  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${key}`);
    if (res.status === 200) {
      setCached('settings', cacheKey, 'healthy', 10 * 60 * 1000); // 10 min
      return { keyName, provider: 'Finnhub', label, status: 'healthy' };
    } else if (res.status === 429) {
      setCached('settings', cacheKey, 'rate-limited', 5 * 60 * 1000); // 5 min
      return { keyName, provider: 'Finnhub', label, status: 'rate-limited' };
    } else {
      setCached('settings', cacheKey, 'error', 10 * 60 * 1000); // 10 min
      return { keyName, provider: 'Finnhub', label, status: 'error' };
    }
  } catch (e: any) {
    return { keyName, provider: 'Finnhub', label, status: 'error', errorDetails: String(e.message || e) };
  }
}

// Check function for Alpha Vantage keys
async function checkAlphaVantageKey(key: string | undefined, keyName: string, label: string, bypassCache: boolean): Promise<KeyHealth> {
  if (!key) {
    return { keyName, provider: 'Alpha Vantage', label, status: 'missing' };
  }

  // To protect the free daily quota, cache for 12 hours.
  const cacheKey = `av_health_${key.slice(-6)}`;
  if (!bypassCache) {
    const cachedStatus = getCached<'healthy' | 'error' | 'rate-limited'>('settings', cacheKey);
    if (cachedStatus) {
      return { keyName, provider: 'Alpha Vantage', label, status: cachedStatus };
    }
  }

  // Basic syntax check: AV keys are alphanumeric, exactly 16 characters.
  if (!/^[A-Z0-9]{16}$/i.test(key)) {
    return { keyName, provider: 'Alpha Vantage', label, status: 'error', errorDetails: 'Invalid key format (must be 16 alphanumeric characters)' };
  }

  try {
    const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${key}`);
    if (!res.ok) {
      return { keyName, provider: 'Alpha Vantage', label, status: 'error', errorDetails: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data = await res.json();
    if (data.Note && data.Note.includes('API call frequency')) {
      setCached('settings', cacheKey, 'rate-limited', 10 * 60 * 1000); // 10 min limit
      return { keyName, provider: 'Alpha Vantage', label, status: 'rate-limited' };
    }
    if (data.Information && data.Information.includes('rate limit')) {
      setCached('settings', cacheKey, 'rate-limited', 60 * 60 * 1000); // 1 hour limit
      return { keyName, provider: 'Alpha Vantage', label, status: 'rate-limited' };
    }
    if (data['Error Message']) {
      setCached('settings', cacheKey, 'error', 24 * 60 * 60 * 1000); // 24 hour cache for invalid key
      return { keyName, provider: 'Alpha Vantage', label, status: 'error', errorDetails: data['Error Message'] };
    }
    if (data['Global Quote'] && data['Global Quote']['01. symbol']) {
      setCached('settings', cacheKey, 'healthy', 12 * 60 * 60 * 1000); // 12 hours
      return { keyName, provider: 'Alpha Vantage', label, status: 'healthy' };
    }
    return { keyName, provider: 'Alpha Vantage', label, status: 'error', errorDetails: 'Unexpected response format' };
  } catch (e: any) {
    return { keyName, provider: 'Alpha Vantage', label, status: 'error', errorDetails: String(e.message || e) };
  }
}

// Check function for Gemini
async function checkGeminiKey(key: string | undefined, keyName: string, label: string, bypassCache: boolean): Promise<KeyHealth> {
  if (!key) {
    return { keyName, provider: 'Gemini AI', label, status: 'missing' };
  }

  const cacheKey = `gemini_health_${key.slice(-6)}`;
  if (!bypassCache) {
    const cachedStatus = getCached<'healthy' | 'error' | 'rate-limited'>('settings', cacheKey);
    if (cachedStatus) {
      return { keyName, provider: 'Gemini AI', label, status: cachedStatus };
    }
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.list();
    if (response) {
      setCached('settings', cacheKey, 'healthy', 12 * 60 * 60 * 1000); // 12 hours
      return { keyName, provider: 'Gemini AI', label, status: 'healthy' };
    }
    return { keyName, provider: 'Gemini AI', label, status: 'error' };
  } catch (e: any) {
    const msg = String(e.message || e);
    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
      setCached('settings', cacheKey, 'rate-limited', 10 * 60 * 1000); // 10 min
      return { keyName, provider: 'Gemini AI', label, status: 'rate-limited' };
    }
    return { keyName, provider: 'Gemini AI', label, status: 'error', errorDetails: msg };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bypassCache = searchParams.get('refresh') === 'true';

  const results = await Promise.all([
    checkFinnhubKey(process.env.FINNHUB_API_KEY, 'FINNHUB_API_KEY', 'Key 1 (Primary)', bypassCache),
    checkFinnhubKey(process.env.FINNHUB_API_KEY_2, 'FINNHUB_API_KEY_2', 'Key 2 (Backup)', bypassCache),
    checkAlphaVantageKey(process.env.ALPHA_VANTAGE_API_KEY, 'ALPHA_VANTAGE_API_KEY', 'Key 1 (Primary)', bypassCache),
    checkAlphaVantageKey(process.env.ALPHA_VANTAGE_API_KEY_2, 'ALPHA_VANTAGE_API_KEY_2', 'Key 2 (Backup)', bypassCache),
    checkAlphaVantageKey(process.env.ALPHA_VANTAGE_API_KEY_3, 'ALPHA_VANTAGE_API_KEY_3', 'Key 3 (Backup)', bypassCache),
    checkAlphaVantageKey(process.env.ALPHA_VANTAGE_API_KEY_4, 'ALPHA_VANTAGE_API_KEY_4', 'Key 4 (Backup)', bypassCache),
    checkGeminiKey(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY', 'AI Copilot Key', bypassCache),
  ]);

  return Response.json({ keys: results });
}
