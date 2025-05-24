// components/dashboard/TransactionHeader.jsx
import React from 'react';
import {
  Box,
  Typography,
  useTheme
} from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

export const TransactionHeader = ({ 
  transactions, 
  uncategorizedCount, 
  unreviewedCount 
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ReceiptIcon sx={{ fontSize: 28, mr: 2, color: theme.palette.primary.main }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {transactions.length} total • {unreviewedCount} need review • {uncategorizedCount} uncategorized
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};