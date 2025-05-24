import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Skeleton,
  Button,
  Chip,
  Tooltip,
  alpha,
  LinearProgress
} from "@mui/material";
import { 
  TrendingUp, 
  Receipt, 
  CheckCircle,
  DollarSign,
  Clock,
  Calculator,
  Info,
  Brain,
  Lightbulb
} from "lucide-react";

const CARD_MIN_HEIGHT = 220; // Fixed minimum height for all cards

const ProfitLossCard = ({ data, loading = false }) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Card
        sx={{ 
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 1px 3px rgba(0, 0, 0, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
          height: CARD_MIN_HEIGHT,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardContent sx={{ p: 3, flex: 1 }}>
          <Skeleton variant="text" width="70%" height={20} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={16} />
        </CardContent>
      </Card>
    );
  }

  const incomeYTD = data?.incomeYTD || 0;
  const expensesYTD = data?.expensesYTD || 0;
  const netProfit = data?.netProfit || 0;

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(Math.abs(amount));
  };

  const accentColor = netProfit >= 0 ? theme.palette.success.main : theme.palette.error.main;

  return (
    <Card
      sx={{ 
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 1px 3px rgba(0, 0, 0, 0.3)'
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        height: CARD_MIN_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: theme.shadows[2],
          borderColor: alpha(accentColor, 0.3)
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          bgcolor: accentColor,
          opacity: 0.6
        }
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
              lineHeight: 1.2
            }}
          >
            Net Profit
          </Typography>
          <DollarSign size={18} color={accentColor} />
        </Box>

        {/* Main Value */}
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            fontSize: '1.6rem',
            lineHeight: 1.1,
            color: theme.palette.text.primary,
            mb: 0.5
          }}
        >
          {formatCurrency(netProfit)}
        </Typography>
        
        {/* Subtitle */}
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
            lineHeight: 1.2,
            mb: 1.5
          }}
        >
          Income minus expenses
        </Typography>

        {/* Charts section - Takes remaining space */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {/* Income */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '0.75rem'
                }}
              >
                {formatCurrency(incomeYTD)}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem'
                }}
              >
                Income
              </Typography>
            </Box>
            <Box sx={{ 
              height: 4,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.success.main, 0.2),
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                height: '100%',
                width: '100%',
                bgcolor: theme.palette.success.main,
                borderRadius: 1
              }} />
            </Box>
          </Box>

          {/* Expenses */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '0.75rem'
                }}
              >
                {formatCurrency(expensesYTD)}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem'
                }}
              >
                Expenses
              </Typography>
            </Box>
            <Box sx={{ 
              height: 4,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.error.main, 0.2),
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                height: '100%',
                width: incomeYTD > 0 ? `${Math.min((expensesYTD / incomeYTD) * 100, 100)}%` : '100%',
                bgcolor: theme.palette.error.main,
                borderRadius: 1
              }} />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  loading = false,
  showTooltip = false,
  tooltipText = "",
  unreviewedCount = 0
}) => {
  const theme = useTheme();

  const getAccentColor = () => {
    if (title === "Review Progress") {
      return parseInt(value) === 100 ? theme.palette.success.main : theme.palette.warning.main;
    }
    if (title === "Est. Tax Liability") {
      return theme.palette.info.main;
    }
    return theme.palette.text.disabled;
  };

  const accentColor = getAccentColor();

  if (loading) {
    return (
      <Card
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 1px 3px rgba(0, 0, 0, 0.3)"
              : "0 1px 3px rgba(0, 0, 0, 0.1)",
          height: CARD_MIN_HEIGHT,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent sx={{ p: 3, flex: 1 }}>
          <Skeleton variant="text" width="70%" height={20} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={16} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 1px 3px rgba(0, 0, 0, 0.3)"
            : "0 1px 3px rgba(0, 0, 0, 0.1)",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
        height: CARD_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          boxShadow: theme.shadows[2],
          borderColor: alpha(accentColor, 0.3),
        },
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          bgcolor: accentColor,
          opacity: 0.6,
        }
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header - Fixed height */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", height: 24, mb: 2 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.secondary,
              fontSize: "0.875rem",
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
            {showTooltip && (
              <Tooltip title={tooltipText} arrow placement="top">
                <Box sx={{ display: "flex", cursor: "help" }}>
                  <Info size={14} color={theme.palette.text.disabled} />
                </Box>
              </Tooltip>
            )}
            <Icon size={18} color={accentColor} />
          </Box>
        </Box>

        {/* Main Value - Fixed height */}
        <Box sx={{ height: 48, mb: 1.5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: "1.75rem",
              lineHeight: 1,
              color: theme.palette.text.primary,
            }}
          >
            {value}
          </Typography>
        </Box>

        {/* Bottom section - Takes remaining space */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Subtitle or Button */}
          {title === "Review Progress" && unreviewedCount > 0 ? (
            <Button
              variant="contained"
              color="warning"
              size="medium"
              sx={{ 
                fontWeight: 700, 
                borderRadius: 2, 
                textTransform: "none",
                alignSelf: 'flex-start',
                mb: title === "Review Progress" ? 1 : 0
              }}
              onClick={() => window.location.href = "/review"}
              aria-label="Review transactions now"
            >
              Review Now
            </Button>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "0.75rem",
                lineHeight: 1.2,
                mb: title === "Review Progress" ? 1 : 0,
              }}
            >
              {subtitle}
            </Typography>
          )}

          {/* Progress bar for review progress card */}
          {title === "Review Progress" && (
            <LinearProgress
              variant="determinate"
              value={parseInt(value)}
              sx={{
                height: 6,
                borderRadius: 1,
                bgcolor: alpha(accentColor, 0.2),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 1,
                  bgcolor: accentColor,
                },
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const AIInsightsCard = ({ context, loading = false }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 1px 3px rgba(0, 0, 0, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            bgcolor: theme.palette.info.main,
            opacity: 0.6
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width="30%" height={20} />
          </Box>
          <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="90%" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="75%" height={16} />
        </CardContent>
      </Card>
    );
  }

  if (!context || context.trim() === '') {
    return null;
  }

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 1px 3px rgba(0, 0, 0, 0.3)'
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: theme.shadows[2],
          borderColor: alpha(theme.palette.info.main, 0.3)
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          bgcolor: theme.palette.info.main,
          opacity: 0.6
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Brain size={20} color={theme.palette.info.main} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.text.primary,
              fontSize: '1rem'
            }}
          >
            AI Financial Insights
          </Typography>
        </Box>

        {/* Insights Content */}
        <Typography 
          variant="body1" 
          sx={{ 
            color: theme.palette.text.primary,
            fontSize: '0.9rem',
            lineHeight: 1.6,
            fontWeight: 500
          }}
        >
          {context}
        </Typography>
      </CardContent>
    </Card>
  );
};

