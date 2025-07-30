import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Warning,
  Info,
  Error,
  AutoFixHigh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { issuesApi } from '../../services/api';
import type { AccessibilityIssue } from '../../types';

interface IssueDetailProps {
  issue: AccessibilityIssue | null;
  onFixSave?: (issueId: string, newContent: string, changeType?: 'manual' | 'suggested') => void;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({
  issue,
  onFixSave,
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<{
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
  } | null>(null);


  React.useEffect(() => {
    if (issue) {
      setEditedContent(issue.details.original_content || '');
      setIsEditing(false);
      setError(null);
      setSuggestion(null);
    }
  }, [issue]);

  const handleGetSuggestion = async () => {
    if (!issue) return;

    setIsLoadingSuggestion(true);
    setError(null);

    try {
      const suggestionData = await issuesApi.suggestFix(issue.id);
      setSuggestion(suggestionData);
      
      // Set the suggested content as the edited content
      if (suggestionData.new_value) {
        setEditedContent(suggestionData.new_value);
      }
    } catch (err) {
      setError(`Failed to get AI suggestion: ${err}`);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(issue?.details.original_content || '');
    setError(null);
  };

  const handleSave = () => {
    if (!issue || !editedContent.trim()) return;

    const changeType = suggestion ? 'suggested' : 'manual';
    onFixSave?.(issue.id, editedContent, changeType);
    setIsEditing(false);
    setSuggestion(null);
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
        return <Info color="disabled" />;
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

  if (!issue) {
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
        <Info sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Issue Selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select an accessibility issue to view details
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {getIssueIcon(issue.wcag_level)}
          <Typography variant="h6">Issue Details</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={issue.wcag_level}
            color={getIssueColor(issue.wcag_level) as 'info' | 'warning' | 'error' | 'default'}
            size="small"
            variant="outlined"
          />
          <Chip
            label={issue.status}
            color={issue.is_fixed ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </Box>

      {/* Issue Description */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {issue.description}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>WCAG Clause:</strong> {issue.clause}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          <strong>Element:</strong> {issue.element_xpath}
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Original Content Section */}
        {issue.details.original_content && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Original Content
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'grey.50',
                maxHeight: '80px',
                overflow: 'auto',
                wordBreak: 'break-word',
              }}
            >
              <Typography variant="body2">
                {issue.details.original_content}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* AI Suggestion Section */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            AI Assistance
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {!suggestion ? (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleGetSuggestion}
              disabled={isLoadingSuggestion}
              startIcon={isLoadingSuggestion ? <CircularProgress size={16} /> : <AutoFixHigh />}
              fullWidth
            >
              {isLoadingSuggestion ? 'Getting AI Suggestion...' : 'Get AI Suggestion'}
            </Button>
          ) : (
            <Box>
              <Alert 
                severity="info" 
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  AI Suggestion (Confidence: {Math.round(suggestion.confidence * 100)}%)
                </Typography>
                <Typography variant="body2">
                  {suggestion.suggested_text}
                </Typography>
              </Alert>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/diff', {
                  state: {
                    originalContent: issue?.details.original_content || '',
                    newContent: editedContent,
                    title: 'AI Suggested Changes',
                    docxSnippets: suggestion?.docx_snippets,
                    issueDescription: issue?.description
                  }
                })}
                sx={{ mb: 2 }}
                fullWidth
              >
                View Full Diff
              </Button>
            </Box>
          )}
        </Box>

        {/* Fix Content Section */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Fix Content
          </Typography>
          
          {isEditing ? (
            <Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Enter the corrected content..."
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  startIcon={<Save />}
                >
                  {suggestion ? 'Stage Suggested Fix' : 'Stage Manual Fix'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCancel}
                  startIcon={<Cancel />}
                >
                  Cancel
                </Button>
                {suggestion && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setEditedContent(suggestion.new_value)}
                    startIcon={<AutoFixHigh />}
                  >
                    Reset to AI Suggestion
                  </Button>
                )}
              </Box>
            </Box>
          ) : suggestion ? (
            <Box>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: 'success.50',
                  borderColor: 'success.200',
                  minHeight: '60px',
                  mb: 2,
                }}
              >
                <Typography variant="body2" color="success.main">
                  {editedContent || 'AI suggested content ready for review'}
                </Typography>
              </Paper>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  startIcon={<Save />}
                >
                  Stage Suggested Fix
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleEdit}
                  startIcon={<Edit />}
                >
                  Edit Suggestion
                </Button>
              </Box>
            </Box>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={handleEdit}
              startIcon={<Edit />}
              fullWidth
            >
              Create Manual Fix
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};