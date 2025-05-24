import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Collapse,
  alpha
} from '@mui/material';
import { 
  Edit as EditIcon,
  Check as CheckIcon,
  Circle as CircleIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon
} from '@mui/icons-material';

export const TransactionTable = ({
  transactions = [],
  categories = [],
  onUpdateCategory,
  updatingTransaction,
  maxHeight = 600
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(Math.abs(amount) || 0);
  };

  const formatTransactionDate = (dateString) => {
    const date = new Date(dateString);
    return {
      short: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      full: date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    };
  };

  const getCategoryByType = (type) => {
    return categories.filter(cat => cat.type === type);
  };

  const handleCategoryUpdate = async (transactionId, categoryId) => {
    await onUpdateCategory(transactionId, categoryId);
    setEditingTransaction(null);
  };

  const toggleRowExpansion = (transactionId) => {
    const newExpanded = new Set(expandedRows);
    if (expandedRows.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedRows(newExpanded);
  };

  // Mobile card layout
  if (isMobile) {
    return (
      <Box sx={{ maxHeight, overflow: 'auto', pr: 1 }}>
        {transactions.map((transaction) => (
          <Box key={transaction.transaction_id}>
            <Paper
              elevation={0}
              sx={{
                mb: 2,
                p: 2.5,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                position: 'relative',
                '&:hover': {
                  borderColor: theme.palette.primary.main + '40',
                  bgcolor: alpha(theme.palette.primary.main, 0.02)
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {transaction.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatTransactionDate(transaction.transaction_date).full}
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'right' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: transaction.amount < 0 
                        ? theme.palette.success.main 
                        : theme.palette.text.primary,
                      mb: 0.5
                    }}
                  >
                    {formatCurrency(transaction.amount)}
                  </Typography>
                  {transaction.is_reviewed ? (
                    <CheckIcon sx={{ color: theme.palette.success.main, fontSize: 18 }} />
                  ) : (
                    <CircleIcon sx={{ color: theme.palette.warning.main, fontSize: 8 }} />
                  )}
                </Box>
              </Box>

              {/* Category Section */}
              <Box sx={{ mt: 2 }}>
                {editingTransaction === transaction.transaction_id ? (
                  <FormControl size="small" fullWidth>
                    <Select
                      value={transaction.category_id || ''}
                      onChange={(e) => handleCategoryUpdate(transaction.transaction_id, e.target.value || null)}
                      disabled={updatingTransaction === transaction.transaction_id}
                      autoFocus
                      displayEmpty
                      onBlur={() => setEditingTransaction(null)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">
                        <em>Uncategorized</em>
                      </MenuItem>
                      {getCategoryByType(transaction.amount < 0 ? 'INCOME' : 'EXPENSE').map(category => (
                        <MenuItem key={category.category_id} value={category.category_id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {transaction.category_name ? (
                      <Chip 
                        label={transaction.category_name} 
                        size="small"
                        sx={{
                          bgcolor: theme.palette.primary.main + '15',
                          color: theme.palette.primary.main,
                          fontWeight: 500,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: theme.palette.primary.main + '25'
                          }
                        }}
                        onClick={() => setEditingTransaction(transaction.transaction_id)}
                      />
                    ) : (
                      <Chip 
                        label="Uncategorized" 
                        size="small"
                        sx={{
                          bgcolor: theme.palette.warning.main + '15',
                          color: theme.palette.warning.main,
                          fontWeight: 500,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: theme.palette.warning.main + '25'
                          }
                        }}
                        onClick={() => setEditingTransaction(transaction.transaction_id)}
                      />
                    )}
                    
                    <IconButton 
                      size="small"
                      onClick={() => setEditingTransaction(transaction.transaction_id)}
                      sx={{ ml: 1 }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>
    );
  }

  // Desktop table layout
  return (
    <TableContainer 
      component={Paper} 
      elevation={0}
      sx={{ 
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        maxHeight,
        overflow: 'auto'
      }}
    >
      <Table stickyHeader size="medium">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, py: 2.5, bgcolor: theme.palette.background.paper }}>
              Date
            </TableCell>
            <TableCell sx={{ fontWeight: 600, py: 2.5, bgcolor: theme.palette.background.paper }}>
              Description
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, py: 2.5, bgcolor: theme.palette.background.paper }}>
              Amount
            </TableCell>
            <TableCell sx={{ fontWeight: 600, py: 2.5, bgcolor: theme.palette.background.paper }}>
              Category
            </TableCell>
            <TableCell sx={{ fontWeight: 600, py: 2.5, width: 60, bgcolor: theme.palette.background.paper }}>
              Status
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow 
              key={transaction.transaction_id}
              sx={{
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.03)
                },
                borderLeft: !transaction.is_reviewed 
                  ? `3px solid ${theme.palette.warning.main}` 
                  : '3px solid transparent'
              }}
            >
              {/* DATE */}
              <TableCell sx={{ py: 2.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatTransactionDate(transaction.transaction_date).short}
                </Typography>
              </TableCell>

              {/* DESCRIPTION */}
              <TableCell sx={{ py: 2.5 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {transaction.description}
                  </Typography>
                  {transaction.merchant_name && transaction.merchant_name !== transaction.description && (
                    <Typography variant="caption" color="text.secondary">
                      {transaction.merchant_name}
                    </Typography>
                  )}
                </Box>
              </TableCell>

              {/* AMOUNT */}
              <TableCell align="right" sx={{ py: 2.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: transaction.amount < 0 
                      ? theme.palette.success.main 
                      : theme.palette.text.primary 
                  }}
                >
                  {formatCurrency(transaction.amount)}
                </Typography>
              </TableCell>

              {/* CATEGORY */}
              <TableCell sx={{ py: 2.5 }}>
                {editingTransaction === transaction.transaction_id ? (
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      value={transaction.category_id || ''}
                      onChange={(e) => handleCategoryUpdate(transaction.transaction_id, e.target.value || null)}
                      disabled={updatingTransaction === transaction.transaction_id}
                      autoFocus
                      displayEmpty
                      onBlur={() => setEditingTransaction(null)}
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value="">
                        <em>Uncategorized</em>
                      </MenuItem>
                      {getCategoryByType(transaction.amount < 0 ? 'INCOME' : 'EXPENSE').map(category => (
                        <MenuItem key={category.category_id} value={category.category_id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {transaction.category_name ? (
                      <Chip 
                        label={transaction.category_name} 
                        size="small"
                        sx={{
                          bgcolor: theme.palette.primary.main + '15',
                          color: theme.palette.primary.main,
                          fontWeight: 500,
                          cursor: 'pointer',
                          height: 28,
                          '&:hover': {
                            bgcolor: theme.palette.primary.main + '25'
                          }
                        }}
                        onClick={() => setEditingTransaction(transaction.transaction_id)}
                      />
                    ) : (
                      <Chip 
                        label="Uncategorized" 
                        size="small"
                        sx={{
                          bgcolor: theme.palette.warning.main + '15',
                          color: theme.palette.warning.main,
                          fontWeight: 500,
                          cursor: 'pointer',
                          height: 28,
                          '&:hover': {
                            bgcolor: theme.palette.warning.main + '25'
                          }
                        }}
                        onClick={() => setEditingTransaction(transaction.transaction_id)}
                      />
                    )}
                    
                    <IconButton 
                      size="small"
                      onClick={() => setEditingTransaction(transaction.transaction_id)}
                      sx={{ 
                        ml: 0.5,
                        opacity: 0.6,
                        '&:hover': { opacity: 1 }
                      }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                )}
              </TableCell>

              {/* STATUS */}
              <TableCell sx={{ py: 2.5 }}>
                {transaction.is_reviewed ? (
                  <CheckIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                ) : (
                  <CircleIcon sx={{ 
                    color: theme.palette.warning.main,
                    fontSize: 8
                  }} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};