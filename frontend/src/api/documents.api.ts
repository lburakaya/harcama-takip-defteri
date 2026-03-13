import { client } from './client';
import type { Document } from '../types';

export const uploadDocument = (formData: FormData): Promise<Document> =>
  client.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const getDocuments = (): Promise<Document[]> =>
  client.get('/documents').then((r) => r.data);

export const getDocument = (id: string): Promise<Document & { parsedExpenseCount?: number }> =>
  client.get(`/documents/${id}`).then((r) => r.data);

export const deleteDocument = (id: string): Promise<void> =>
  client.delete(`/documents/${id}`).then((r) => r.data);

export const reparseDocument = (id: string): Promise<{ message: string }> =>
  client.post(`/documents/${id}/reparse`).then((r) => r.data);
