import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Paper,
  Alert
} from '@mui/material';
import {
  FileText,
  Download,
  Calendar,
  Calculator,
  BarChart3,
  Receipt
} from 'lucide-react';
import { ProfitLossReport } from '../../components/reports/ProfitLossReport'
import { MonthlySummaryReport } from '../../components/reports/MonthlySummaryReport';
import { TaxSummaryReport } from '../../components/reports/TaxSummaryReport';
import { getData } from '../../utils/BackendRequestHelper';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`reports-tabpanel-${index}`}
    aria-labelledby={`reports-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

export const Reports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState('ytd');
  const [downloading, setDownloading] = useState(false);

  // Generate year options (current year and 2 previous years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  // Date range options
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'ytd':
        return {
          startDate: new Date(selectedYear, 0, 1).toISOString(),
          endDate: now.toISOString()
        };
      case 'q4':
        return {
          startDate: new Date(selectedYear, 9, 1).toISOString(),
          endDate: new Date(selectedYear, 11, 31, 23, 59, 59).toISOString()
        };
      case 'q3':
        return {
          startDate: new Date(selectedYear, 6, 1).toISOString(),
          endDate: new Date(selectedYear, 8, 30, 23, 59, 59).toISOString()
        };
      case 'q2':
        return {
          startDate: new Date(selectedYear, 3, 1).toISOString(),
          endDate: new Date(selectedYear, 5, 30, 23, 59, 59).toISOString()
        };
      case 'q1':
        return {
          startDate: new Date(selectedYear, 0, 1).toISOString(),
          endDate: new Date(selectedYear, 2, 31, 23, 59, 59).toISOString()
        };
      default:
        return {
          startDate: new Date(selectedYear, 0, 1).toISOString(),
          endDate: now.toISOString()
        };
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleExport = async (format = 'csv') => {
    try {
      setDownloading(true);
      const { startDate, endDate } = getDateRange();
      
      const params = new URLSearchParams({
        format,
        startDate,
        endDate
      });

      // Create a temporary link and trigger download
      const response = await fetch(`/api/reports/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `financial-report-${selectedYear}-${dateRange}.${format}`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      // You might want to show an error message to the user here
    } finally {
      setDownloading(false);
    }
  };

  const { startDate, endDate } = getDateRange();

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
          Financial Reports
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontSize: '1rem',
            fontWeight: 500
          }}
        >
          Comprehensive financial analysis and tax reporting
        </Typography>
      </Box>

      {/* Controls */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2, 
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between'
        }}>
          {/* Date Controls */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexDirection: isMobile ? 'column' : 'row',
            flex: 1
          }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {yearOptions.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={dateRange}
                label="Period"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="ytd">Year to Date</MenuItem>
                <MenuItem value="q4">Q4 (Oct-Dec)</MenuItem>
                <MenuItem value="q3">Q3 (Jul-Sep)</MenuItem>
                <MenuItem value="q2">Q2 (Apr-Jun)</MenuItem>
                <MenuItem value="q1">Q1 (Jan-Mar)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Export Button */}
          <Button
            variant="contained"
            startIcon={<Download size={18} />}
            onClick={() => handleExport('csv')}
            disabled={downloading}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              minWidth: isMobile ? 'auto' : 180
            }}
          >
            {downloading ? 'Exporting...' : 'Export CSV'}
          </Button>
        </Box>

        {/* Period Display */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Reporting Period:</strong> {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
          </Typography>
        </Alert>
      </Paper>

      {/* Tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            sx={{
              px: 3,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                minHeight: 48
              }
            }}
          >
            <Tab 
              icon={<Receipt size={18} />} 
              iconPosition="start"
              label="Profit & Loss" 
              id="reports-tab-0"
              aria-controls="reports-tabpanel-0"
            />
            <Tab 
              icon={<BarChart3 size={18} />} 
              iconPosition="start"
              label="Monthly Summary" 
              id="reports-tab-1"
              aria-controls="reports-tabpanel-1"
            />
            <Tab 
              icon={<Calculator size={18} />} 
              iconPosition="start"
              label="Tax Summary" 
              id="reports-tab-2"
              aria-controls="reports-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <ProfitLossReport 
              startDate={startDate} 
              endDate={endDate}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <MonthlySummaryReport 
              year={selectedYear}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <TaxSummaryReport 
              year={selectedYear}
            />
          </TabPanel>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Actions
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FileText size={18} />}
            onClick={() => handleExport('csv')}
            disabled={downloading}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            Export for Accountant
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Calculator size={18} />}
            onClick={() => setActiveTab(2)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            View Tax Deductions
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Calendar size={18} />}
            onClick={() => {
              setDateRange('q4');
              setActiveTab(1);
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            Q4 Tax Planning
          </Button>
        </Box>
      </Box>
    </Container>
  );
};