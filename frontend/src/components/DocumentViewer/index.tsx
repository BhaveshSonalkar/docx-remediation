import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import { Description, Visibility } from '@mui/icons-material';
import { renderAsync } from 'docx-preview';
import { documentApi } from '../../services/api';
import type { Document, AccessibilityIssue } from '../../types';

interface DocumentViewerProps {
  document: Document | null;
  selectedIssue?: AccessibilityIssue | null;
  onDocumentRendered?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  selectedIssue,
  onDocumentRendered,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDocumentRendered, setIsDocumentRendered] = useState(false);
  const documentContainerRef = useRef<HTMLDivElement>(null);

  // Utility function to get WCAG level color
  const getWcagColor = (wcagLevel: string) => {
    switch (wcagLevel) {
      case 'A':
        return '#2196f3'; // Blue
      case 'AA':
        return '#ff9800'; // Orange
      case 'AAA':
        return '#f44336'; // Red
      default:
        return '#9c27b0'; // Purple for unknown
    }
  };

  // Function to convert DOCX XPath to CSS selector for HTML rendered by docx-preview
  const convertXPathToSelector = useCallback((xpath: string): string | null => {
    try {
      // Handle common DOCX XPath patterns and convert to CSS selectors
      // docx-preview typically renders:
      // - w:p elements as <p> tags
      // - w:r elements as <span> tags  
      // - w:t elements contain the text content
      // - w:tbl elements as <table> tags
      
      // Pattern: //w:tbl[n] -> table:nth-of-type(n) (handle tables first)
      let selector = xpath.replace(/\/\/w:tbl\[(\d+)\]/g, 'table:nth-of-type($1)');
      
      // Pattern: //w:p[n] -> p:nth-of-type(n)
      selector = selector.replace(/\/\/w:p\[(\d+)\]/g, 'p:nth-of-type($1)');
      
      // Pattern: //w:p[n]/w:r[m] -> p:nth-of-type(n) span:nth-of-type(m)
      selector = selector.replace(/\/w:r\[(\d+)\]/g, ' span:nth-of-type($1)');
      
      // Pattern: //w:p[n]/w:r[m]/w:t -> p:nth-of-type(n) span:nth-of-type(m)
      selector = selector.replace(/\/w:t/g, '');
      
      // Handle table sub-patterns: /w:tr[m]/w:tc[k]/w:p[l]
      selector = selector.replace(/\/w:tr\[(\d+)\]/g, ' tr:nth-of-type($1)');
      selector = selector.replace(/\/w:tc\[(\d+)\]/g, ' td:nth-of-type($1)');
      
      // Clean up any remaining w: prefixes
      selector = selector.replace(/w:/g, '');
      
      return selector;
    } catch (error) {
      console.warn('Failed to convert XPath to CSS selector:', error);
      return null;
    }
  }, []);

  // Function to find element by converted CSS selector
  const findElementBySelector = useCallback((xpath: string, container: HTMLElement): HTMLElement | null => {
    try {
      const selector = convertXPathToSelector(xpath);
      if (!selector) {
        console.warn('Could not convert XPath to CSS selector:', xpath);
        return null;
      }
      
      console.log('Converted XPath:', xpath, 'to selector:', selector);
      const element = container.querySelector(selector) as HTMLElement;
      
      if (!element) {
        console.warn('Element not found with selector:', selector);
        return null;
      }
      
      return element;
    } catch (error) {
      console.warn('CSS selector query failed:', error);
      return null;
    }
  }, [convertXPathToSelector]);

  // Function to find element by text content as fallback
  const findElementByContent = useCallback((content: string, container: HTMLElement): HTMLElement | null => {
    try {
      // Use TreeWalker to find text nodes
      const walker = window.document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent?.trim() === content.trim()) {
          // Return the parent element that contains this text
          return node.parentElement;
        }
      }
      
      // Fallback: partial text match
      const elements = container.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, td, th');
      for (const element of elements) {
        if (element.textContent?.includes(content.trim())) {
          return element as HTMLElement;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Content-based search failed:', error);
      return null;
    }
  }, []);

  // Updated function to find elements with multiple strategies
  const findTargetElement = useCallback((issue: AccessibilityIssue, container: HTMLElement): HTMLElement | null => {
    // Strategy 1: Try CSS selector conversion from XPath
    if (issue.element_xpath) {
      const element = findElementBySelector(issue.element_xpath, container);
      if (element) {
        console.log('Found element using CSS selector for:', issue.element_xpath);
        return element;
      }
    }
    
    // Strategy 2: Try content-based matching if we have original content
    const originalContent = issue.details?.original_content;
    if (originalContent) {
      const element = findElementByContent(originalContent, container);
      if (element) {
        console.log('Found element using content matching for:', originalContent);
        return element;
      }
    }
    
    console.warn('Could not find element for issue:', issue.id, issue.description);
    return null;
  }, [findElementBySelector, findElementByContent]);

  // Function to highlight an element
  const highlightElement = useCallback((element: HTMLElement, issue: AccessibilityIssue) => {
    const color = getWcagColor(issue.wcag_level);
    
    // Add highlighting styles
    element.style.outline = `3px solid ${color}`;
    element.style.outlineOffset = '2px';
    element.style.backgroundColor = `${color}20`; // 20% opacity
    element.style.position = 'relative';
    element.style.zIndex = '10';
    
    // Add data attributes for identification
    element.setAttribute('data-highlighted-issue', issue.id);
    element.setAttribute('data-wcag-level', issue.wcag_level);
    
    // Add tooltip functionality
    element.title = `${issue.description} (${issue.wcag_level})`;
    
    // Scroll element into view
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }, []);

  // Function to remove highlights
  const removeHighlights = useCallback((container: HTMLElement) => {
    const highlightedElements = container.querySelectorAll('[data-highlighted-issue]');
    highlightedElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.outline = '';
      htmlElement.style.outlineOffset = '';
      htmlElement.style.backgroundColor = '';
      htmlElement.style.position = '';
      htmlElement.style.zIndex = '';
      htmlElement.removeAttribute('data-highlighted-issue');
      htmlElement.removeAttribute('data-wcag-level');
      htmlElement.removeAttribute('title');
    });
  }, []);

  // Effect to handle issue highlighting
  useEffect(() => {
    if (!documentContainerRef.current || !isDocumentRendered) return;

    // Remove existing highlights
    removeHighlights(documentContainerRef.current);

    // Add new highlight if issue is selected
    if (selectedIssue) {
      const targetElement = findTargetElement(selectedIssue, documentContainerRef.current);
      if (targetElement) {
        highlightElement(targetElement, selectedIssue);
      } else {
        console.warn('Could not find target element for issue:', selectedIssue.id);
      }
    }
  }, [selectedIssue, isDocumentRendered, highlightElement, removeHighlights, findTargetElement]);

  const renderDocument = useCallback(async () => {
    if (!document) {
      console.log('No document provided');
      return;
    }
    
    if (!documentContainerRef.current) {
      console.log('Document container ref not ready');
      return;
    }

    console.log('Starting document render for:', document.filename);
    setIsLoading(true);
    setError(null);
    setIsDocumentRendered(false);

    try {
      // Get the document file data as ArrayBuffer
      console.log('Fetching document file...');
      const arrayBuffer = await documentApi.getDocumentFile(document.id);
      console.log('Document file fetched, size:', arrayBuffer.byteLength);
      
      // Clear previous content
      documentContainerRef.current.innerHTML = '';
      
      // Render DOCX using docx-preview
      console.log('Rendering document with docx-preview...');
      await renderAsync(arrayBuffer, documentContainerRef.current);
      console.log('Document rendered successfully');
      
      setIsDocumentRendered(true);
      onDocumentRendered?.();
    } catch (err) {
      console.error('Error rendering document:', err);
      setError(`Failed to render document: ${String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [document, onDocumentRendered]);

  useEffect(() => {
    if (document && document.status === 'uploaded') {
      // Add a small delay to ensure the DOM ref is ready
      const timer = setTimeout(() => {
        renderDocument();
      }, 100);
      return () => clearTimeout(timer);
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

        {/* Always render the container div, but conditionally show content */}
        <Box
          ref={documentContainerRef}
          sx={{
            minHeight: '200px',
            // Base document styles (only apply when document is rendered)
            ...(isDocumentRendered && {
              '& .docx-wrapper': {
                fontFamily: 'inherit',
                lineHeight: 1.6,
              },
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
              // Styles for highlighted elements
              '& [data-highlighted-issue]': {
                transition: 'all 0.3s ease-in-out',
                cursor: 'help',
              },
              '& [data-highlighted-issue]:hover': {
                transform: 'scale(1.02)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              },
            }),
          }}
        >
          {!isDocumentRendered && !isLoading && !error && document && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Document ready to render
              </Typography>
              <Button
                variant="contained"
                onClick={renderDocument}
              >
                Render Document
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}; 