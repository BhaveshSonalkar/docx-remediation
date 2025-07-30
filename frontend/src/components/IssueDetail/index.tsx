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
} from '@mui/material';
import {
  ExpandMore,
  Edit,
  Save,
  Cancel,
  Warning,
  Info,
  Error,
} from '@mui/icons-material';
import type { AccessibilityIssue } from '../../types';

interface IssueDetailProps {
  issue: AccessibilityIssue | null;
  onFixSave?: (issueId: string, newContent: string) => void;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({
  issue,
  onFixSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (issue) {
      setEditedContent(issue.details.original_content || '');
      setIsEditing(false);
      setError(null);
    }
  }, [issue]);

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
    
    onFixSave?.(issue.id, editedContent);
    setIsEditing(false);
    setError(null);
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

        {isEditing ? (
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
                Save Fix
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCancel}
                startIcon={<Cancel />}
              >
                Cancel
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
                {editedContent || 'No fix content available'}
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