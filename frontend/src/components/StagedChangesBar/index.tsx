import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import {
  Save,
  Clear,
  Close,
} from '@mui/icons-material';
import type { StagedChange } from '../../types';

interface StagedChangesBarProps {
  stagedChanges: StagedChange[];
  onApplyChanges?: () => void;
  onClearChanges?: () => void;
  onRemoveChange?: (changeId: string) => void;
  isApplying?: boolean;
}

export const StagedChangesBar: React.FC<StagedChangesBarProps> = ({
  stagedChanges,
  onApplyChanges,
  onClearChanges,
  onRemoveChange,
  isApplying = false,
}) => {
  if (stagedChanges.length === 0) {
    return null;
  }

  const pendingChanges = stagedChanges.filter(change => !change.is_fixed);
  const appliedChanges = stagedChanges.filter(change => change.is_fixed);

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Staged Changes
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {pendingChanges.length > 0 && (
                <Chip
                  label={`${pendingChanges.length} pending`}
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              )}
              {appliedChanges.length > 0 && (
                <Chip
                  label={`${appliedChanges.length} applied`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={onClearChanges}
              disabled={isApplying}
              startIcon={<Clear />}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={onApplyChanges}
              disabled={isApplying || pendingChanges.length === 0}
              startIcon={isApplying ? undefined : <Save />}
            >
              {isApplying ? 'Applying...' : `Apply ${pendingChanges.length} Changes`}
            </Button>
          </Box>
        </Box>

        {pendingChanges.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {pendingChanges.map((change) => (
                <Chip
                  key={change.id}
                  label={`${change.change_type}: ${change.original_content.substring(0, 30)}...`}
                  color="warning"
                  variant="outlined"
                  size="small"
                  onDelete={() => onRemoveChange?.(change.id)}
                  deleteIcon={<Close />}
                />
              ))}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}; 