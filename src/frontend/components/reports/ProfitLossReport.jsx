import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Skeleton,
  Chip
} from '@mui/material';
import { TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { getData } from '../../utils/BackendRequestHelper';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const ProfitLossReport = ({ startDate, endDate }) => {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const result = await getData(`/reports/profit-loss?${params.toString()}`);
      setData(result);
    } catch (err) {
      setError('Failed to load profit & loss data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width="30%" height={28} />
          </Box>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} variant="text" height={40} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error || 'No data available'}</Typography>
        </CardContent>
      </Card>
    );
  }

  const { summary, income, expenses } = data;

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Receipt size={24} color={theme.palette.primary.main} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary
            }}
          >
            Profit & Loss Statement
          </Typography>
        </Box>

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: theme.palette.success.light + '20', 
            borderRadius: 2,
            border: `1px solid ${theme.palette.success.light}`
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 600, mb: 0.5 }}>
              Total Income
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
              {formatCurrency(summary.totalIncome)}
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2, 
            bgcolor: theme.palette.error.light + '20', 
            borderRadius: 2,
            border: `1px solid ${theme.palette.error.light}`
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 600, mb: 0.5 }}>
              Total Expenses
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
              {formatCurrency(summary.totalExpenses)}
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2, 
            bgcolor: summary.netProfit >= 0 
              ? theme.palette.success.light + '20' 
              : theme.palette.error.light + '20', 
            borderRadius: 2,
            border: `1px solid ${summary.netProfit >= 0 ? theme.palette.success.light : theme.palette.error.light}`
          }}>
            <Typography variant="body2" sx={{ 
              color: summary.netProfit >= 0 ? theme.palette.success.main : theme.palette.error.main, 
              fontWeight: 600, 
              mb: 0.5 
            }}>
              Net Profit
            </Typography>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: summary.netProfit >= 0 ? theme.palette.success.main : theme.palette.error.main 
            }}>
              {formatCurrency(summary.netProfit)}
            </Typography>
          </Box>
        </Box>

        {/* Income Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingUp size={20} color={theme.palette.success.main} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
              Income
            </Typography>
          </Box>
          
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Transactions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {income.length > 0 ? income.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                      {formatCurrency(parseFloat(item.total_amount))}
                    </TableCell>
                    <TableCell align="center">{item.transaction_count}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: theme.palette.text.secondary }}>
                      No income recorded for this period
                    </TableCell>
                  </TableRow>
                )}
                <TableRow sx={{ bgcolor: theme.palette.success.light + '20' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Total Income</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {formatCurrency(summary.totalIncome)}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    {income.reduce((sum, item) => sum + parseInt(item.transaction_count), 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Expenses Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingDown size={20} color={theme.palette.error.main} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
              Expenses
            </Typography>
          </Box>
          
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Transactions</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Tax Deductible</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.length > 0 ? expenses.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                      {formatCurrency(parseFloat(item.total_amount))}
                    </TableCell>
                    <TableCell align="center">{item.transaction_count}</TableCell>
                    <TableCell align="center">
                      {item.is_deductible ? (
                        <Chip label="Yes" color="success" size="small" />
                      ) : (
                        <Chip label="No" color="default" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: theme.palette.text.secondary }}>
                      No expenses recorded for this period
                    </TableCell>
                  </TableRow>
                )}
                <TableRow sx={{ bgcolor: theme.palette.error.light + '20' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Total Expenses</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                    {formatCurrency(summary.totalExpenses)}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    {expenses.reduce((sum, item) => sum + parseInt(item.transaction_count), 0)}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {formatCurrency(summary.deductibleExpenses)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CardContent>
    </Card>
  );
};