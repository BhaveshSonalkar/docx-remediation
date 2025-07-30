import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
} from '@mui/material';
import { CompareArrows } from '@mui/icons-material';
import { DocxSnippetViewer } from '../DocxSnippetViewer';

interface DiffViewerProps {
  originalContent: string;
  newContent: string;
  title?: string;
  docxSnippets?: {
    original: string;
    fixed: string;
  };
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalContent,
  newContent,
  title = 'Changes Preview',
  docxSnippets
}) => {
  const hasChanges = originalContent !== newContent;
  const hasDocxSnippets = docxSnippets?.original && docxSnippets?.fixed;

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <CompareArrows color="primary" />
        <Typography variant="subtitle2">{title}</Typography>
        {hasChanges && (
          <Chip
            label="Modified"
            color="warning"
            size="small"
            variant="outlined"
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
      </Box>

      {hasDocxSnippets ? (
        // DOCX Snippet Preview
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <DocxSnippetViewer
            base64Data={docxSnippets.original}
            title="Original"
            variant="original"
          />
          <DocxSnippetViewer
            base64Data={docxSnippets.fixed}
            title="Fixed"
            variant="fixed"
          />
        </Box>
      ) : (
        // Text-based Preview (fallback)
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {/* Original Content */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Original
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: 'error.50',
              borderColor: 'error.200',
              minHeight: '100px',
              wordBreak: 'break-word',
            }}
          >
            <Typography variant="body2" color="error.main">
              {originalContent || 'No content'}
            </Typography>
          </Paper>
        </Box>

        {/* New Content */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            New
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: 'success.50',
              borderColor: 'success.200',
              minHeight: '100px',
              wordBreak: 'break-word',
            }}
          >
            <Typography variant="body2" color="success.main">
              {newContent || 'No content'}
            </Typography>
          </Paper>
                 </Box>
       </Box>
      )}

      {!hasChanges && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No changes detected
          </Typography>
        </Box>
      )}
    </Paper>
  );
}; 