// components/dashboard/CategorizeLoadingModal.jsx
import React from 'react';
import { Modal, Box, Typography, LinearProgress, useTheme } from '@mui/material';
import { SentimentSatisfiedAlt as JokeIcon } from '@mui/icons-material';

export const CategorizeLoadingModal = ({ open, progress, currentJoke }) => {
  const theme = useTheme();

  return (
    <Modal open={open} sx={{ zIndex: 9999 }}>
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography 
          variant="h3" 
          sx={{ 
            mb: 6, 
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AgencyTax
        </Typography>
        
        <Typography variant="h5" sx={{ mb: 1 }}>
          Categorizing your transactions...
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {Math.round(progress)}% complete
        </Typography>
        
        <Box sx={{ width: '60%', mb: 6 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: '#f0f0f0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`,
                transition: 'none',
              }
            }}
          />
        </Box>
        
        <Box sx={{ 
          maxWidth: 600,
          textAlign: 'center',
          p: 4,
          backgroundColor: '#f8f9fa',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <JokeIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontStyle: 'italic',
              color: theme.palette.text.primary,
              minHeight: 60,
              px: 2
            }}
          >
            "{currentJoke}"
          </Typography>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
          Powered by AI Tax Categorization
        </Typography>
      </Box>
    </Modal>
  );
};