import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import { CompareArrows, OpenInNew } from '@mui/icons-material';
import { DocxSnippetViewer } from '../DocxSnippetViewer';

interface DiffViewerProps {
  originalContent: string;
  newContent: string;
  title?: string;
  docxSnippets?: {
    original: string;
    fixed: string;
  };
  issueId?: string;
  issueDescription?: string;
  compact?: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalContent,
  newContent,
  title = 'Changes Preview',
  docxSnippets,
  issueId,
  issueDescription,
  compact = false
}) => {
  const navigate = useNavigate();
  const hasChanges = originalContent !== newContent;
  const hasDocxSnippets = docxSnippets?.original && docxSnippets?.fixed;

  const handleOpenFullView = () => {
    navigate('/diff', {
      state: {
        originalContent,
        newContent,
        title,
        docxSnippets,
        issueId,
        issueDescription
      }
    });
  };

  return (
    <Paper elevation={1} sx={{ p: compact ? 1.5 : 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: compact ? 1 : 2 }}>
        <CompareArrows color="primary" />
        <Typography variant={compact ? "body2" : "subtitle2"} sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
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
        <Button
          size="small"
          variant="outlined"
          startIcon={<OpenInNew />}
          onClick={handleOpenFullView}
          sx={{ ml: 1 }}
        >
          Full View
        </Button>
      </Box>

      {hasDocxSnippets ? (
        // DOCX Snippet Preview
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          minHeight: compact ? '60px' : '120px',
          maxHeight: compact ? '120px' : '200px',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden'
        }}>
          <Box sx={{ flex: 1 }}>
            <DocxSnippetViewer
              base64Data={docxSnippets.original}
              title="Original"
              variant="original"
              compact={compact}
            />
          </Box>
          <Divider 
            orientation="vertical" 
            flexItem 
            sx={{ 
              borderWidth: 1,
              borderColor: 'grey.300',
              backgroundColor: 'grey.300'
            }} 
          />
          <Box sx={{ flex: 1 }}>
            <DocxSnippetViewer
              base64Data={docxSnippets.fixed}
              title="Fixed"
              variant="fixed"
              compact={compact}
            />
          </Box>
        </Box>
      ) : (
        // Text-based Preview (fallback)
        <Box sx={{ 
          display: 'flex',
          minHeight: compact ? '40px' : '80px',
          maxHeight: compact ? '80px' : '120px',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden'
        }}>
          {/* Original Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                p: compact ? 0.5 : 1, 
                backgroundColor: 'error.50', 
                borderBottom: 1, 
                borderColor: 'error.200' 
              }}
            >
              Original
            </Typography>
            <Box
              sx={{
                flex: 1,
                p: compact ? 0.5 : 2,
                backgroundColor: 'error.25',
                wordBreak: 'break-word',
                overflow: 'auto'
              }}
            >
              <Typography variant={compact ? "caption" : "body2"} color="error.main">
                {originalContent || 'No content'}
              </Typography>
            </Box>
          </Box>

          {/* Vertical Divider */}
          <Divider 
            orientation="vertical" 
            flexItem 
            sx={{ 
              borderWidth: 1,
              borderColor: 'grey.300',
              backgroundColor: 'grey.300'
            }} 
          />

          {/* New Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                p: compact ? 0.5 : 1, 
                backgroundColor: 'success.50', 
                borderBottom: 1, 
                borderColor: 'success.200' 
              }}
            >
              Fixed
            </Typography>
            <Box
              sx={{
                flex: 1,
                p: compact ? 0.5 : 2,
                backgroundColor: 'success.25',
                wordBreak: 'break-word',
                overflow: 'auto'
              }}
            >
              <Typography variant={compact ? "caption" : "body2"} color="success.main">
                {newContent || 'No content'}
              </Typography>
            </Box>
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