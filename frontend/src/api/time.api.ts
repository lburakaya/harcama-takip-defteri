import { client } from './client';
import type { TimeResponse } from '../types';

export const getRealTime = (): Promise<TimeResponse> =>
  client.get('/time').then((r) => r.data);
