import { client } from './client';
import type { Report } from '../types';

export const generateReport = (analysisId: string): Promise<Report> =>
  client.post('/reports/generate', { analysisId }).then((r) => r.data);

export const getReports = (): Promise<Report[]> =>
  client.get('/reports').then((r) => r.data);

export const downloadReport = (id: string): void => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  window.open(`${baseURL}/reports/${id}/download`, '_blank');
};

export const emailReport = (id: string, email: string): Promise<{ message: string }> =>
  client.post(`/reports/${id}/email`, { email }).then((r) => r.data);
