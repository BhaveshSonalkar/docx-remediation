import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { CloudUpload, Description } from '@mui/icons-material';
import { documentApi } from '../../services/api';
import type { Document } from '../../types';

interface DocumentUploaderProps {
  onDocumentUploaded: (document: Document) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onDocumentUploaded,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setError('Please select a valid DOCX file');
        return;
      }
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const document = await documentApi.upload(uploadedFile);
      onDocumentUploaded(document);
      setUploadedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setUploadedFile(file);
      setError(null);
    } else {
      setError('Please drop a valid DOCX file');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        textAlign: 'center',
        border: '2px dashed',
        borderColor: uploadedFile ? 'primary.main' : 'grey.300',
        backgroundColor: uploadedFile ? 'primary.50' : 'background.paper',
        transition: 'all 0.3s ease',
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        accept=".docx"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="file-upload"
      />

      <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        Upload DOCX Document
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Drag and drop a DOCX file here, or click to browse
      </Typography>

      {uploadedFile && (
        <Box sx={{ mb: 2 }}>
          <Chip
            icon={<Description />}
            label={uploadedFile.name}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <label htmlFor="file-upload">
          <Button
            variant="outlined"
            component="span"
            disabled={isUploading}
          >
            Browse Files
          </Button>
        </label>
        
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!uploadedFile || isUploading}
          startIcon={isUploading ? <CircularProgress size={20} /> : undefined}
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </Box>
    </Paper>
  );
}; 