import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { 
  Building2,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getAccountTypeColor = (type, theme) => {
  const colors = {
    checking: theme.palette.success.main,
    savings: theme.palette.info.main,
    credit: theme.palette.warning.main,
    investment: theme.palette.secondary.main,
    loan: theme.palette.error.main
  };
  return colors[type?.toLowerCase()] || theme.palette.primary.main;
};

const SyncStatusIcon = ({ lastSync, theme }) => {
  if (!lastSync) {
    return <AlertTriangle size={16} color={theme.palette.warning.main} />;
  }
  
  const hoursAgo = (new Date() - new Date(lastSync)) / (1000 * 60 * 60);
  
  if (hoursAgo < 24) {
    return <CheckCircle2 size={16} color={theme.palette.success.main} />;
  } else {
    return <Clock size={16} color={theme.palette.warning.main} />;
  }
};

const AccountRow = ({ account, theme }) => {
  const typeColor = getAccountTypeColor(account.account_type, theme);
  
  return (
    <Box 
      sx={{ 
        p: 2.5, 
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          borderColor: alpha(theme.palette.primary.main, 0.2)
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          bgcolor: typeColor,
          opacity: 0.8
        }
      }}
    >
      {/* Bank Logo Placeholder */}
      <Box
        sx={{
          width: 40,
          height: 40,
          bgcolor: alpha(typeColor, 0.1),
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Building2 size={20} color={typeColor} />
      </Box>
      
      {/* Account Info */}
      <Box sx={{ flex: 1 }}>
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 0.5
          }}
        >
          {account.account_name}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip 
            size="small" 
            label={account.account_type?.toLowerCase() || 'account'}
            sx={{ 
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: alpha(typeColor, 0.15),
              color: typeColor,
              textTransform: 'capitalize',
              '& .MuiChip-label': { px: 1 }
            }}
          />
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            •••• {account.last_four}
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontSize: '0.75rem'
            }}
          >
            {account.institution_name}
          </Typography>
        </Box>
      </Box>
      
      {/* Sync Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SyncStatusIcon lastSync={account.last_sync} theme={theme} />
      </Box>
    </Box>
  );
};

export const AccountConnections = ({ 
  linkedAccounts = [], 
  loading = false, 
  onSync, 
  syncing = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const accounts = linkedAccounts || [];

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Building2 size={20} color={theme.palette.primary.main} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary
              }}
            >
              Connected Accounts
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {accounts.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={syncing ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
                onClick={() => onSync(false)}
                disabled={syncing}
                sx={{ 
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.8rem'
                }}
              >
                {syncing ? "Syncing" : "Sync"}
              </Button>
            )}

            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={14} />}
              onClick={() => navigate('/connect')}
              sx={{ 
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.8rem'
              }}
            >
              Add Account
            </Button>
          </Box>
        </Box>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : accounts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Building2 
              size={48} 
              color={theme.palette.text.disabled}
              style={{ opacity: 0.4, marginBottom: 16 }}
            />
            <Typography 
              variant="h6" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 600,
                mb: 1
              }}
            >
              No accounts connected
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                mb: 3,
                maxWidth: 260,
                mx: 'auto'
              }}
            >
              Connect your first bank account to start tracking transactions
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => navigate('/connect')}
              sx={{ 
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none'
              }}
            >
              Connect Account
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {accounts.map((account) => (
              <AccountRow 
                key={account.account_id}
                account={account}
                theme={theme}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};