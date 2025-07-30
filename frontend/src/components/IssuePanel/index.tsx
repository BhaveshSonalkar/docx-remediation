import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  BugReport,
} from '@mui/icons-material';
import { issuesApi, documentApi } from '../../services/api';
import type { AccessibilityIssue, Document } from '../../types';

interface IssuePanelProps {
  document: Document | null;
  onIssueSelect?: (issue: AccessibilityIssue) => void;
  selectedIssueId?: string;
}

export const IssuePanel: React.FC<IssuePanelProps> = ({
  document,
  onIssueSelect,
  selectedIssueId,
}) => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const loadIssues = useCallback(async () => {
    if (!document) return;

    setIsLoading(true);
    setError(null);

    try {
      const documentIssues = await issuesApi.getDocumentIssues(document.id);
      setIssues(documentIssues);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [document]);

  useEffect(() => {
    if (document) {
      loadIssues();
    }
  }, [document, loadIssues]);

  const handleScanDocument = async () => {
    if (!document) return;

    setIsScanning(true);
    setError(null);

    try {
      await documentApi.scan(document.id);
      await loadIssues(); // Reload issues after scan
    } catch (err) {
      setError(String(err));
    } finally {
      setIsScanning(false);
    }
  };

  const getIssueIcon = (wcagLevel: string) => {
    switch (wcagLevel) {
      case 'A':
        return <Info color="info" />;
      case 'AA':
        return <Warning color="warning" />;
      case 'AAA':
        return <Error color="error" />;
      default:
        return <BugReport color="action" />;
    }
  };

  const getIssueColor = (wcagLevel: string) => {
    switch (wcagLevel) {
      case 'A':
        return 'info';
      case 'AA':
        return 'warning';
      case 'AAA':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!document) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 3,
          textAlign: 'center',
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <BugReport sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Document Selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload a document to view accessibility issues
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Accessibility Issues</Typography>
          <Chip
            label={`${issues.length} issues`}
            color={issues.length > 0 ? 'warning' : 'success'}
            size="small"
          />
        </Box>
        
        {document.status === 'uploaded' && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleScanDocument}
            disabled={isScanning}
            startIcon={isScanning ? <CircularProgress size={16} /> : undefined}
          >
            {isScanning ? 'Scanning...' : 'Scan Document'}
          </Button>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {!isLoading && !error && issues.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No accessibility issues found
            </Typography>
          </Box>
        )}

        {!isLoading && !error && issues.length > 0 && (
          <List sx={{ p: 0 }}>
            {issues.map((issue, index) => (
              <React.Fragment key={issue.id}>
                <ListItem
                  button
                  selected={selectedIssueId === issue.id}
                  onClick={() => onIssueSelect?.(issue)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>
                    {getIssueIcon(issue.wcag_level)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {issue.description}
                        </Typography>
                        <Chip
                          label={issue.wcag_level}
                          color={getIssueColor(issue.wcag_level) as 'info' | 'warning' | 'error' | 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {issue.clause}
                        </Typography>
                        {issue.is_fixed && (
                          <Chip
                            label="Fixed"
                            color="success"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < issues.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}; 