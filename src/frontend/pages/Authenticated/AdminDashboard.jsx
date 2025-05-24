import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Box,
  Alert,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  Skeleton,
  Card,
  CardContent,
  Button
} from "@mui/material";
import { useUserStore } from "../../store/userStore";
import { getData, postData, putData } from "../../utils/BackendRequestHelper";
import { usePlaidLink } from "react-plaid-link";

import { AccountConnections } from "../../components/dashboard/Connections/AccountConnections";
import { DashboardStats } from "../../components/dashboard/DashboardStats";
import { RecentActivity } from "../../components/dashboard/Transactions/RecentActivity";
import { CashFlowChart } from "../../components/dashboard/Transactions/CashFlowChart";

const LoadingSkeleton = ({ height = 200 }) => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="40%" height={30} sx={{ mb: 1 }} />
    <Skeleton variant="rectangular" height={height} />
  </Box>
);

export const AdminDashboard = () => {
  const { isLoggedIn, profile } = useUserStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const [loading, setLoading] = useState({
    banks: false,
    transactions: false,
    categories: false,
    summary: false,
    sync: false,
    linkToken: false,
  });

  const [error, setError] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);
  const [plaidLinkToken, setPlaidLinkToken] = useState(null);

  const fetchData = useCallback(async (endpoint, setter, key) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const data = await getData(endpoint);
      setter(data);
      setError(null);
    } catch (err) {
      setError(`Failed to load ${key}`);
      console.error(`Error loading ${key}:`, err);
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  }, []);

  const loadAllData = useCallback(() => {
    fetchData("/plaid/banks", setBanks, "banks");
    fetchData("/tax/transactions", setTransactions, "transactions");
    fetchData("/tax/categories", setCategories, "categories");
  }, [fetchData]);

  const fetchSummary = useCallback(async () => {
    setLoading((prev) => ({ ...prev, summary: true }));
    try {
      const data = await getData("/dashboard/stats");
      setSummaryData(data);
      setError(null);
    } catch (err) {
      setError("Failed to load dashboard summary");
      console.error("Error loading dashboard summary:", err);
    } finally {
      setLoading((prev) => ({ ...prev, summary: false }));
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadAllData();
      fetchSummary();
    }
  }, [isLoggedIn, loadAllData, fetchSummary]);

  const updateTransactionCategory = useCallback(
    async (transactionId, categoryId) => {
      const prevTransactions = [...transactions];
      setTransactions((trs) =>
        trs.map((t) =>
          t.transaction_id === transactionId
            ? {
                ...t,
                category_id: categoryId,
                category_name: categories.find(
                  (c) => c.category_id === categoryId
                )?.name,
              }
            : t
        )
      );
      try {
        await putData(`/tax/transactions/${transactionId}/category`, {
          categoryId,
        });
      } catch (err) {
        console.error("Failed to update category:", err);
        setError("Failed to update category");
        setTransactions(prevTransactions);
      }
    },
    [transactions, categories]
  );

  const syncTransactions = useCallback(
    async (isInitial = false) => {
      setLoading((prev) => ({ ...prev, sync: true }));
      setSyncMessage(
        isInitial ? "Performing initial sync..." : "Syncing transactions..."
      );
      try {
        const endpoint = isInitial ? "/plaid/sync/initial" : "/plaid/sync";
        const result = await postData(endpoint, {});
        setSyncMessage(`Successfully imported ${result.imported} transactions`);
        loadAllData();
        fetchSummary();
        setTimeout(() => setSyncMessage(null), 3000);
      } catch (err) {
        console.error("Sync failed:", err);
        setError("Failed to sync transactions");
        setSyncMessage(null);
      } finally {
        setLoading((prev) => ({ ...prev, sync: false }));
      }
    },
    [loadAllData, fetchSummary]
  );

  // Fetch Plaid Link token
  const fetchLinkToken = useCallback(async () => {
    setLoading((prev) => ({ ...prev, linkToken: true }));
    try {
      const response = await postData("/plaid/link-token", {});
      setPlaidLinkToken(response.link_token);
      setError(null);
    } catch (err) {
      setError("Failed to get Plaid link token");
      console.error("Plaid link token error:", err);
    } finally {
      setLoading((prev) => ({ ...prev, linkToken: false }));
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: plaidLinkToken,
    onSuccess: async (public_token) => {
      setError(null);
      try {
        await postData("/plaid/exchange-token", { public_token });
        await fetchData("/plaid/banks", setBanks, "banks");
        await syncTransactions(true);
        setPlaidLinkToken(null);
      } catch (err) {
        console.error("Plaid linking error:", err);
        setError("Failed to link bank account");
      }
    },
  });

  useEffect(() => {
    if (plaidLinkToken && ready) {
      open();
    }
  }, [plaidLinkToken, ready, open]);

  if (
    loading.banks ||
    loading.transactions ||
    loading.categories ||
    loading.summary
  ) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LoadingSkeleton height={100} />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <LoadingSkeleton />
          </Grid>
          <Grid item xs={12} md={4}>
            <LoadingSkeleton />
          </Grid>
        </Grid>
        <LoadingSkeleton height={400} />
      </Container>
    );
  }

  const unreviewedTransactionsCount = transactions.filter(
    (t) => !t.is_reviewed
  ).length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            mb: 1,
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: isMobile ? '1.75rem' : '2.125rem'
          }}
        >
          {`Welcome back${profile?.first_name ? ", " + profile.first_name : ""}!`}
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontSize: '1rem',
            fontWeight: 500
          }}
        >
          Here's your tax optimization overview.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            border: `1px solid ${theme.palette.error.light}`,
            '& .MuiAlert-icon': {
              color: theme.palette.error.main
            }
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {syncMessage && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            border: `1px solid ${theme.palette.info.light}`,
            '& .MuiAlert-icon': {
              color: theme.palette.info.main
            }
          }}
        >
          {syncMessage}
        </Alert>
      )}

      {/* Dashboard Content */}
      <Box sx={{ mb: 4 }}>
        {/* Row 1: AI Insights + Stats */}
        {summaryData && (
          <Box sx={{ mb: 4 }}>
            <DashboardStats data={summaryData} transactions={transactions} />
          </Box>
        )}

        {/* Row 2: Connected Accounts + Cash Flow Chart */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={5}>
            <AccountConnections
              linkedAccounts={banks}
              loading={loading.banks}
              onSync={syncTransactions}
              syncing={loading.sync}
              formatDate={(dateString) =>
                dateString
                  ? new Date(dateString).toLocaleString()
                  : "Never synced"
              }
            />
          </Grid>
          
          <Grid item xs={12} lg={7}>
            <CashFlowChart 
              loading={loading.transactions}
            />
          </Grid>
        </Grid>

        {/* Row 3: Recent Activity + Quick Actions */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <RecentActivity 
              transactions={transactions}
              loading={loading.transactions}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            {/* Quick Actions Card */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography sx={{ color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                      !
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      fontSize: '1rem'
                    }}
                  >
                    Quick Actions
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    sx={{ 
                      borderRadius: 2, 
                      textTransform: 'none',
                      fontWeight: 600,
                      justifyContent: 'flex-start'
                    }}
                  >
                    Export for Accountant
                  </Button>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    sx={{ 
                      borderRadius: 2, 
                      textTransform: 'none',
                      fontWeight: 600,
                      justifyContent: 'flex-start'
                    }}
                  >
                    View Tax Report
                  </Button>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    sx={{ 
                      borderRadius: 2, 
                      textTransform: 'none',
                      fontWeight: 600,
                      justifyContent: 'flex-start'
                    }}
                  >
                    Calculate Quarterly Payment
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};