import axios from 'axios';
import type { Document, AccessibilityIssue, ScanResponse } from '../types';

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

  // Get document file as ArrayBuffer for docx-preview
  getDocumentFile: async (documentId: string): Promise<ArrayBuffer> => {
    const response = await api.get(`/documents/${documentId}/file`, {
      responseType: 'arraybuffer',
    });
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

  // Get AI-suggested fix for an issue
  suggestFix: async (issueId: string): Promise<{
    issue_id: string;
    suggested_text: string;
    confidence: number;
    fix_type: string;
    old_value: string;
    new_value: string;
    element_xpath: string;
    docx_snippets?: {
      original: string;
      fixed: string;
    };
  }> => {
    const response = await api.post(`/issues/${issueId}/suggest-fix`);
    return response.data;
  },

  // Stage a change for an issue
  stageChange: async (issueId: string, newContent: string, changeType: 'manual' | 'suggested' = 'manual', fixedSnippet?: string | null): Promise<{
    change_id: string;
    issue_id: string;
    document_id: string;
    diff: {
      type: string;
      changes: Array<{
        line_number: number;
        type: 'added' | 'deleted' | 'modified';
        original: string;
        new: string;
      }>;
      summary: {
        total_changes: number;
        added_lines: number;
        deleted_lines: number;
        modified_lines: number;
      };
      preview: {
        original: string;
        new: string;
      };
    };
    status: string;
    created_at: string;
  }> => {
    const response = await api.post(`/issues/${issueId}/stage-change`, {
      new_content: newContent,
      change_type: changeType,
      fixed_snippet: fixedSnippet
    });
    return response.data;
  },
};

export const changesApi = {
  // Get all staged changes for a document
  getStagedChanges: async (documentId: string): Promise<{
    document_id: string;
    staged_changes: Array<{
      id: string;
      issue_id: string;
      original_content: string;
      new_content: string;
      change_type: 'manual' | 'suggested';
      created_at: string;
      status: string;
    }>;
    applied_changes: Array<{
      id: string;
      issue_id: string;
      change_type: 'manual' | 'suggested';
      applied_at: string;
      status: string;
    }>;
    summary: {
      total_changes: number;
      staged_count: number;
      applied_count: number;
    };
  }> => {
    const response = await api.get(`/changes/${documentId}`);
    return response.data;
  },

  // Apply all staged changes to a document
  applyChanges: async (documentId: string, changeIds?: string[]): Promise<{
    success: boolean;
    applied_changes: Array<{
      change_id: string;
      issue_id: string;
      change_type: 'manual' | 'suggested';
      applied_at: string;
      status: 'success' | 'failed';
      error?: string;
    }>;
    total_changes: number;
    docx_modification: {
      file_modified: boolean;
      backup_created: boolean;
      successfully_applied: number;
      failed_to_apply: number;
    };
    remediation_stats: {
      total_issues: number;
      fixed_issues: number;
      completion_rate: number;
    };
    message: string;
  }> => {
    const payload = changeIds ? { change_ids: changeIds } : {};
    console.log('DEBUG: API applyChanges called with:');
    console.log('DEBUG: - documentId:', documentId);
    console.log('DEBUG: - changeIds:', changeIds);
    console.log('DEBUG: - payload:', payload);
    
    const response = await api.post(`/documents/${documentId}/apply-changes`, payload);
    return response.data;
  },

  // Clear all staged changes for a document
  clearStagedChanges: async (documentId: string): Promise<{
    success: boolean;
    cleared_changes: number;
    message: string;
  }> => {
    const response = await api.post(`/changes/${documentId}/clear`);
    return response.data;
  },

  // Remove a specific staged change
  removeChange: async (changeId: string): Promise<{
    change_id: string;
    status: string;
  }> => {
    const response = await api.delete(`/changes/${changeId}`);
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
