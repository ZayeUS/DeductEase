import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha,
  Skeleton
} from '@mui/material';
import { 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { getData } from '../../../utils/BackendRequestHelper';

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
    const netFlow = income - expenses;
    
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 3, bgcolor: '#10b981', borderRadius: 1 }} />
            <Typography variant="caption">Income: {formatCurrency(income)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 3, bgcolor: '#ef4444', borderRadius: 1 }} />
            <Typography variant="caption">Expenses: {formatCurrency(expenses)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, pt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ width: 12, height: 3, bgcolor: netFlow >= 0 ? '#10b981' : '#ef4444', borderRadius: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Net: {formatCurrency(netFlow)}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
  return null;
};

export const CashFlowChart = ({ loading = false }) => {
  const theme = useTheme();
  const [data, setData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const fetchCashFlow = async () => {
      try {
        setChartLoading(true);
        const result = await getData('/dashboard/cash-flow');
        setData(result.cashFlow || []);
      } catch (error) {
        console.error('Error fetching cash flow:', error);
        setData([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchCashFlow();
  }, []);
  
  // Don't show the chart if there's no transaction data
  if (!loading && !chartLoading && data.length === 0) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <TrendingUp size={20} color={theme.palette.primary.main} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: '1rem'
              }}
            >
              Cash Flow Trend
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TrendingUp 
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
              No transaction data available for chart
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate trend from last two months
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  
  const netFlowChange = currentMonth && previousMonth 
    ? currentMonth.netFlow - previousMonth.netFlow 
    : 0;
  
  const isPositiveTrend = netFlowChange > 0;
  const isFlat = Math.abs(netFlowChange) < 50; // Consider changes under $50 as flat

  if (loading || chartLoading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width="40%" height={24} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={120} />
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
            <TrendingUp size={20} color={theme.palette.primary.main} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: '1rem'
              }}
            >
              Cash Flow Trend
            </Typography>
          </Box>
          
          {/* Trend Indicator */}
          {!isFlat && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isPositiveTrend ? (
                <TrendingUp size={16} color={theme.palette.success.main} />
              ) : (
                <TrendingDown size={16} color={theme.palette.error.main} />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: isPositiveTrend ? theme.palette.success.main : theme.palette.error.main,
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                {isPositiveTrend ? '+' : ''}{formatCurrency(netFlowChange)} vs last month
              </Typography>
            </Box>
          )}
        </Box>

        {/* Chart */}
        <Box sx={{ height: 120, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
            >
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={alpha(theme.palette.text.secondary, 0.2)}
                vertical={false}
              />
              
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 12, 
                  fill: theme.palette.text.secondary 
                }}
              />
              
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 12, 
                  fill: theme.palette.text.secondary 
                }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#incomeGradient)"
              />
              
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="2"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          mt: 2, 
          pt: 2, 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: theme.palette.success.main,
                fontSize: '0.9rem'
              }}
            >
              {formatCurrency(currentMonth?.income || 0)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.7rem'
              }}
            >
              This month income
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: theme.palette.error.main,
                fontSize: '0.9rem'
              }}
            >
              {formatCurrency(currentMonth?.expenses || 0)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.7rem'
              }}
            >
              This month expenses
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: (currentMonth?.netFlow || 0) >= 0 
                  ? theme.palette.success.main 
                  : theme.palette.error.main,
                fontSize: '0.9rem'
              }}
            >
              {formatCurrency(currentMonth?.netFlow || 0)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.7rem'
              }}
            >
              Net flow
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};