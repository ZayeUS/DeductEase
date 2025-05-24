// components/dashboard/DashboardTransactions.jsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Button,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import { 
  Receipt as ReceiptIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckIcon,
  AccountBalance as BankIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const DashboardTransactions = ({ 
  transactions = [], 
  banks = [],
  loading = false,
  uncategorizedCount = 0,
  unreviewedCount = 0,
  onSync // Add this prop to handle sync
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeBank, setActiveBank] = useState('all');
  
  // Group transactions by bank ID
  const transactionsByBank = transactions.reduce((acc, transaction) => {
    const bankId = transaction.bank_account_id || 'unknown';
    if (!acc[bankId]) {
      acc[bankId] = [];
    }
    acc[bankId].push(transaction);
    return acc;
  }, {});
  
  // Filter transactions by selected bank
  const getFilteredTransactions = () => {
    if (activeBank === 'all') {
      // Return most recent transactions from all banks
      return transactions
        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
        .slice(0, 5);
    }
    
    // Return transactions from selected bank
    return (transactionsByBank[activeBank] || [])
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      .slice(0, 5);
  };
  
  const filteredTransactions = getFilteredTransactions();
  
  // Format helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(Math.abs(amount) || 0);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Function to determine if a transaction is deductible (simplified)
  const isDeductible = (transaction) => {
    const deductibleCategories = ['Office Expense', 'Software', 'Travel', 'Professional Services'];
    return deductibleCategories.includes(transaction.category_name);
  };
  
  // Calculate tax savings (simplified at 25% rate)
  const calculateTaxSavings = (transaction) => {
    if (!isDeductible(transaction) || transaction.amount >= 0) return 0;
    return Math.abs(transaction.amount) * 0.25;
  };
  
  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header with stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ReceiptIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent Transactions
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {uncategorizedCount > 0 && (
              <Chip 
                label={`${uncategorizedCount} uncategorized`}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 24 }}
              />
            )}
            <Button
              variant="outlined"
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/transactions')}
              sx={{ borderRadius: 2 }}
            >
              View All
            </Button>
          </Box>
        </Box>
        
        {/* Bank chips - following the new style */}
        {banks.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Filter by Account:
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="All Accounts"
                size="small"
                color={activeBank === 'all' ? 'primary' : 'default'}
                onClick={() => setActiveBank('all')}
                sx={{ borderRadius: 1 }}
              />
              
              {banks.map(bank => (
                <Chip 
                  key={bank.account_id || bank.bank_account_id}
                  label={bank.account_name || bank.bank_name}
                  size="small"
                  color={activeBank === (bank.account_id || bank.bank_account_id) ? 'primary' : 'default'}
                  onClick={() => setActiveBank(bank.account_id || bank.bank_account_id)}
                  sx={{ borderRadius: 1 }}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Transaction list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : banks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <BankIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2, opacity: 0.3 }} />
            <Typography color="text.secondary">
              No banks connected yet
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 2, borderRadius: 2 }}
              onClick={() => navigate('/connect')}
            >
              Connect Bank
            </Button>
          </Box>
        ) : filteredTransactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No transactions found
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Transaction list with consistent styling */}
            {filteredTransactions.map((transaction, index) => (
              <Box 
                key={transaction.transaction_id}
                sx={{ 
                  p: 2, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                    borderColor: alpha(theme.palette.primary.main, 0.2)
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  {/* Left: Date */}
                  <Box sx={{ 
                    minWidth: 40, 
                    textAlign: 'center',
                    borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    pr: 1
                  }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatDate(transaction.transaction_date)}
                    </Typography>
                  </Box>
                  
                  {/* Middle: Description & Category */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {transaction.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {transaction.category_name ? (
                        <Chip 
                          label={transaction.category_name} 
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.625rem',
                            borderRadius: 1
                          }}
                        />
                      ) : (
                        <Chip 
                          label="Uncategorized" 
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{
                            height: 20,
                            fontSize: '0.625rem',
                            borderRadius: 1
                          }}
                        />
                      )}
                      
                      {isDeductible(transaction) && (
                        <Chip 
                          icon={<CheckIcon sx={{ fontSize: '0.75rem !important' }} />}
                          label="Deductible" 
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{
                            height: 20,
                            fontSize: '0.625rem',
                            borderRadius: 1
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                
                {/* Right: Amount & Tax Impact */}
                <Box sx={{ textAlign: 'right', ml: 2, minWidth: 90 }}>
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    color={transaction.amount < 0 ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(transaction.amount)}
                  </Typography>
                  
                  {isDeductible(transaction) && (
                    <Typography variant="caption" color="primary.main" fontWeight={500}>
                      {formatCurrency(calculateTaxSavings(transaction))} saved
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Footer with View All button - only show if we have transactions */}
        {transactions.length > 0 && banks.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/transactions')}
              endIcon={<ArrowForwardIcon />}
              sx={{ borderRadius: 2 }}
            >
              View All {transactions.length} Transactions
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};