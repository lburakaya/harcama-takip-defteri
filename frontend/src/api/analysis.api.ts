import { client } from './client';
import type { Analysis } from '../types';

export const startDailyAnalysis = (date: string): Promise<Analysis> =>
  client.post('/analysis/daily', { date }).then((r) => r.data);

export const startMonthlyAnalysis = (year: number, month: number): Promise<Analysis> =>
  client.post('/analysis/monthly', { year, month }).then((r) => r.data);

export const startDocumentAnalysis = (documentId: string): Promise<Analysis> =>
  client.post('/analysis/document', { documentId }).then((r) => r.data);

export const getAnalysisList = (): Promise<Analysis[]> =>
  client.get('/analysis').then((r) => r.data);

export const getAnalysisDetail = (id: string): Promise<Analysis> =>
  client.get(`/analysis/${id}`).then((r) => r.data);

export const createAnalysisStream = (analysisId: string): EventSource => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  return new EventSource(`${baseURL}/analysis/${analysisId}/stream`);
};
