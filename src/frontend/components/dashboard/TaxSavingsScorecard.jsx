// src/components/dashboard/PremiumTaxSavingsCard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  LinearProgress,
  useTheme,
  Alert,
  Paper,
  CardContent,
  useMediaQuery
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getData } from '../../utils/BackendRequestHelper';

export const TaxSavingsScorecard = () => {
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchScorecard();
  }, []);

  const fetchScorecard = async () => {
    try {
      setLoading(true);
      // Updated endpoint path based on your route structure
      const data = await getData('/tax-planning/scorecard');
      setScorecard(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tax savings scorecard:', err);
      setError('Unable to load your tax savings progress. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Estimate potential savings based on unreviewed transactions
  const estimatePotentialSavings = () => {
    const { transactionsProcessed, transactionsReviewed } = scorecard?.stats || {};
    const unreviewedCount = (transactionsProcessed || 0) - (transactionsReviewed || 0);
  
    return unreviewedCount > 0 ? 50 : 0; // Show “$50+” only if they have something to review
  };
  

  if (loading) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2, 
          mb: 3, 
          overflow: 'hidden',
          background: theme.palette.background.paper,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'relative',
          height: 280
        }}
      >
        <CardContent sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: theme.palette.primary.main + '30', mb: 2 }} />
          <Box sx={{ width: '60%', height: 30, bgcolor: theme.palette.background.default, borderRadius: 1, mb: 2 }} />
          <Box sx={{ width: '40%', height: 20, bgcolor: theme.palette.background.default, borderRadius: 1, mb: 3 }} />
          <Box sx={{ width: '90%', height: 8, bgcolor: theme.palette.background.default, borderRadius: 4 }} />
        </CardContent>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2, 
          mb: 3, 
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button variant="outlined" onClick={fetchScorecard}>Try Again</Button>
        </CardContent>
      </Paper>
    );
  }

  if (!scorecard) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2, 
          mb: 3, 
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Alert severity="info">
            Start categorizing your transactions to track your tax savings progress.
          </Alert>
        </CardContent>
      </Paper>
    );
  }

  const savingsRatio = scorecard.roi?.savingsToDateRatio || 0;
  const potentialSavings = estimatePotentialSavings();
  const hasUnreviewedTransactions = scorecard.stats.transactionsReviewed < scorecard.stats.transactionsProcessed;
  const transactionsToReview = scorecard.stats.transactionsProcessed - scorecard.stats.transactionsReviewed;
  const reviewProgress = scorecard.stats.transactionsProcessed > 0 
    ? (scorecard.stats.transactionsReviewed / scorecard.stats.transactionsProcessed) * 100
    : 0;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        borderRadius: 2, 
        mb: 3, 
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        color: 'white',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Decorative Elements */}
      <Box sx={{ 
        position: 'absolute', 
        top: -40, 
        right: -40, 
        width: 200, 
        height: 200, 
        borderRadius: '50%', 
        bgcolor: 'rgba(255,255,255,0.05)' 
      }} />
      <Box sx={{ 
        position: 'absolute', 
        bottom: -30, 
        left: -30, 
        width: 120, 
        height: 120, 
        borderRadius: '50%', 
        bgcolor: 'rgba(255,255,255,0.05)' 
      }} />
      
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
        <Grid container spacing={4}>
          {/* Savings Stats */}
          <Grid item xs={12} md={6}>
            <Typography 
              variant="overline" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: 1.2,
                fontSize: '0.75rem'
              }}
            >
              YOUR TAX SAVINGS
            </Typography>
            
            <Typography 
              variant={isMobile ? "h3" : "h2"} 
              fontWeight="bold" 
              sx={{ mt: 1, mb: 1 }}
            >
              {formatCurrency(scorecard.stats.estimatedSavings)}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography 
                variant="body2" 
                sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }}
              >
                ROI on subscription:
              </Typography>
              <Typography 
                variant="body1" 
                fontWeight="medium"
                sx={{ 
                  color: savingsRatio >= 1 ? '#4ADE80' : 'rgba(255,255,255,0.9)',
                  px: 1,
                  py: 0.2,
                  borderRadius: 1,
                  bgcolor: savingsRatio >= 1 ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.1)'
                }}
              >
                {savingsRatio.toFixed(1)}x
              </Typography>
            </Box>
            
            {/* Progress bar */}
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Transaction Review
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {scorecard.stats.transactionsReviewed} of {scorecard.stats.transactionsProcessed}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={reviewProgress} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'rgba(255,255,255,0.9)'
                  }
                }}
              />
            </Box>
          </Grid>
          
          {/* Call to Action */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%' }}>
              {hasUnreviewedTransactions ? (
                <>
                  <Alert 
                    icon={<InfoIcon />}
                    severity="info" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      '& .MuiAlert-icon': {
                        color: 'white'
                      }
                    }}
                  >
                    <Typography variant="body2">
                      <strong>{transactionsToReview} unreviewed {transactionsToReview === 1 ? 'transaction' : 'transactions'}</strong> could unlock <strong>{formatCurrency(potentialSavings)}</strong> in potential savings.
                    </Typography>
                  </Alert>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => navigate('/review')}
                    size="large"
                    fullWidth
                    sx={{ 
                      py: 1.5,
                      fontWeight: 600,
                      backgroundColor: 'white',
                      color: '#1E3A8A',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)'
                      }
                    }}
                  >
                    Review Transactions
                  </Button>
                </>
              ) : (
                <Alert 
                  icon={<CheckCircleIcon />}
                  severity="success" 
                  sx={{ 
                    borderRadius: 2,
                    backgroundColor: 'rgba(74,222,128,0.25)',
                    color: 'white',
                    border: '1px solid rgba(74,222,128,0.5)',
                    '& .MuiAlert-icon': {
                      color: '#4ADE80'
                    }
                  }}
                >
                  <Typography variant="body1" fontWeight="medium">
                    All transactions reviewed
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    You're up to date! We'll notify you when new transactions arrive.
                  </Typography>
                </Alert>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Paper>
  );
};