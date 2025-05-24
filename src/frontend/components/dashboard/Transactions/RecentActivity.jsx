import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha,
  Button,
  Divider,
  Skeleton
} from '@mui/material';
import { 
  Activity,
  ArrowRight,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TransactionRow = ({ transaction, theme }) => {
  const isIncome = transaction.amount < 0;
  const amount = Math.abs(transaction.amount);
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.5,
        px: 0,
        transition: 'all 0.2s ease',
        borderRadius: 1,
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.02)
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
        {/* Amount Indicator */}
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: isIncome ? theme.palette.success.main : theme.palette.text.secondary,
            flexShrink: 0
          }}
        />
        
        {/* Transaction Details */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: theme.palette.text.primary,
              fontSize: '0.85rem',
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {transaction.description}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.75rem'
              }}
            >
              {formatDate(transaction.transaction_date)}
            </Typography>
            
            {transaction.category_name && (
              <>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.disabled }}
                >
                  •
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.primary.main,
                    fontSize: '0.7rem',
                    fontWeight: 500
                  }}
                >
                  {transaction.category_name}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Amount */}
      <Box sx={{ textAlign: 'right', ml: 2 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.85rem',
            color: isIncome ? theme.palette.success.main : theme.palette.text.primary
          }}
        >
          {isIncome ? '+' : ''}{formatCurrency(amount)}
        </Typography>
      </Box>
    </Box>
  );
};

export const RecentActivity = ({ transactions = [], loading = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Get the 3 most recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, 3);

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width="40%" height={24} />
          </Box>
          {[...Array(5)].map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="60%" height={16} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Activity size={20} color={theme.palette.primary.main} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: '1rem'
              }}
            >
              Recent Activity
            </Typography>
          </Box>
          
          <Button
            variant="text"
            size="small"
            endIcon={<ArrowRight size={14} />}
            onClick={() => navigate('/transactions')}
            sx={{
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'none',
              color: theme.palette.primary.main,
              minWidth: 'auto',
              px: 1
            }}
          >
            View All
          </Button>
        </Box>

        {/* Content */}
        {recentTransactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Activity 
              size={32} 
              color={theme.palette.text.disabled}
              style={{ opacity: 0.4, marginBottom: 8 }}
            />
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.85rem'
              }}
            >
              No recent transactions
            </Typography>
          </Box>
        ) : (
          <Box>
            {recentTransactions.map((transaction, index) => (
              <React.Fragment key={transaction.transaction_id}>
                <TransactionRow transaction={transaction} theme={theme} />
                {index < recentTransactions.length - 1 && (
                  <Divider sx={{ my: 0.5, opacity: 0.5 }} />
                )}
              </React.Fragment>
            ))}
            
            {transactions.length > 3 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/transactions')}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    py: 1
                  }}
                >
                  View All {transactions.length} Transactions
                </Button>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};