import { createTheme } from '@mui/material/styles';

const baseConfig = {
  fontFamily: "'Inter', sans-serif",
  borderRadius: 2,
};

const darkConfig = {
  ...baseConfig,
  mode: 'dark',
  primary: '#60A5FA',         // Brighter blue for dark mode (blue-400)
  secondary: '#4ADE80',       // Brighter green for dark mode (green-400)
  background: '#0F1419',      
  paper: '#1A1F26',           
  text: '#E7E9EA',            
  textSecondary: '#8B98A5',   
};

const lightConfig = {
  ...baseConfig,
  mode: 'light',
  primary: '#1E3A8A',         // Deep blue works better in light mode
  secondary: '#059669',       // Darker green for light mode
  background: '#FAFAFA',      
  paper: '#FFFFFF',           
  text: '#1A1B1F',            
  textSecondary: '#536471',   
};

const createAppTheme = (mode = 'dark') => {
  const config = mode === 'dark' ? darkConfig : lightConfig;

  return createTheme({
    palette: {
      mode: config.mode,
      primary: { main: config.primary },
      secondary: { main: config.secondary },
      background: {
        default: config.background,
        paper: config.paper,
      },
      text: {
        primary: config.text,
        secondary: config.textSecondary,
      },
      error: {
        main: mode === 'dark' ? '#F87171' : '#DC2626', // Red-400/600
      },
      success: {
        main: mode === 'dark' ? '#4ADE80' : '#16A34A', // Green-400/600
      },
      warning: {
        main: mode === 'dark' ? '#FACC15' : '#CA8A04', // Yellow-400/600
      },
      info: {
        main: mode === 'dark' ? '#60A5FA' : '#2563EB', // Blue-400/600
      },
    },
    typography: {
      fontFamily: config.fontFamily,
      h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.02em' },
      h2: { fontWeight: 600, fontSize: '2rem', letterSpacing: '-0.02em' },
      h3: { fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.01em' },
      h4: { fontWeight: 600, fontSize: '1.25rem' },
      h5: { fontWeight: 500, fontSize: '1.125rem' },
      h6: { fontWeight: 500, fontSize: '1rem' },
      body1: { fontSize: '1rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.6 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: config.borderRadius,
            padding: '8px 16px',
            transition: 'all 0.2s ease',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: config.borderRadius * 2,
            boxShadow: mode === 'dark' 
              ? '0 1px 3px rgba(0, 0, 0, 0.3)'
              : '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.05)'
              : '1px solid rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              },
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 52,
            height: 26,
            padding: 0,
            '& .MuiSwitch-switchBase': {
              padding: 0,
              margin: 2,
              transitionDuration: '300ms',
              '&.Mui-checked': {
                transform: 'translateX(26px)',
                color: '#fff',
                '& + .MuiSwitch-track': {
                  backgroundColor: config.secondary,
                  opacity: 1,
                  border: 0,
                },
              },
            },
            '& .MuiSwitch-thumb': {
              boxSizing: 'border-box',
              width: 22,
              height: 22,
            },
            '& .MuiSwitch-track': {
              borderRadius: 13,
              backgroundColor: mode === 'dark' ? '#39434E' : '#E9ECEF',
              opacity: 1,
              transition: createTheme().transitions.create(['background-color'], {
                duration: 500,
              }),
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.05)'
              : '1px solid rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    shape: {
      borderRadius: config.borderRadius,
    },
  });
};

const theme = createAppTheme('dark');
export { createAppTheme };
export default theme;