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
import { issuesApi, changesApi } from './services/api';
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
