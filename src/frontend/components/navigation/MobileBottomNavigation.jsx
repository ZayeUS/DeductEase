import React, { useState } from "react";
import { Box, Paper, Typography, Divider, IconButton, Switch, useTheme } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Menu, 
  LogOut, 
  UserCircle, 
  Moon, 
  Sun, 
  FileText,
  Calculator 
} from "lucide-react";
import { useUserStore } from "../../store/userStore";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";

const NavigationButton = ({ icon, label, onClick, active }) => {
  const theme = useTheme();
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 1.5,
        px: 2,
        cursor: "pointer",
        color: active ? theme.palette.primary.main : theme.palette.text.secondary,
        transition: "all 0.2s ease",
        borderRadius: 2,
        position: "relative",
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
        },
        "&::after": active ? {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 24,
          height: 3,
          backgroundColor: theme.palette.primary.main,
          borderRadius: "2px 2px 0 0",
        } : {},
      }}
    >
      {icon}
      <Typography 
        variant="caption" 
        sx={{
          fontWeight: active ? 700 : 600,
          mt: 0.5,
          fontSize: "0.7rem",
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export const MobileBottomNavigation = ({ isDarkMode, toggleTheme }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const { isLoggedIn, roleId, clearUser } = useUserStore();

  const handleNavigation = (path) => {
    setShowMenu(false);
    if (path === "/dashboard") {
      const finalPath = roleId === 1 ? "/admin-dashboard" : "/user-dashboard";
      navigate(isLoggedIn ? finalPath : "/");
    } else {
      navigate(isLoggedIn ? path : "/");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Check if dashboard path is active
  const isDashboardActive = pathname === "/admin-dashboard" || pathname === "/user-dashboard" || pathname === "/dashboard";
  const isReportsActive = pathname === "/reports";

  return (
    <>
      {/* Bottom Nav */}
      <Box
        sx={{
          display: { xs: "block", sm: "none" },
          position: "fixed",
          bottom: 0,
          width: "100%",
          zIndex: 1300,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            borderRadius: "20px 20px 0 0",
            px: 1,
            py: 1,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(to top, ${theme.palette.background.paper}, ${theme.palette.background.default})`
              : `linear-gradient(to top, #ffffff, #f8fafc)`,
            borderTop: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'dark' 
              ? "0 -4px 12px rgba(0,0,0,0.3)"
              : "0 -4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <NavigationButton
            icon={<LayoutDashboard size={22} strokeWidth={2} />}
            label="Dashboard"
            onClick={() => handleNavigation("/dashboard")}
            active={isDashboardActive}
          />
          
          <NavigationButton
            icon={<FileText size={22} strokeWidth={2} />}
            label="Reports"
            onClick={() => handleNavigation("/reports")}
            active={isReportsActive}
          />
          
          <NavigationButton
            icon={<Menu size={22} strokeWidth={2} />}
            label="Menu"
            onClick={() => setShowMenu(!showMenu)}
            active={showMenu}
          />
        </Paper>
      </Box>

      {/* Expandable Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <Box
            onClick={() => setShowMenu(false)}
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              bgcolor: "rgba(0,0,0,0.5)",
              zIndex: 1299,
              backdropFilter: "blur(2px)",
            }}
          />
          
          <Box
            sx={{
              position: "fixed",
              bottom: 90,
              left: 0,
              right: 0,
              mx: 2,
              zIndex: 1301,
              transition: "transform 0.3s ease, opacity 0.3s ease",
            }}
          >
            <Paper
              elevation={12}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                backdropFilter: "blur(10px)",
                background: theme.palette.mode === 'dark' 
                  ? `linear-gradient(135deg, ${theme.palette.background.paper}f0, ${theme.palette.background.default}f0)`
                  : `linear-gradient(135deg, #fffffff0, #f8fafcf0)`,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 2,
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Calculator size={16} color="white" strokeWidth={2.5} />
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{
                    fontWeight: 800,
                    color: "white",
                    fontSize: "1rem",
                    letterSpacing: 0.5,
                  }}
                >
                  TaxFlow
                </Typography>
              </Box>

              {/* Menu Items */}
              <Box
                sx={{
                  px: 2,
                  py: 2,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  "&:hover": { 
                    bgcolor: theme.palette.action.hover,
                    backgroundColor: theme.palette.primary.main + "10",
                  },
                  transition: "all 0.2s ease",
                }}
                onClick={() => handleNavigation("/user-profile")}
              >
                <UserCircle size={20} color={theme.palette.text.secondary} strokeWidth={2} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    ml: 2,
                    color: theme.palette.text.primary,
                  }}
                >
                  Profile Settings
                </Typography>
              </Box>
              
              <Divider sx={{ opacity: 0.6 }} />
              
              {/* Theme Toggle */}
              <Box
                sx={{
                  px: 2,
                  py: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  "&:hover": { 
                    bgcolor: theme.palette.action.hover,
                    backgroundColor: theme.palette.primary.main + "10",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {isDarkMode ? (
                    <Moon size={20} color={theme.palette.primary.main} strokeWidth={2} />
                  ) : (
                    <Sun size={20} color={theme.palette.primary.main} strokeWidth={2} />
                  )}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600, 
                      ml: 2,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {isDarkMode ? "Dark Mode" : "Light Mode"}
                  </Typography>
                </Box>
                <Switch
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  color="primary"
                  size="small"
                  sx={{
                    "& .MuiSwitch-thumb": {
                      boxShadow: theme.shadows[2],
                    },
                  }}
                />
              </Box>
              
              <Divider sx={{ opacity: 0.6 }} />
              
              {/* Logout */}
              <Box
                sx={{
                  px: 2,
                  py: 2,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  color: theme.palette.error.main,
                  "&:hover": { 
                    bgcolor: theme.palette.error.main + "15",
                  },
                  transition: "all 0.2s ease",
                }}
                onClick={handleLogout}
              >
                <LogOut size={20} strokeWidth={2} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    ml: 2,
                  }}
                >
                  Sign Out
                </Typography>
              </Box>

              {/* Footer */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  textAlign: "center",
                  borderTop: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.action.hover + "50",
                }}
              >
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
            </Paper>
          </Box>
        </>
      )}
    </>
  );
};