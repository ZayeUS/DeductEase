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
  Skeleton
} from '@mui/material';
import { Calendar, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { getData } from '../../utils/BackendRequestHelper';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const income = payload.find(p => p.dataKey === 'income')?.value || 0;
    const expenses = payload.find(p => p.dataKey === 'expenses')?.value || 0;
    const netProfit = income - expenses;
    
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
          {label}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#10b981' }}>
            Income: {formatCurrency(income)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#ef4444' }}>
            Expenses: {formatCurrency(expenses)}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: netProfit >= 0 ? '#10b981' : '#ef4444',
            fontWeight: 600,
            borderTop: '1px solid',
            borderColor: 'divider',
            pt: 0.5,
            mt: 0.5
          }}>
            Net: {formatCurrency(netProfit)}
          </Typography>
        </Box>
      </Box>
    );
  }
  return null;
};

export const MonthlySummaryReport = ({ year }) => {
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
      
      const result = await getData(`/reports/monthly-summary?${params.toString()}`);
      setData(result);
    } catch (err) {
      setError('Failed to load monthly summary');
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
          <Skeleton variant="rectangular" height={300} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={200} />
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

  const { months } = data;

  // Fill in missing months with zero values
  const allMonths = [];
  for (let i = 1; i <= 12; i++) {
    const monthData = months.find(m => m.month === i);
    if (monthData) {
      allMonths.push(monthData);
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      allMonths.push({
        month: i,
        monthName: monthNames[i - 1],
        income: 0,
        expenses: 0,
        deductibleExpenses: 0,
        netProfit: 0
      });
    }
  }

  // Calculate year totals
  const yearTotals = months.reduce((acc, month) => ({
    income: acc.income + month.income,
    expenses: acc.expenses + month.expenses,
    deductibleExpenses: acc.deductibleExpenses + month.deductibleExpenses,
    netProfit: acc.netProfit + month.netProfit
  }), { income: 0, expenses: 0, deductibleExpenses: 0, netProfit: 0 });

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Calendar size={24} color={theme.palette.primary.main} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary
            }}
          >
            Monthly Summary - {year || new Date().getFullYear()}
          </Typography>
        </Box>

        {/* Year Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 4 }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: theme.palette.success.light + '20', 
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 600, mb: 0.5 }}>
              Total Income
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
              {formatCurrency(yearTotals.income)}
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2, 
            bgcolor: theme.palette.error.light + '20', 
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 600, mb: 0.5 }}>
              Total Expenses
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
              {formatCurrency(yearTotals.expenses)}
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2, 
            bgcolor: theme.palette.info.light + '20', 
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.info.main, fontWeight: 600, mb: 0.5 }}>
              Tax Deductible
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
              {formatCurrency(yearTotals.deductibleExpenses)}
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2, 
            bgcolor: yearTotals.netProfit >= 0 
              ? theme.palette.success.light + '20' 
              : theme.palette.error.light + '20', 
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="body2" sx={{ 
              color: yearTotals.netProfit >= 0 ? theme.palette.success.main : theme.palette.error.main, 
              fontWeight: 600, 
              mb: 0.5 
            }}>
              Net Profit
            </Typography>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: yearTotals.netProfit >= 0 ? theme.palette.success.main : theme.palette.error.main 
            }}>
              {formatCurrency(yearTotals.netProfit)}
            </Typography>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart3 size={20} />
            Monthly Breakdown
          </Typography>
          
          <Box sx={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allMonths} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="monthName" 
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="income" 
                  fill="#10b981" 
                  name="Income"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="expenses" 
                  fill="#ef4444" 
                  name="Expenses"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Monthly Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Income</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Expenses</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Deductible</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Net Profit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allMonths.map((month, index) => (
                <TableRow key={index} sx={{ 
                  '&:hover': { bgcolor: theme.palette.action.hover },
                  opacity: month.income === 0 && month.expenses === 0 ? 0.5 : 1
                }}>
                  <TableCell sx={{ fontWeight: 500 }}>{month.monthName}</TableCell>
                  <TableCell align="right" sx={{ color: theme.palette.success.main, fontWeight: 500 }}>
                    {formatCurrency(month.income)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: theme.palette.error.main, fontWeight: 500 }}>
                    {formatCurrency(month.expenses)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: theme.palette.info.main, fontWeight: 500 }}>
                    {formatCurrency(month.deductibleExpenses)}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    color: month.netProfit >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 600
                  }}>
                    {formatCurrency(month.netProfit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};