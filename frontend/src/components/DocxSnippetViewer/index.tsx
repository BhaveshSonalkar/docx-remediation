import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { renderAsync } from 'docx-preview';

interface DocxSnippetViewerProps {
  base64Data: string;
  title: string;
  variant?: 'original' | 'fixed';
}

export const DocxSnippetViewer: React.FC<DocxSnippetViewerProps> = ({
  base64Data,
  title,
  variant = 'original'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  useEffect(() => {
    const renderSnippet = async () => {
      if (!base64Data || !containerRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        // Clear previous content
        containerRef.current.innerHTML = '';
        
        // Convert base64 to ArrayBuffer
        const arrayBuffer = base64ToArrayBuffer(base64Data);
        
        // Render DOCX snippet
        await renderAsync(arrayBuffer, containerRef.current);
        setIsLoading(false);
      } catch (err) {
        console.error('Error rendering DOCX snippet:', err);
        setError(`Failed to render ${title.toLowerCase()}`);
        setIsLoading(false);
      }
    };

    renderSnippet();
  }, [base64Data, title]);

  const getBorderColor = () => {
    switch (variant) {
      case 'original':
        return 'error.200';
      case 'fixed':
        return 'success.200';
      default:
        return 'divider';
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'original':
        return 'error.50';
      case 'fixed':
        return 'success.50';
      default:
        return 'background.paper';
    }
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          minHeight: '120px',
          position: 'relative'
        }}
      >
        {isLoading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '80px' 
          }}>
            <Typography variant="body2" color="text.secondary">
              Rendering {title.toLowerCase()}...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        <Box
          ref={containerRef}
          sx={{
            '& .docx-wrapper': {
              fontFamily: 'inherit',
              lineHeight: 1.4,
              fontSize: '0.875rem'
            },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              margin: '0.5rem 0',
              fontWeight: 600,
            },
            '& p': {
              margin: '0.25rem 0',
              lineHeight: 1.4,
            },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              fontSize: '0.75rem'
            },
            '& th, & td': {
              border: '1px solid',
              borderColor: 'divider',
              padding: '0.25rem',
            },
            '& th': {
              backgroundColor: 'grey.100',
              fontWeight: 600,
            }
          }}
        />
      </Paper>
    </Box>
  );
};