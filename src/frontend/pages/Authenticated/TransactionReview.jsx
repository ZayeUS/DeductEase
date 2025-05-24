import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  LinearProgress,
  Alert,
  useTheme,
  IconButton,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Home as HomeIcon,
  CheckCircle as CompleteIcon,
  Info as InfoIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { getData, putData } from '../../utils/BackendRequestHelper';

export const TransactionReview = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState({});
  const [saving, setSaving] = useState(false);

  // Bulk approve state
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState(false);
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [txRes, catRes] = await Promise.all([
        getData('/tax/transactions'),
        getData('/tax/categories')
      ]);
      const unreviewed = txRes.filter(t => !t.is_reviewed);

      // Initialize AI suggested categories
      const initialSelections = {};
      unreviewed.forEach(t => {
        if (t.category_id) initialSelections[t.transaction_id] = t.category_id;
      });

      setTransactions(unreviewed);
      setCategories(catRes);
      setSelectedCategories(initialSelections);
      setLoading(false);
    } catch {
      setError('Failed to load transactions.');
      setLoading(false);
    }
  }

  const currentTransaction = transactions[currentIndex];
  const totalTransactions = transactions.length;

  const handleCategoryChange = (catId) => {
    setSelectedCategories(prev => ({ ...prev, [currentTransaction.transaction_id]: catId }));
  };

  const saveCategoryAndNext = async () => {
    if (!currentTransaction) return;

    const categoryId = selectedCategories[currentTransaction.transaction_id];
    if (!categoryId) {
      setError('Please select a category before proceeding.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await putData(`/tax/transactions/${currentTransaction.transaction_id}/category`, { categoryId });
      if (currentIndex + 1 < transactions.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('Failed to save category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Bulk approve all AI suggestions
  const handleBulkApproveAll = async () => {
    const transactionsWithSuggestions = transactions.filter(t => t.category_id);

    if (transactionsWithSuggestions.length === 0) {
      setError('No AI suggestions available to approve.');
      return;
    }

    setBulkApproving(true);
    setError(null);

    try {
      const batchSize = 10;
      let approvedCount = 0;

      for (let i = 0; i < transactionsWithSuggestions.length; i += batchSize) {
        const batch = transactionsWithSuggestions.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (t) => {
            try {
              await putData(`/tax/transactions/${t.transaction_id}/category`, { categoryId: t.category_id });
              approvedCount++;
            } catch (err) {
              console.error(`Failed to approve transaction ${t.transaction_id}:`, err);
            }
          })
        );
      }

      setBulkSuccess(true);
      setBulkSuccessMessage(`Successfully approved ${approvedCount} transactions.`);
      
      // Reload data for fresh state
      await loadData();

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch {
      setError('Failed to approve all transactions.');
    } finally {
      setBulkApproving(false);
    }
  };

  if (loading) return (
    <Container sx={{ py: 6, textAlign: 'center' }}>
      <CircularProgress size={48} />
      <Typography variant="h6" sx={{ mt: 2 }}>Loading transactions...</Typography>
    </Container>
  );

  if (transactions.length === 0) return (
    <Container sx={{ py: 6, textAlign: 'center' }}>
      <CompleteIcon sx={{ fontSize: 72, color: theme.palette.success.main }} />
      <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
        All caught up!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        All transactions have been reviewed.
      </Typography>
      <Button variant="contained" size="large" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </Button>
    </Container>
  );

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Review Transactions</Typography>
        <IconButton onClick={() => navigate('/dashboard')} aria-label="Go back to dashboard">
          <HomeIcon />
        </IconButton>
      </Box>

      {/* Bulk Approve Button */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          color="warning"
          size="large"
          startIcon={bulkApproving ? <CircularProgress size={24} color="inherit" /> : <AutoAwesomeIcon />}
          onClick={handleBulkApproveAll}
          disabled={bulkApproving || transactions.filter(t => t.category_id).length === 0}
          fullWidth
          sx={{ fontWeight: 'bold', py: 1.5 }}
          aria-label="Bulk approve all AI suggested categories"
        >
          {bulkApproving 
            ? 'Processing...'
            : `Approve All ${transactions.filter(t => t.category_id).length} AI Suggestions`}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {bulkSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {bulkSuccessMessage}
        </Alert>
      )}

      {/* Progress */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Transaction {currentIndex + 1} of {totalTransactions}
      </Typography>
      <LinearProgress variant="determinate" value={((currentIndex + 1) / totalTransactions) * 100} sx={{ mb: 3, height: 8, borderRadius: 4 }} />

      {/* Single Transaction Review Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {currentTransaction.amount > 0
              ? <TrendingDownIcon sx={{ color: theme.palette.error.main }} />
              : <TrendingUpIcon sx={{ color: theme.palette.success.main }} />
            }
            <Typography variant="h5" fontWeight="bold">
              ${Math.abs(currentTransaction.amount).toFixed(2)}
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ mb: 1 }}>{currentTransaction.description}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {new Date(currentTransaction.transaction_date).toLocaleDateString()}
          </Typography>

          {currentTransaction.ai_explanation && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                🤖 AI says: {currentTransaction.ai_explanation}
              </Typography>
            </Alert>
          )}

          <FormControl fullWidth>
            <Select
              value={selectedCategories[currentTransaction.transaction_id] || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={saving}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) return <Typography color="text.secondary">Select category</Typography>;
                const cat = categories.find(c => c.category_id === selected);
                return cat?.name || selected;
              }}
              aria-label="Select category for transaction"
            >
              <MenuItem value="" disabled>Select category</MenuItem>
              {categories
                .filter(cat => (currentTransaction.amount < 0 ? cat.type === 'EXPENSE' : cat.type === 'INCOME'))
                .map(cat => (
                  <MenuItem key={cat.category_id} value={cat.category_id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{cat.name}</Typography>
                      {cat.is_deductible && <Chip label="Deductible" color="success" size="small" sx={{ ml: 'auto' }} />}
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Button
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0 || saving}
          startIcon={<PrevIcon />}
          aria-label="Previous transaction"
        >
          Previous
        </Button>

        <Button
          variant="contained"
          onClick={saveCategoryAndNext}
          disabled={!selectedCategories[currentTransaction.transaction_id] || saving}
          aria-label="Approve and continue"
        >
          {saving ? 'Saving...' : (currentIndex === totalTransactions - 1 ? 'Finish Review' : 'Approve & Next')}
        </Button>

        <Button
          onClick={() => navigate('/dashboard')}
          disabled={saving}
          aria-label="Exit to dashboard"
        >
          Exit
        </Button>
      </Box>
    </Container>
  );
};
