import axios from 'axios';
import type { Document, AccessibilityIssue, DocumentRenderResponse, ScanResponse } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const documentApi = {
  // Upload a DOCX file
  upload: async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Map backend upload response to frontend Document interface
    const { document_id, filename, status } = response.data;
    return {
      id: document_id,
      filename,
      status,
      file_path: '',
      upload_date: new Date().toISOString(),
    };
  },

  // Get all documents
  list: async (): Promise<Document[]> => {
    const response = await api.get('/documents');
    return response.data;
  },

  // Render document to HTML
  render: async (documentId: string): Promise<DocumentRenderResponse> => {
    const response = await api.get(`/documents/${documentId}/render`);
    return response.data;
  },

  // Scan document for accessibility issues
  scan: async (documentId: string): Promise<ScanResponse> => {
    const response = await api.get(`/documents/${documentId}/scan`);
    return response.data;
  },
};

export const issuesApi = {
  // Get all issues for a document
  getDocumentIssues: async (documentId: string): Promise<AccessibilityIssue[]> => {
    const response = await api.get(`/issues/${documentId}`);
    return response.data;
  },
};

export const healthApi = {
  // Health check
  check: async (): Promise<{ status: string; service: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
