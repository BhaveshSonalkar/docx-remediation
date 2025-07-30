import { useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
} from '@mui/material';
import { Accessibility } from '@mui/icons-material';
import { theme } from './theme';
import { DocumentUploader } from './components/DocumentUploader';
import { DocumentViewer } from './components/DocumentViewer';
import { IssuePanel } from './components/IssuePanel';
import { IssueDetail } from './components/IssueDetail';
import { StagedChangesBar } from './components/StagedChangesBar';
import type { Document, AccessibilityIssue, StagedChange } from './types';

function App() {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<AccessibilityIssue | null>(null);
  const [stagedChanges, setStagedChanges] = useState<StagedChange[]>([]);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

  const handleDocumentUploaded = (document: Document) => {
    setCurrentDocument(document);
    setSelectedIssue(null);
    setStagedChanges([]);
  };

  const handleIssueSelect = (issue: AccessibilityIssue) => {
    setSelectedIssue(issue);
  };

  const handleFixSave = (issueId: string, newContent: string) => {
    const issue = selectedIssue;
    if (!issue) return;

    const change: StagedChange = {
      id: `change_${Date.now()}`,
      issue_id: issueId,
      original_content: issue.details.original_content || '',
      new_content: newContent,
      change_type: 'manual',
      created_at: new Date().toISOString(),
    };

    setStagedChanges(prev => [...prev, change]);
  };

  const handleApplyChanges = async () => {
    setIsApplyingChanges(true);
    // TODO: Implement backend call to apply changes
    setTimeout(() => {
      setIsApplyingChanges(false);
      setStagedChanges([]);
    }, 2000);
  };

  const handleClearChanges = () => {
    setStagedChanges([]);
  };

  const handleRemoveChange = (changeId: string) => {
    setStagedChanges(prev => prev.filter(change => change.id !== changeId));
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
                  onDocumentRendered={(htmlContent) => {
                    console.log('Document rendered:', htmlContent.length, 'characters');
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
      </Box>
    </ThemeProvider>
  );
}

export default App;
