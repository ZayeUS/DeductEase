import React from 'react';
import {
  Dialog,
  DialogContent,
  CircularProgress,
  Typography,
  Box
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useUserStore } from '../store/userStore';

export const LoadingModal = ({ message = "Loading..." }) => {
  const loading = useUserStore(state => state.loading);
  const theme = useTheme();

  return (
    <Dialog
      open={loading}
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: theme.shadows[8],
          overflow: 'hidden',
          minWidth: 320,
          border: `1px solid ${theme.palette.divider}`,
        },
      }}
      disableEscapeKeyDown
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogContent
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2.5,
        }}
      >
        {/* Progress indicator */}
        <Box sx={{ position: 'relative' }}>
          <CircularProgress
            size={48}
            thickness={2.5}
            sx={{
              color: theme.palette.primary.main,
            }}
          />
          {/* Optional: Background circle for contrast */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={48}
            thickness={2.5}
            sx={{
              color: theme.palette.action.disabledBackground,
              position: 'absolute',
              left: 0,
              zIndex: -1,
            }}
          />
        </Box>

        {/* Message */}
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          {message}
        </Typography>

        {/* Security indicator (optional - adds trust) */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5,
          mt: 1 
        }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: theme.palette.success.main,
              animation: 'pulse 2s infinite',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.75rem',
            }}
          >
            Secure connection
          </Typography>
        </Box>
      </DialogContent>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Dialog>
  );
};