export const DashboardStats = ({ data, transactions = [], loading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (typeof amount !== "number" || isNaN(amount)) return "$0";

    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(Math.abs(amount));

    return formatted;
  };

  // Use backend data
  const estimatedTaxLiability = data?.estimatedTaxLiability || 0;
  const unreviewedCount = data?.unreviewedTransactions || 0;
  const aiContext = data?.context || '';

  // Calculate review progress
  const totalTransactions = transactions.length;
  const reviewedTransactions = totalTransactions - unreviewedCount;
  const reviewProgress =
    totalTransactions > 0
      ? Math.round((reviewedTransactions / totalTransactions) * 100)
      : 0;

  const otherStats = [
    {
      title: "Review Progress",
      value: `${reviewProgress}%`,
      icon: CheckCircle,
      subtitle:
        unreviewedCount > 0
          ? `${unreviewedCount} transaction${unreviewedCount > 1 ? "s" : ""} pending`
          : "All transactions reviewed",
      unreviewedCount,
    },
    {
      title: "Est. Tax Liability",
      value: formatCurrency(estimatedTaxLiability),
      icon: Calculator,
      subtitle: "Estimated amount",
      showTooltip: true,
      tooltipText: "Based on 30% estimated tax rate",
    },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      {/* AI Insights Card - ALWAYS FIRST */}
      <Box sx={{ mb: 3 }}>
        <AIInsightsCard context={aiContext} loading={loading} />
      </Box>

      {/* Stats Cards */}
      {isMobile ? (
        <Grid container spacing={3} sx={{ overflowX: "auto", flexWrap: "nowrap" }}>
          <Grid item sx={{ minWidth: 260 }}>
            <ProfitLossCard data={data} loading={loading} />
          </Grid>
          {otherStats.map((stat, index) => (
            <Grid key={index} item sx={{ minWidth: 260 }}>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                subtitle={stat.subtitle}
                loading={loading}
                showTooltip={stat.showTooltip}
                tooltipText={stat.tooltipText}
                unreviewedCount={stat.unreviewedCount || 0}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <ProfitLossCard data={data} loading={loading} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title={otherStats[0].title}
              value={otherStats[0].value}
              icon={otherStats[0].icon}
              subtitle={otherStats[0].subtitle}
              loading={loading}
              unreviewedCount={otherStats[0].unreviewedCount}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title={otherStats[1].title}
              value={otherStats[1].value}
              icon={otherStats[1].icon}
              subtitle={otherStats[1].subtitle}
              loading={loading}
              showTooltip={otherStats[1].showTooltip}
              tooltipText={otherStats[1].tooltipText}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};