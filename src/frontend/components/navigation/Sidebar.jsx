import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  Tooltip,
  Divider,
  useTheme,
  Button,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Moon, 
  Sun, 
  FileText,
  Receipt,
  Eye,
  Calculator
} from "lucide-react";
import { useUserStore } from "../../store/userStore";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";

const SidebarItem = ({ icon, label, path, isActive, onClick, isExpanded }) => {
  const theme = useTheme();

  return (
    <Tooltip title={!isExpanded ? label : ""} placement="right" arrow>
      <ListItem
        onClick={onClick}
        sx={{
          borderRadius: 3,
          mb: 1,
          px: isExpanded ? 2.5 : 1.5,
          py: 1.5,
          cursor: "pointer",
          backgroundColor: isActive ? theme.palette.primary.main : "transparent",
          color: isActive ? theme.palette.common.white : theme.palette.text.secondary,
          "&:hover": {
            backgroundColor: isActive
              ? theme.palette.primary.dark
              : theme.palette.action.hover,
            transform: "translateX(4px)",
          },
          justifyContent: isExpanded ? "flex-start" : "center",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          position: "relative",
          "&::before": isActive ? {
            content: '""',
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: "60%",
            backgroundColor: theme.palette.common.white,
            borderRadius: "0 2px 2px 0",
          } : {},
        }}
      >
        {icon}
        {isExpanded && (
          <Typography
            variant="body2"
            sx={{
              fontWeight: isActive ? 700 : 600,
              ml: 2,
              letterSpacing: 0.3,
              color: isActive ? theme.palette.common.white : theme.palette.text.primary,
              whiteSpace: "nowrap",
              fontSize: "0.875rem",
            }}
          >
            {label}
          </Typography>
        )}
      </ListItem>
    </Tooltip>
  );
};

const ThemeToggle = ({ isExpanded, isDarkMode, toggleTheme }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: isExpanded ? "space-between" : "center",
        px: isExpanded ? 2.5 : 1.5,
        py: 1.5,
        borderRadius: 3,
        backgroundColor: theme.palette.action.hover,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {isExpanded && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            letterSpacing: 0.3,
            color: theme.palette.text.primary,
            fontSize: "0.875rem",
          }}
        >
          {isDarkMode ? "Dark Mode" : "Light Mode"}
        </Typography>
      )}

      {isExpanded ? (
        <Button
          onClick={toggleTheme}
          variant="outlined"
          color="primary"
          size="small"
          startIcon={isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          sx={{
            borderRadius: 2,
            minWidth: "auto",
            px: 1.5,
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          {isDarkMode ? "Light" : "Dark"}
        </Button>
      ) : (
        <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          <IconButton
            onClick={toggleTheme}
            color="primary"
            sx={{ 
              p: 1,
              "&:hover": {
                backgroundColor: theme.palette.primary.main + "20",
              }
            }}
          >
            {isDarkMode ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export const Sidebar = ({ isMobile, onClose, isDarkMode, toggleTheme }) => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, roleId, clearUser } = useUserStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      navigate("/");
      if (isMobile) onClose();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleSidebar = () => setIsExpanded(prev => !prev);

  const handleNavigation = (path) => {
    if (isLoggedIn) {
      if (path === "/dashboard") {
        navigate(roleId === 1 ? "/admin-dashboard" : "/user-dashboard");
      } else {
        navigate(path);
      }
    } else {
      navigate("/login");
    }
    if (isMobile) onClose();
  };

  const menuItems = [
    { 
      label: "Dashboard", 
      path: "/dashboard", 
      icon: <LayoutDashboard size={20} strokeWidth={2} /> 
    },
    { 
      label: "Reports", 
      path: "/reports", 
      icon: <FileText size={20} strokeWidth={2} /> 
    },
    
    { 
      label: "Profile", 
      path: "/user-profile", 
      icon: <User size={20} strokeWidth={2} /> 
    },
  ];

  // Function to check if path is active (more precise matching)
  const isPathActive = (itemPath) => {
    if (itemPath === "/dashboard") {
      return pathname === "/admin-dashboard" || pathname === "/user-dashboard" || pathname === "/dashboard";
    }
    return pathname === itemPath;
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open
      onClose={isMobile ? onClose : undefined}
      sx={{
        width: isExpanded ? 260 : 80,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: isExpanded ? 260 : 80,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(to bottom, ${theme.palette.background.paper}, ${theme.palette.background.default})`
            : `linear-gradient(to bottom, #ffffff, #f8fafc)`,
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === 'dark' 
            ? "4px 0 12px rgba(0,0,0,0.3)"
            : "4px 0 12px rgba(0,0,0,0.08)",
          transition: "width 0.3s ease",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent={isExpanded ? "space-between" : "center"}
          px={isExpanded ? 3 : 2}
          py={3}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {isExpanded && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Calculator size={18} color="white" strokeWidth={2.5} />
              </Box>
              <Typography 
                variant="h6" 
                sx={{
                  fontWeight: 800,
                  color: "white",
                  fontSize: "1.1rem",
                  letterSpacing: 0.5,
                }}
                noWrap
              >
                DeductEase
              </Typography>
            </Box>
          )}
          
          <IconButton
            onClick={toggleSidebar}
            size="small"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              color: "white",
              borderRadius: 2,
              "&:hover": { 
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                transform: "scale(1.05)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {isExpanded
              ? <ChevronLeft size={18} />
              : <ChevronRight size={18} />}
          </IconButton>
        </Box>

        {/* Menu */}
        <Box flexGrow={1} overflow="auto" sx={{ py: 2 }}>
          <List sx={{ px: isExpanded ? 2 : 1 }}>
            {menuItems.map(item => (
              <SidebarItem
                key={item.label}
                {...item}
                isActive={isPathActive(item.path)}
                onClick={() => handleNavigation(item.path)}
                isExpanded={isExpanded}
              />
            ))}
          </List>
        </Box>

        {/* Bottom Section */}
        <Box sx={{ p: isExpanded ? 2 : 1, pb: 3 }}>
          {/* Theme Toggle */}
          <Box sx={{ mb: 2 }}>
            <ThemeToggle 
              isExpanded={isExpanded} 
              isDarkMode={isDarkMode} 
              toggleTheme={toggleTheme} 
            />
          </Box>

          <Divider sx={{ mb: 2, opacity: 0.6 }} />

          {/* Logout */}
          <Tooltip title={!isExpanded ? "Logout" : ""} placement="right" arrow>
            <ListItem
              onClick={handleLogout}
              sx={{
                borderRadius: 3,
                py: 1.5,
                px: isExpanded ? 2.5 : 1.5,
                cursor: "pointer",
                color: theme.palette.error.main,
                border: `1px solid ${theme.palette.error.main}40`,
                "&:hover": {
                  backgroundColor: theme.palette.error.main + "15",
                  borderColor: theme.palette.error.main,
                  transform: "translateX(4px)",
                },
                justifyContent: isExpanded ? "flex-start" : "center",
                transition: "all 0.2s ease",
              }}
            >
              <LogOut size={20} strokeWidth={2} />
              {isExpanded && (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    ml: 2,
                    letterSpacing: 0.3,
                    whiteSpace: "nowrap",
                    fontSize: "0.875rem",
                  }}
                >
                  Logout
                </Typography>
              )}
            </ListItem>
          </Tooltip>

          {/* Branding Footer */}
          {isExpanded && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.disabled,
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  letterSpacing: 0.5,
                }}
              >
                Tax optimization made simple
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};