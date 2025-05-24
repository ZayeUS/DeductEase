// src/components/dashboard/TaxResourcesPanel.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CardContent,
  Divider,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  MenuBook as MenuBookIcon,
  LightbulbOutlined as LightbulbIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  School as SchoolIcon,
  DateRange as DateRangeIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const TaxResourcesPanel = ({ businessType = 'sole_proprietor' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  // Start with no accordions expanded
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Current tax year
  const taxYear = new Date().getFullYear();

  // Format business type for display
  const formatBusinessType = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get quarterly dates based on current year
  const getQuarterlyDates = () => {
    return [
      {
        quarter: 1,
        dueDate: `April 15, ${taxYear}`,
        period: `January 1 - March 31, ${taxYear}`
      },
      {
        quarter: 2,
        dueDate: `June 15, ${taxYear}`,
        period: `April 1 - May 31, ${taxYear}`
      },
      {
        quarter: 3,
        dueDate: `September 15, ${taxYear}`,
        period: `June 1 - August 31, ${taxYear}`
      },
      {
        quarter: 4,
        dueDate: `January 15, ${taxYear + 1}`,
        period: `September 1 - December 31, ${taxYear}`
      }
    ];
  };

  // Get current quarter
  const getCurrentQuarter = () => {
    const currentMonth = new Date().getMonth() + 1; // JS months are 0-indexed
    if (currentMonth >= 1 && currentMonth <= 3) return 1;
    if (currentMonth >= 4 && currentMonth <= 5) return 2;
    if (currentMonth >= 6 && currentMonth <= 8) return 3;
    return 4;
  };

  // Get business-specific tax tips
  const getTaxTip = () => {
    // Common tips for all business types
    const commonTips = [
      {
        title: "Home Office Deduction",
        description: "You may qualify if you use part of your home exclusively for business.",
        link: "https://www.irs.gov/businesses/small-businesses-self-employed/home-office-deduction"
      },
      {
        title: "Business Travel Deductions",
        description: "Track your business travel expenses for potential significant deductions.",
        link: "https://www.irs.gov/taxtopics/tc511"
      }
    ];
    
    // Business-specific tips
    const businessTips = {
      sole_proprietor: [
        {
          title: "Self-Employment Tax Deduction",
          description: "Deduct 50% of your self-employment tax on your personal tax return.",
          link: "https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes"
        },
        {
          title: "Qualified Business Income Deduction",
          description: "May qualify for up to 20% deduction on qualified business income.",
          link: "https://www.irs.gov/newsroom/qualified-business-income-deduction"
        }
      ],
      llc: [
        {
          title: "LLC Tax Flexibility",
          description: "Single-member LLCs can choose how they want to be taxed: as a sole proprietor, S-corp, or C-corp.",
          link: "https://www.irs.gov/businesses/small-businesses-self-employed/limited-liability-company-llc"
        },
        {
          title: "Pass-Through Taxation",
          description: "Profits and losses typically pass through to your personal tax return.",
          link: "https://www.irs.gov/businesses/small-businesses-self-employed/single-member-limited-liability-companies"
        }
      ],
      s_corp: [
        {
          title: "S-Corp Salary Requirements",
          description: "Must pay yourself a reasonable salary subject to employment taxes.",
          link: "https://www.irs.gov/businesses/small-businesses-self-employed/s-corporation-compensation-and-medical-insurance-issues"
        },
        {
          title: "Distributions vs. Salary",
          description: "Distributions beyond salary aren't subject to self-employment tax.",
          link: "https://www.irs.gov/businesses/small-businesses-self-employed/s-corporations"
        }
      ],
      c_corp: [
        {
          title: "Corporate Tax Rate",
          description: "Flat 21% tax rate on corporate profits with potential double taxation.",
          link: "https://www.irs.gov/businesses/small-businesses-self-employed/corporations"
        },
        {
          title: "Fringe Benefits",
          description: "C-Corps can deduct health insurance, life insurance and other benefits for employees.",
          link: "https://www.irs.gov/pub/irs-pdf/p15b.pdf"
        }
      ]
    };
    
    // Combine common tips with business-specific tips
    const allTips = [...commonTips, ...(businessTips[businessType] || [])];
    
    // Choose tip based on month for variety
    const currentMonth = new Date().getMonth();
    return allTips[currentMonth % allTips.length];
  };

  // Get business-specific resources
  const getBusinessResources = () => {
    const commonResources = [
      {
        title: "Form 1040-ES (Estimated Tax)",
        link: "https://www.irs.gov/forms-pubs/about-form-1040-es"
      },
      {
        title: "Publication 505 (Tax Withholding)",
        link: "https://www.irs.gov/pub/irs-pdf/p505.pdf"
      }
    ];
    
    const businessResources = {
      sole_proprietor: [
        {
          title: "Schedule C (Profit or Loss)",
          link: "https://www.irs.gov/forms-pubs/about-schedule-c-form-1040"
        },
        {
          title: "Self-Employed Tax Center",
          link: "https://www.irs.gov/businesses/small-businesses-self-employed/self-employed-individuals-tax-center"
        }
      ],
      llc: [
        {
          title: "LLC Filing Requirements",
          link: "https://www.irs.gov/businesses/small-businesses-self-employed/limited-liability-company-llc"
        },
        {
          title: "Form 8832 (Entity Classification)",
          link: "https://www.irs.gov/forms-pubs/about-form-8832"
        }
      ],
      s_corp: [
        {
          title: "Form 1120-S (S Corporation Tax Return)",
          link: "https://www.irs.gov/forms-pubs/about-form-1120s"
        },
        {
          title: "Form 2553 (S Election)",
          link: "https://www.irs.gov/forms-pubs/about-form-2553"
        }
      ],
      c_corp: [
        {
          title: "Form 1120 (Corporation Tax Return)",
          link: "https://www.irs.gov/forms-pubs/about-form-1120"
        },
        {
          title: "Corporate Tax Guide",
          link: "https://www.irs.gov/pub/irs-pdf/p542.pdf"
        }
      ]
    };
    
    return [...commonResources, ...(businessResources[businessType] || [])];
  };

  // Get CPA criteria based on business type
  const getCpaCriteria = () => {
    const commonCriteria = [
      "Experience with agencies and digital businesses"
    ];
    
    const specificCriteria = {
      sole_proprietor: [
        "Knowledge of self-employment tax strategies",
        "Experience with home office and business deductions"
      ],
      llc: [
        "Understanding of LLC tax elections and flexibility",
        "Experience with pass-through entity taxation"
      ],
      s_corp: [
        "Expert in reasonable compensation requirements",
        "Knowledge of S corporation compliance issues"
      ],
      c_corp: [
        "Experience with corporate tax filings and strategies",
        "Knowledge of corporate benefits and executive compensation"
      ]
    };
    
    return [...commonCriteria, ...(specificCriteria[businessType] || [])];
  };

  const currentTip = getTaxTip();
  const quarterlyDates = getQuarterlyDates();
  const currentQuarter = getCurrentQuarter();
  const businessResources = getBusinessResources();
  const cpaCriteria = getCpaCriteria();

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mb: 3, 
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MenuBookIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Tax Resources
            </Typography>
          </Box>
          
          <Chip
            icon={<BusinessIcon sx={{ fontSize: '16px !important' }} />}
            label={formatBusinessType(businessType)}
            size="small"
            sx={{ 
              height: 24,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              '& .MuiChip-icon': { color: theme.palette.primary.main }
            }}
          />
        </Box>
        
        <Box sx={{ p: 2.5 }}>
          {/* Tax Strategy Spotlight - Always Visible */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.07),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ 
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              zIndex: 0
            }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <LightbulbIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="subtitle2" fontWeight="medium">
                  Tax Strategy Spotlight
                </Typography>
              </Box>
              
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
                {currentTip.title}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                {currentTip.description}
              </Typography>
              
              <Link 
                href={currentTip.link} 
                target="_blank" 
                rel="noopener"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '0.8125rem',
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Learn more <OpenInNewIcon sx={{ ml: 0.5, fontSize: 14 }} />
              </Link>
            </Box>
          </Paper>

          {/* Tax Basics Accordions - Always Collapsed by Default */}
          <Accordion 
            expanded={expanded === 'quarterly'} 
            onChange={handleChange('quarterly')}
            elevation={0}
            sx={{ 
              mb: 1.5, 
              bgcolor: 'transparent',
              '&:before': { display: 'none' }, // Remove the default divider
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px !important',
              overflow: 'hidden'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 2, py: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1, fontSize: 20, color: theme.palette.primary.main }} />
                <Typography variant="subtitle2">What are Quarterly Taxes?</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                {businessType === 'c_corp' ? (
                  'Corporations typically pay estimated taxes in 4 equal installments if they expect to owe $500 or more in taxes.'
                ) : (
                  'Quarterly taxes are estimated tax payments made four times a year by self-employed individuals and businesses that don\'t have taxes withheld from their income.'
                )}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                {businessType === 'c_corp' ? (
                  'Use Form 1120-W to calculate your estimated tax payments.'
                ) : (
                  'The IRS requires quarterly estimated tax payments if you expect to owe $1,000 or more when you file your return.'
                )}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {taxYear} Quarterly Due Dates:
              </Typography>
              <List dense disablePadding>
                {quarterlyDates.map((quarter) => (
                  <ListItem 
                    key={quarter.quarter} 
                    disablePadding 
                    sx={{ 
                      mb: 0.5,
                      py: 0.5,
                      bgcolor: currentQuarter === quarter.quarter ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                      borderRadius: 1,
                      pl: 1
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <DateRangeIcon 
                        fontSize="small" 
                        sx={{ 
                          color: currentQuarter === quarter.quarter ? theme.palette.primary.main : 'text.secondary',
                          fontSize: 18
                        }} 
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Q${quarter.quarter}: Due ${quarter.dueDate}`}
                      secondary={quarter.period}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        fontWeight: currentQuarter === quarter.quarter ? 'medium' : 'regular'
                      }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 2, p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.08), borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                  {businessType === 'c_corp' 
                    ? 'Use Form 1120-W worksheet to calculate your corporation\'s estimated tax.'
                    : businessType === 's_corp'
                      ? 'S corporations make estimated tax payments only for certain taxes, while shareholders make individual estimated payments.'
                      : 'Use Form 1040-ES to calculate and pay your quarterly estimated taxes.'}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
          
          <Accordion 
            expanded={expanded === 'cpa'} 
            onChange={handleChange('cpa')}
            elevation={0}
            sx={{ 
              mb: 1.5, 
              bgcolor: 'transparent',
              '&:before': { display: 'none' }, // Remove the default divider
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px !important',
              overflow: 'hidden'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 2, py: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, fontSize: 20, color: theme.palette.primary.main }} />
                <Typography variant="subtitle2">How to Find a CPA</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                A qualified CPA can help maximize your deductions and ensure proper tax compliance for your {formatBusinessType(businessType)}.
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                What to look for in a CPA:
              </Typography>
              <List dense disablePadding sx={{ mb: 2 }}>
                {cpaCriteria.map((criteria, index) => (
                  <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon fontSize="small" sx={{ fontSize: 16, color: theme.palette.success.main }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={criteria} 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<SearchIcon />}
                onClick={() => window.open('https://www.aicpa.org/forthepublic/findacpa', '_blank')}
                sx={{ mb: 1 }}
              >
                Find a CPA Near Me
              </Button>
              <Typography variant="caption" color="text.secondary">
                Opens AICPA's CPA directory in a new window
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Useful Resources - Always Visible */}
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Resources for {formatBusinessType(businessType)}s
          </Typography>
          
          <List dense disablePadding>
            {businessResources.map((resource, index) => (
              <ListItem 
                key={index}
                disablePadding 
                component={Link}
                href={resource.link}
                target="_blank"
                rel="noopener"
                sx={{ 
                  mb: 1,
                  display: 'flex',
                  textDecoration: 'none',
                  color: 'text.primary',
                  '&:hover': { color: theme.palette.primary.main }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LinkIcon sx={{ fontSize: 18, color: 'inherit' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={resource.title} 
                  primaryTypographyProps={{ variant: 'body2' }}
                />
                <OpenInNewIcon sx={{ fontSize: 14, color: 'text.secondary', ml: 1 }} />
              </ListItem>
            ))}
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SchoolIcon sx={{ fontSize: 18, color: theme.palette.primary.main, mr: 1 }} />
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/tax-learning-center')}
              sx={{ 
                fontSize: '0.8125rem',
                textTransform: 'none'
              }}
            >
              Visit Tax Learning Center
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Paper>
  );
};

// Missing import for the check mark icon in the CPA section
const CheckCircleIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
    </svg>
  );
};

// Missing import for the search icon
const SearchIcon = () => {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor" />
    </svg>
  );
};

export default TaxResourcesPanel;