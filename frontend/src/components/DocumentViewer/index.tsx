import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Description, Visibility } from '@mui/icons-material';
import { documentApi } from '../../services/api';
import type { Document } from '../../types';

interface DocumentViewerProps {
  document: Document | null;
  onDocumentRendered?: (htmlContent: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onDocumentRendered,
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderDocument = useCallback(async () => {
    if (!document) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await documentApi.render(document.id);
      setHtmlContent(response.html_content);
      onDocumentRendered?.(response.html_content);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [document, onDocumentRendered]);

  useEffect(() => {
    if (document && document.status === 'uploaded') {
      renderDocument();
    }
  }, [document, renderDocument]);

  if (!document) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 4,
          textAlign: 'center',
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Visibility sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Document Selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload a DOCX file to view its content
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Document Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Description color="primary" />
          <Typography variant="h6">{document.filename}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={document.status}
            color={
              document.status === 'ready' ? 'success' :
              document.status === 'scanning' ? 'warning' :
              document.status === 'remediating' ? 'info' : 'default'
            }
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            Uploaded: {new Date(document.upload_date).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>

      {/* Document Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {htmlContent && !isLoading && (
          <Box
            sx={{
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                color: 'text.primary',
                fontWeight: 600,
                mb: 1,
              },
              '& p': {
                mb: 1,
                lineHeight: 1.6,
              },
              '& ul, & ol': {
                mb: 1,
                pl: 2,
              },
              '& li': {
                mb: 0.5,
              },
              '& table': {
                borderCollapse: 'collapse',
                width: '100%',
                mb: 2,
              },
              '& th, & td': {
                border: '1px solid',
                borderColor: 'divider',
                p: 1,
              },
              '& th': {
                backgroundColor: 'grey.100',
                fontWeight: 600,
              },
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </Box>
    </Paper>
  );
}; 