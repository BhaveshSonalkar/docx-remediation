import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Divider,
  Container,
  AppBar,
  Toolbar,
  Chip,
} from '@mui/material';
import { ArrowBack, CompareArrows } from '@mui/icons-material';
import { DocxSnippetViewer } from '../DocxSnippetViewer';

interface DiffViewState {
  originalContent: string;
  newContent: string;
  title: string;
  docxSnippets?: {
    original: string;
    fixed: string;
  };
  issueId?: string;
  issueDescription?: string;
}

export const DiffView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as DiffViewState;

  if (!state) {
    navigate('/');
    return null;
  }

  const { originalContent, newContent, title, docxSnippets, issueDescription } = state;
  const hasChanges = originalContent !== newContent;
  const hasDocxSnippets = docxSnippets?.original && docxSnippets?.fixed;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <CompareArrows sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          {hasChanges && (
            <Chip
              label="Modified"
              color="warning"
              size="small"
              variant="outlined"
              sx={{ mr: 1 }}
            />
          )}
          {hasDocxSnippets && (
            <Chip
              label="DOCX Preview"
              color="info"
              size="small"
              variant="outlined"
            />
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Issue Information */}
        {issueDescription && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Issue Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {issueDescription}
            </Typography>
          </Paper>
        )}

        {/* Side-by-side Comparison */}
        <Paper elevation={2} sx={{ overflow: 'hidden', height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Original Content */}
            <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'error.50', 
                borderBottom: 1, 
                borderColor: 'error.200' 
              }}>
                <Typography variant="h6" color="error.main">
                  Original
                </Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1, overflow: 'auto', backgroundColor: 'error.25' }}>
                {hasDocxSnippets ? (
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <DocxSnippetViewer
                      base64Data={docxSnippets.original}
                      title=""
                      variant="original"
                      compact={false}
                    />
                  </Box>
                ) : (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      lineHeight: 1.6
                    }}
                  >
                    {originalContent || 'No content'}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Vertical Divider */}
            <Divider 
              orientation="vertical" 
              flexItem 
              sx={{ 
                borderWidth: 2,
                borderColor: 'grey.400',
                backgroundColor: 'grey.400'
              }} 
            />

            {/* Fixed Content */}
            <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'success.50', 
                borderBottom: 1, 
                borderColor: 'success.200' 
              }}>
                <Typography variant="h6" color="success.main">
                  Fixed
                </Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1, overflow: 'auto', backgroundColor: 'success.25' }}>
                {hasDocxSnippets ? (
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <DocxSnippetViewer
                      base64Data={docxSnippets.fixed}
                      title=""
                      variant="fixed"
                      compact={false}
                    />
                  </Box>
                ) : (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      lineHeight: 1.6
                    }}
                  >
                    {newContent || 'No content'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>

        {!hasChanges && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No changes detected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The original and fixed content are identical.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};