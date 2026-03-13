import { useEffect, useCallback } from 'react';
import { useTimeStore } from '../store/timeStore';
import { getRealTime } from '../api/time.api';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useRealTime() {
  const { realDate, realTime, timestamp, unixtime, source, lastFetched, setTime } = useTimeStore();

  const fetchTime = useCallback(async () => {
    try {
      const data = await getRealTime();
      setTime({
        date: data.date,
        time: data.time,
        timestamp: data.timestamp,
        unixtime: data.unixtime,
        source: data.source,
      });
    } catch {
      // Fallback to system time if API fails
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0];
      setTime({
        date,
        time,
        timestamp: now.toISOString(),
        unixtime: Math.floor(now.getTime() / 1000),
        source: 'fallback',
      });
    }
  }, [setTime]);

  useEffect(() => {
    // Fetch on mount if not fetched or stale
    const shouldFetch = !lastFetched || (Date.now() - lastFetched) > REFRESH_INTERVAL;
    if (shouldFetch) {
      fetchTime();
    }

    // Refresh periodically
    const interval = setInterval(fetchTime, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTime, lastFetched]);

  // Parse current year/month/day from realDate
  const currentYear = realDate ? parseInt(realDate.split('-')[0]) : new Date().getFullYear();
  const currentMonth = realDate ? parseInt(realDate.split('-')[1]) : new Date().getMonth() + 1;
  const currentDay = realDate ? parseInt(realDate.split('-')[2]) : new Date().getDate();

  return {
    realDate,
    realTime,
    timestamp,
    unixtime,
    source,
    currentYear,
    currentMonth,
    currentDay,
    fetchTime,
  };
}
