import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { renderAsync } from 'docx-preview';

interface DocxSnippetViewerProps {
  base64Data: string;
  title: string;
  variant?: 'original' | 'fixed';
  compact?: boolean;
}

export const DocxSnippetViewer: React.FC<DocxSnippetViewerProps> = ({
  base64Data,
  title,
  variant = 'original',
  compact = false
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {title && (
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {title}
        </Typography>
      )}
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          p: compact ? 0.5 : 2,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          minHeight: compact ? '40px' : '200px',
          maxHeight: compact ? '100px' : undefined,
          position: 'relative',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {isLoading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: compact ? '30px' : '80px'
          }}>
            <Typography variant={compact ? "caption" : "body2"} color="text.secondary">
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
            flex: 1,
            overflow: 'auto',
            '& .docx-wrapper': {
              fontFamily: 'inherit',
              lineHeight: compact ? 1.2 : 1.4,
              fontSize: compact ? '0.65rem' : '0.875rem'
            },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              margin: compact ? '0.2rem 0' : '0.5rem 0',
              fontWeight: 600,
              fontSize: compact ? '0.7rem' : undefined,
            },
            '& p': {
              margin: compact ? '0.1rem 0' : '0.25rem 0',
              lineHeight: compact ? 1.2 : 1.4,
            },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              fontSize: compact ? '0.6rem' : '0.75rem'
            },
            '& th, & td': {
              border: '1px solid',
              borderColor: 'divider',
              padding: compact ? '0.1rem' : '0.25rem',
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