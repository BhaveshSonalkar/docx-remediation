export interface Document {
  id: string;
  filename: string;
  file_path: string;
  upload_date: string;
  status: 'uploaded' | 'scanning' | 'ready' | 'remediating';
}

export interface AccessibilityIssue {
  id: string;
  document_id: string;
  clause: string;
  description: string;
  status: string;
  wcag_level: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: Record<string, any>;
  element_xpath: string;
  is_fixed: boolean;
}

export interface StagedChange {
  id: string;
  issue_id: string;
  original_content: string;
  new_content: string;
  change_type: 'manual' | 'suggested';
  created_at: string;
  is_fixed?: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ScanResponse {
  scan_results: AccessibilityIssue[];
  document_id: string;
  total_issues: number;
}
