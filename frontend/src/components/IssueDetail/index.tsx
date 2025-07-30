import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  TextField,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore,
  Edit,
  Save,
  Cancel,
  Warning,
  Info,
  Error,
  AutoFixHigh,
  Visibility,
} from '@mui/icons-material';
import { DiffViewer } from '../DiffViewer';
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
  const [showDiffPreview, setShowDiffPreview] = useState(false);

  React.useEffect(() => {
    if (issue) {
      setEditedContent(issue.details.original_content || '');
      setIsEditing(false);
      setError(null);
      setSuggestion(null);
      setShowDiffPreview(false);
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
      
      setShowDiffPreview(true);
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
    if (!issue || !editedContent.trim()) {
      setError('Fix content cannot be empty');
      return;
    }
    
    const changeType = suggestion ? 'suggested' : 'manual';
    onFixSave?.(issue.id, editedContent, changeType);
    setIsEditing(false);
    setError(null);
    
    // Reset suggestion state after saving
    setSuggestion(null);
    setShowDiffPreview(false);
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
        return <Warning color="action" />;
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
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
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

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Basic Info */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {issue.description}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <strong>WCAG Clause:</strong> {issue.clause}
        </Typography>

        {/* Issue Details */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2">Technical Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Element XPath
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {issue.element_xpath}
                </Typography>
              </Grid>
              {issue.details.contrast_ratio && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Contrast Ratio
                  </Typography>
                  <Typography variant="body2">
                    {issue.details.contrast_ratio} / {issue.details.required_ratio}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        {/* Fix Editor */}
        <Typography variant="subtitle2" gutterBottom>
          Fix Content
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* AI Suggestion Section */}
        {!isEditing && !suggestion && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleGetSuggestion}
              disabled={isLoadingSuggestion}
              startIcon={isLoadingSuggestion ? <CircularProgress size={16} /> : <AutoFixHigh />}
              sx={{ mb: 2 }}
            >
              {isLoadingSuggestion ? 'Getting AI Suggestion...' : 'Get AI Suggestion'}
            </Button>
          </Box>
        )}

        {/* AI Suggestion Display */}
        {suggestion && (
          <Box sx={{ mb: 2 }}>
            <Alert 
              severity="info" 
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setShowDiffPreview(!showDiffPreview)}
                  startIcon={<Visibility />}
                >
                  {showDiffPreview ? 'Hide' : 'Show'} Diff
                </Button>
              }
            >
              <Typography variant="subtitle2" gutterBottom>
                AI Suggestion (Confidence: {Math.round(suggestion.confidence * 100)}%)
              </Typography>
              <Typography variant="body2">
                {suggestion.suggested_text}
              </Typography>
            </Alert>

            {showDiffPreview && (
              <Box sx={{ mb: 2 }}>
                <DiffViewer
                  originalContent={issue?.details.original_content || ''}
                  newContent={editedContent}
                  title="Suggested Changes Preview"
                  docxSnippets={suggestion?.docx_snippets}
                />
              </Box>
            )}
          </Box>
        )}

        {isEditing || suggestion ? (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Enter the corrected content..."
              variant="outlined"
              size="small"
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
                  variant="outlined"
                  size="small"
                  onClick={handleEdit}
                  startIcon={<Edit />}
                >
                  Edit Suggestion
                </Button>
              )}
            </Box>
          </Box>
        ) : suggestion ? (
          <Box sx={{ mb: 2 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'success.50',
                borderColor: 'success.200',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" color="success.main">
                {editedContent || 'AI suggested content ready for review'}
              </Typography>
            </Paper>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
          <Box sx={{ mb: 2 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'grey.50',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Click "Get AI Suggestion" to automatically generate a fix, or "Edit Fix" to create a manual fix.
              </Typography>
            </Paper>
            <Button
              variant="outlined"
              size="small"
              onClick={handleEdit}
              startIcon={<Edit />}
              sx={{ mt: 1 }}
            >
              Edit Fix
            </Button>
          </Box>
        )}

        {/* Original Content */}
        {issue.details.original_content && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Original Content
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'error.50',
                borderColor: 'error.200',
              }}
            >
              <Typography variant="body2" color="error.main">
                {issue.details.original_content}
              </Typography>
            </Paper>
          </>
        )}
      </Box>
    </Paper>
  );
}; 