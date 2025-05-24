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
  Skeleton,
  Alert,
  Chip
} from '@mui/material';
import { Calculator, Receipt, PiggyBank } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 2,
          boxShadow: 2
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          {data.categoryName}
        </Typography>
        <Typography variant="caption">
          Amount: {formatCurrency(data.amount)}
        </Typography>
        <br />
        <Typography variant="caption">
          Transactions: {data.transactionCount}
        </Typography>
      </Box>
    );
  }
  return null;
};

export const TaxSummaryReport = ({ year }) => {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      
      const result = await getData(`/reports/tax-summary?${params.toString()}`);
      setData(result);
    } catch (err) {
      setError('Failed to load tax summary');
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
          {[...Array(6)].map((_, i) => (
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

  const { totalIncome, totalDeductible, estimatedTaxSavings, deductibleExpenses } = data;

  // Prepare data for pie chart
  const chartData = deductibleExpenses.map((expense, index) => ({
    ...expense,
    fill: COLORS[index % COLORS.length]
  }));

  // Calculate tax rate and potential savings
  const effectiveTaxRate = 0.30; // 30% assumed tax rate
  const taxableIncome = totalIncome - totalDeductible;
  const taxOwed = Math.max(0, taxableIncome * effectiveTaxRate);

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Calculator size={24} color={theme.palette.primary.main} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary
            }}
          >
            Tax Summary - {year || new Date().getFullYear()}
          </Typography>
        </Box>

        {/* Tax Overview Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: theme.palette.info.light + '20', 
            borderRadius: 2,
            border: `1px solid ${theme.palette.info.light}`
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.info.main, fontWeight: 600, mb: 0.5 }}>
              Total Income
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
              {formatCurrency(totalIncome)}
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2, 
            bgcolor: theme.palette.success.light + '20', 
            borderRadius: 2,
            border: `1px solid ${theme.palette.success.light}`
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 600, mb: 0.5 }}>
              Total Deductible
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
              {formatCurrency(totalDeductible)}
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2, 
            bgcolor: theme.palette.warning.light + '20', 
            borderRadius: 2,
            border: `1px solid ${theme.palette.warning.light}`
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.warning.main, fontWeight: 600, mb: 0.5 }}>
              Est. Tax Savings
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
              {formatCurrency(estimatedTaxSavings)}
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2, 
            bgcolor: theme.palette.error.light + '20', 
            borderRadius: 2,
            border: `1px solid ${theme.palette.error.light}`
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 600, mb: 0.5 }}>
              Est. Tax Owed
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
              {formatCurrency(taxOwed)}
            </Typography>
          </Box>
        </Box>

        {/* Tax Insights Alert */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>💡 Tax Insight:</strong> Your deductible expenses saved you approximately{' '}
            <strong>{formatCurrency(estimatedTaxSavings)}</strong> in taxes this year. 
            {totalDeductible > 0 && (
              <span> That's a {((estimatedTaxSavings / (totalIncome * effectiveTaxRate)) * 100).toFixed(1)}% reduction in your tax liability!</span>
            )}
          </Typography>
        </Alert>

        {/* Deductible Expenses Breakdown */}
        {deductibleExpenses.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Receipt size={20} color={theme.palette.primary.main} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Deductible Expenses Breakdown
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Pie Chart */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
                  Expenses by Category
                </Typography>
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="amount"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ categoryName, percent }) => 
                          `${categoryName}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              {/* Table */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Category Details
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                        <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Count</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Tax Savings</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deductibleExpenses.map((expense, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box 
                                sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%', 
                                  bgcolor: COLORS[index % COLORS.length] 
                                }} 
                              />
                              {expense.categoryName}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell align="center">{expense.transactionCount}</TableCell>
                          <TableCell align="right" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                            {formatCurrency(expense.amount * effectiveTaxRate)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: theme.palette.success.light + '20' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatCurrency(totalDeductible)}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          {deductibleExpenses.reduce((sum, exp) => sum + exp.transactionCount, 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                          {formatCurrency(estimatedTaxSavings)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          </Box>
        )}

        {/* Tax Planning Tips */}
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>📋 Remember:</strong> This is an estimate based on a 30% tax rate. 
            Consult with a tax professional for accurate calculations and planning strategies.
          </Typography>
        </Alert>

        {deductibleExpenses.length === 0 && (
          <Alert severity="info">
            <Typography variant="body2">
              <strong>💡 Tip:</strong> No deductible expenses found for this period. 
              Consider categorizing your business expenses properly to maximize tax deductions!
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};