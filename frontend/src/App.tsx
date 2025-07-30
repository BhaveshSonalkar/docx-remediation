import React, { useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Modal,
  IconButton,
} from '@mui/material';
import { Accessibility, Close } from '@mui/icons-material';
import { theme } from './theme';
import { DocumentUploader } from './components/DocumentUploader';
import { DocumentViewer } from './components/DocumentViewer';
import { IssuePanel } from './components/IssuePanel';
import { IssueDetail } from './components/IssueDetail';
import { StagedChangesBar } from './components/StagedChangesBar';
import { DocxSnippetViewer } from './components/DocxSnippetViewer';
import { issuesApi, changesApi } from './services/api';
import type { Document, AccessibilityIssue, StagedChange } from './types';

function App() {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<AccessibilityIssue | null>(null);
  const [stagedChanges, setStagedChanges] = useState<StagedChange[]>([]);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [diffViewData, setDiffViewData] = useState<{
    originalContent: string;
    newContent: string;
    title: string;
    docxSnippets?: {
      original: string;
      fixed: string;
    };
    issueDescription?: string;
  } | null>(null);

  const handleDocumentUploaded = (document: Document) => {
    setCurrentDocument(document);
    setSelectedIssue(null);
    setStagedChanges([]);
  };

  const handleIssueSelect = (issue: AccessibilityIssue) => {
    setSelectedIssue(issue);
  };

  const handleFixSave = async (issueId: string, newContent: string, changeType: 'manual' | 'suggested' = 'manual') => {
    const issue = selectedIssue;
    if (!issue || !currentDocument) return;

    try {
      // Stage the change with the backend
      const stagedChange = await issuesApi.stageChange(issueId, newContent, changeType);
      
      // Create local staged change object
      const change: StagedChange = {
        id: stagedChange.change_id,
        issue_id: issueId,
        original_content: issue.details.original_content || '',
        new_content: newContent,
        change_type: changeType,
        created_at: stagedChange.created_at,
      };

      setStagedChanges(prev => [...prev, change]);
      
      // Show success feedback (optional)
      console.log('Change staged successfully:', stagedChange);
      
    } catch (error) {
      console.error('Failed to stage change:', error);
      // You could add error handling UI here
    }
  };

  const handleApplyChanges = async () => {
    if (!currentDocument) return;

    setIsApplyingChanges(true);
    
    try {
      // Apply all staged changes to the document
      const result = await changesApi.applyChanges(currentDocument.id);
      
      if (result.success) {
        // Clear staged changes on successful application
        setStagedChanges([]);
        
        // Show success message
        console.log('Changes applied successfully:', result.message);
        console.log('DOCX file modified:', result.docx_modification);
        console.log('Remediation stats:', result.remediation_stats);
        
        // You could show a success toast/notification here
      } else {
        console.error('Failed to apply changes:', result);
      }
      
    } catch (error) {
      console.error('Error applying changes:', error);
      // You could show an error toast/notification here
    } finally {
      setIsApplyingChanges(false);
    }
  };

  const handleClearChanges = async () => {
    if (!currentDocument) return;

    try {
      // Clear staged changes on the backend
      await changesApi.clearStagedChanges(currentDocument.id);
      
      // Clear local staged changes
      setStagedChanges([]);
      
      console.log('All staged changes cleared');
    } catch (error) {
      console.error('Failed to clear staged changes:', error);
      // Still clear local changes even if backend fails
      setStagedChanges([]);
    }
  };

  const handleRemoveChange = async (changeId: string) => {
    try {
      // Remove staged change from backend
      await changesApi.removeChange(changeId);
      
      // Remove from local state
      setStagedChanges(prev => prev.filter(change => change.id !== changeId));
      
      console.log('Staged change removed:', changeId);
    } catch (error) {
      console.error('Failed to remove staged change:', error);
      // Still remove locally even if backend fails
      setStagedChanges(prev => prev.filter(change => change.id !== changeId));
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* App Bar */}
        <AppBar position="static">
          <Toolbar>
            <Accessibility sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              DOCX Accessibility Remediation
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ flex: 1, py: 3, pb: stagedChanges.length > 0 ? 12 : 3 }}>
          {!currentDocument ? (
            // Upload View
            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
              <Typography variant="h4" gutterBottom textAlign="center">
                Welcome to DOCX Accessibility Remediation
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
                Upload a Microsoft Word document to scan for accessibility issues and get remediation suggestions.
              </Typography>
              <DocumentUploader onDocumentUploaded={handleDocumentUploaded} />
            </Box>
          ) : (
            // Document View
            <Grid container spacing={3} sx={{ height: 'calc(100vh - 140px)' }}>
              {/* Document Viewer */}
              <Grid item xs={12} md={6}>
                <DocumentViewer 
                  document={currentDocument}
                  selectedIssue={selectedIssue}
                  onDocumentRendered={() => {
                    console.log('Document rendered successfully');
                  }}
                />
              </Grid>

              {/* Issue Panel */}
              <Grid item xs={12} md={3}>
                <IssuePanel
                  document={currentDocument}
                  onIssueSelect={handleIssueSelect}
                  selectedIssueId={selectedIssue?.id}
                />
              </Grid>

              {/* Issue Detail */}
              <Grid item xs={12} md={3}>
                <IssueDetail
                  issue={selectedIssue}
                  onFixSave={handleFixSave}
                  onDiffViewOpen={setDiffViewData}
                />
              </Grid>
            </Grid>
          )}
        </Container>

        {/* Staged Changes Bar */}
        <StagedChangesBar
          stagedChanges={stagedChanges}
          onApplyChanges={handleApplyChanges}
          onClearChanges={handleClearChanges}
          onRemoveChange={handleRemoveChange}
          isApplying={isApplyingChanges}
        />

        {/* Diff View Overlay */}
        {diffViewData && (
          <DiffViewOverlay
            data={diffViewData}
            onClose={() => setDiffViewData(null)}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}

// Diff View Overlay Component
interface DiffViewOverlayProps {
  data: {
    originalContent: string;
    newContent: string;
    title: string;
    docxSnippets?: {
      original: string;
      fixed: string;
    };
    issueDescription?: string;
  };
  onClose: () => void;
}

const DiffViewOverlay: React.FC<DiffViewOverlayProps> = ({ data, onClose }) => {
  return (
    <Modal
      open={true}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={onClose}
              sx={{ mr: 2 }}
            >
              <Close />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {data.title}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Container maxWidth="xl" sx={{ py: 3, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {/* Issue Information */}
          {data.issueDescription && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Issue Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.issueDescription}
              </Typography>
            </Box>
          )}

          {/* Side-by-side Comparison */}
          <Box
            sx={{
              display: 'flex',
              height: data.issueDescription ? 'calc(100vh - 200px)' : 'calc(100vh - 140px)',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {/* Original Content */}
            <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'error.50',
                  borderBottom: 1,
                  borderColor: 'error.200',
                }}
              >
                <Typography variant="h6" color="error.main">
                  Original
                </Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1, overflow: 'auto', backgroundColor: 'error.25' }}>
                {data.docxSnippets ? (
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <DocxSnippetViewer
                      base64Data={data.docxSnippets.original}
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
                      lineHeight: 1.6,
                    }}
                  >
                    {data.originalContent || 'No content'}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Vertical Divider */}
            <Box
              sx={{
                width: '2px',
                backgroundColor: 'grey.400',
              }}
            />

            {/* Fixed Content */}
            <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'success.50',
                  borderBottom: 1,
                  borderColor: 'success.200',
                }}
              >
                <Typography variant="h6" color="success.main">
                  Fixed
                </Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1, overflow: 'auto', backgroundColor: 'success.25' }}>
                {data.docxSnippets ? (
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <DocxSnippetViewer
                      base64Data={data.docxSnippets.fixed}
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
                      lineHeight: 1.6,
                    }}
                  >
                    {data.newContent || 'No content'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Modal>
  );
};

export default App;
