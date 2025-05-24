// src/components/dashboard/TaxPlanningCard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Skeleton,
  Alert,
  Paper,
  CardContent,
  Divider,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  SavingsOutlined as SavingsIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getData } from '../../utils/BackendRequestHelper';

export const TaxPlanningCard = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const data = await getData('/tax-planning/quarterly-forecast');
      setForecast(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tax forecast:', err);
      setError('Unable to load tax planning data.');
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

  // Get next quarterly payment due date and status
  const getNextQuarter = () => {
    if (!forecast) return null;
    
    const upcomingQuarters = forecast.quarterlySchedule.filter(
      q => q.status === 'current' || q.status === 'upcoming'
    );
    
    return upcomingQuarters.length > 0 ? upcomingQuarters[0] : null;
  };

  const nextQuarter = getNextQuarter();

  if (loading) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 2
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
            <Skeleton variant="text" width={150} height={24} />
          </Box>
          
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={40} sx={{ width: '60%', borderRadius: 1 }} />
          </Box>
        </CardContent>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 2
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <TrendingUpIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Tax Planning
            </Typography>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={fetchForecast}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/tax-forecast')}
              endIcon={<ArrowForwardIcon />}
              size="small"
              sx={{ mt: 1 }}
            >
              View Tax Forecast
            </Button>
          </Box>
        </CardContent>
      </Paper>
    );
  }

  // If forecast data is not yet available or incomplete
  if (!forecast || !forecast.recommendations) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 2
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <TrendingUpIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Tax Planning
            </Typography>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Review Transactions First</Typography>
              <Typography variant="body2">
                Complete categorizing your transactions to unlock your personalized tax planning insights.
              </Typography>
            </Alert>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/transactions')}
              endIcon={<ArrowForwardIcon />}
            >
              Review Transactions
            </Button>
          </Box>
        </CardContent>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mb: 3, 
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        position: 'relative'
      }}
    >
      {/* Background decoration */}
      <Box sx={{ 
        position: 'absolute',
        top: 0,
        right: 0,
        width: '30%',
        height: '100%',
        background: `linear-gradient(135deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
        zIndex: 0
      }} />
      
      <CardContent sx={{ p: 0, position: 'relative', zIndex: 1 }}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Tax Planning
            </Typography>
          </Box>
          
          <Chip 
            size="small"
            label={`Tax Year ${forecast.taxYear}`}
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              height: 24,
              fontSize: '0.75rem'
            }}
          />
        </Box>
        
        <Box sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your personalized tax guidance based on current data and transaction history.
          </Typography>
          
          {/* Monthly Set-Aside Card */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: alpha(theme.palette.success.main, 0.08),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`
              }
            }}
          >
            {/* Decorative element */}
            <Box sx={{ 
              position: 'absolute',
              top: -30,
              right: -30,
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              zIndex: 0
            }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, position: 'relative', zIndex: 1 }}>
              <SavingsIcon sx={{ color: theme.palette.success.main, fontSize: 20, mr: 1 }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Monthly Set-Aside
              </Typography>
            </Box>
            
            <Typography variant="h3" color="success.main" fontWeight={700} sx={{ mb: 1, position: 'relative', zIndex: 1 }}>
              {formatCurrency(forecast.recommendations.monthlySetAside)}
            </Typography>
            
       
          </Paper>
          
          {/* Next Quarterly Payment */}
          {nextQuarter && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: theme.palette.background.paper,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {/* Decorative element */}
              <Box sx={{ 
                position: 'absolute',
                bottom: -25,
                left: -25,
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                zIndex: 0
              }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ color: theme.palette.primary.main, fontSize: 20, mr: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Next Quarterly Payment
                  </Typography>
                </Box>
                
                <Chip 
                  label={nextQuarter.status === 'current' ? 'Due Soon' : 'Upcoming'} 
                  size="small"
                  sx={{ 
                    bgcolor: nextQuarter.status === 'current' 
                      ? `${theme.palette.warning.main}15` 
                      : `${theme.palette.primary.main}15`,
                    color: nextQuarter.status === 'current' 
                      ? theme.palette.warning.main 
                      : theme.palette.primary.main,
                    fontWeight: 500,
                    height: 24
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <Box>
                  <Typography variant="h4" fontWeight={600} sx={{ mb: 0.5 }}>
                    {formatCurrency(forecast.taxes.quarterlyPayment)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Due date: <strong>{nextQuarter.dueDate}</strong>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* FIXED: Use correct path to effectiveTaxRate from the taxes object */}
            <Typography variant="caption" color="text.secondary">
              Effective Tax Rate: <strong>{forecast.taxes.effectiveTaxRate.toFixed(1)}%</strong>
            </Typography>
            
            <Button
              variant="outlined"
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/tax-forecast')}
              sx={{
                px: 2,
                borderRadius: 6,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              View Full Forecast
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Paper>
  );
};

export default TaxPlanningCard;