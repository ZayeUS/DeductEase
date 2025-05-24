// components/dashboard/TransactionList.jsx
import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Divider,
  useTheme,
  alpha,
  Button,
  LinearProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Receipt as ReceiptIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { postData } from '../../../utils/BackendRequestHelper';
import { TransactionHeader } from './TransactionHeader';
import { TransactionTable } from './TransactionTable';
import { CategorizeLoadingModal } from '../CategorizeLoadingModal';

const TAX_JOKES = [
  "Why did the accountant break up with the tax return? It had too many issues!",
  "What's the difference between death and taxes? Death doesn't get worse every time Congress meets!",
  "Why don't tax accountants read novels? Because the only numbers in them are page numbers!",
  "How do you know you've found a good tax accountant? They have a loophole named after them!",
  "What do you call a tax auditor with an opinion? Wrong!",
  "Why did the tax form go to therapy? It had too many dependents!",
  "What's a CPA's favorite exercise? Number crunching!",
  "Why was the math book sad during tax season? It had too many problems!",
  "What's the definition of an optimist? A tax payer with a pencil!",
  "Why don't sharks attack tax attorneys? Professional courtesy!"
];

export const TransactionList = ({ 
  transactions, 
  categories, 
  loading, 
  onUpdateCategory,
  updatingTransaction,
  maxHeight = 600,
  onTransactionsChange
}) => {
  const theme = useTheme();
  const [categorizing, setCategorizing] = useState(false);
  const [categoryProgress, setCategoryProgress] = useState(0);
  const [currentJoke, setCurrentJoke] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const progressRef = useRef(null);

  // Calculate stats
  const uncategorizedCount = transactions.filter(t => !t.category_id).length;
  const unreviewedCount = transactions.filter(t => !t.is_reviewed).length;

  // Smooth progress animation using requestAnimationFrame
  const animateProgress = (startTime, duration) => {
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      setCategoryProgress(progress);
      
      if (progress < 100 && progressRef.current) {
        progressRef.current = requestAnimationFrame(animate);
      }
    };
    
    progressRef.current = requestAnimationFrame(animate);
  };

  // Handle auto-categorize with smooth progress
  const handleAutoCategorize = async () => {
    setCategorizing(true);
    setCurrentJoke(Math.floor(Math.random() * TAX_JOKES.length));
    setCategoryProgress(0);

    // Rotate jokes every 6 seconds
    const jokeInterval = setInterval(() => {
      setCurrentJoke(prev => (prev + 1) % TAX_JOKES.length);
    }, 6000);

    // Start smooth progress animation
    const startTime = Date.now();
    animateProgress(startTime, 19000); // 19 seconds

    try {
      const response = await postData('/plaid/auto-categorize', {});
      
      // Keep loading screen open for at least 20 seconds
      const minLoadingTime = 20000;
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
      
      // Clean up
      clearInterval(jokeInterval);
      if (progressRef.current) {
        cancelAnimationFrame(progressRef.current);
      }
      setCategorizing(false);
      setCategoryProgress(0);
      
      if (response.categorized > 0) {
        setSuccessMessage(`Successfully categorized ${response.categorized} transactions!`);
        setShowSuccess(true);
        if (onTransactionsChange) {
          onTransactionsChange();
        }
      } else {
        setSuccessMessage('No uncategorized transactions found.');
        setShowSuccess(true);
      }
    } catch (error) {
      clearInterval(jokeInterval);
      if (progressRef.current) {
        cancelAnimationFrame(progressRef.current);
      }
      setCategorizing(false);
      setCategoryProgress(0);
      console.error('Error categorizing transactions:', error);
      setSuccessMessage('Error categorizing transactions');
      setShowSuccess(true);
    }
  };

  return (
    <>
      <CategorizeLoadingModal
        open={categorizing}
        progress={categoryProgress}
        currentJoke={TAX_JOKES[currentJoke]}
      />
      
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <TransactionHeader
            transactions={transactions}
            uncategorizedCount={uncategorizedCount}
            unreviewedCount={unreviewedCount}
          />
          
          <Divider sx={{ mb: 3 }} />
          
          {loading || categories.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : transactions.length > 0 ? (
            <>
              {uncategorizedCount > 0 && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleAutoCategorize} 
                  disabled={categorizing}
                  startIcon={<AutoAwesomeIcon />}
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Auto-Categorize {uncategorizedCount} Transaction{uncategorizedCount !== 1 ? 's' : ''}
                </Button>
              )}

              <TransactionTable
                transactions={transactions}
                categories={categories}
                onUpdateCategory={onUpdateCategory}
                updatingTransaction={updatingTransaction}
                maxHeight={maxHeight}
              />
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <ReceiptIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2, opacity: 0.5 }} />
              <Typography color="text.secondary" variant="h6" sx={{ mb: 1 }}>
                No transactions found
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Connect your bank account to start tracking transactions
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
};