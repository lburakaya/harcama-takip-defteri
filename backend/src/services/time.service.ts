import axios from 'axios';
import { env } from '../config/env';
import { redis } from '../config/redis';

interface TimeResponse {
  timestamp: string;
  date: string;
  time: string;
  timezone: string;
  unixtime: number;
  source: 'api' | 'fallback';
}

export async function getRealTime(): Promise<TimeResponse> {
  // Check Redis cache first
  try {
    const cached = await redis.get('real_time');
    if (cached) {
      const parsed = JSON.parse(cached);
      // Only use cache if less than 30 seconds old
      if (Date.now() - parsed.cachedAt < 30000) {
        return parsed;
      }
    }
  } catch { /* ignore cache errors */ }

  try {
    const response = await axios.get(env.TIME_API_URL, { timeout: 3000 });
    const data = response.data;

    const result: TimeResponse = {
      timestamp: data.datetime || data.utc_datetime,
      date: data.datetime?.split('T')[0] || new Date().toISOString().split('T')[0],
      time: data.datetime?.split('T')[1]?.split('.')[0] || new Date().toTimeString().split(' ')[0],
      timezone: data.timezone || 'Europe/Istanbul',
      unixtime: data.unixtime || Math.floor(Date.now() / 1000),
      source: 'api',
    };

    // Cache in Redis for 30 seconds
    try {
      await redis.setex('real_time', 30, JSON.stringify({ ...result, cachedAt: Date.now() }));
    } catch { /* ignore */ }

    return result;
  } catch {
    // Fallback to system time
    const now = new Date();
    return {
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      timezone: 'Europe/Istanbul',
      unixtime: Math.floor(now.getTime() / 1000),
      source: 'fallback',
    };
  }
}
