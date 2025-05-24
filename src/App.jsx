// App.jsx
import React, { useEffect, useMemo, useCallback } from "react";
import { CssBaseline, Box, useMediaQuery, ThemeProvider } from "@mui/material";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useUserStore } from "./frontend/store/userStore";
import { createAppTheme } from "./frontend/styles/theme";
import { Sidebar } from "./frontend/components/navigation/Sidebar";
import { MobileBottomNavigation } from "./frontend/components/navigation/MobileBottomNavigation";
import { LoadingModal } from "./frontend/components/LoadingModal";

// Pages
import { LoginPage } from "./frontend/pages/Non-Authenticated/LoginPage";
import { SignUpPage } from "./frontend/pages/Non-Authenticated/SignUpPage";
import { AdminDashboard } from "./frontend/pages/Authenticated/AdminDashboard";
import { UserDashboard } from "./frontend/pages/Authenticated/UserDashboard";
import { ProfileOnboarding } from "./frontend/pages/Authenticated/ProfileOnboarding";
import { UserProfilePage } from "./frontend/pages/Authenticated/UserProfilePage";
import { StripeDashboard } from "./frontend/pages/Authenticated/StripeDashboard";
import { PaymentSuccessPage } from "./frontend/pages/Authenticated/PaymentSuccessPage";
import { Connect } from "./frontend/pages/Authenticated/Connect";
import { TransactionReview } from "./frontend/pages/Authenticated/TransactionReview";
import { Transactions } from "./frontend/pages/Authenticated/Transactions";
import { Reports } from "./frontend/pages/Authenticated/Reports";

import { ProtectedRoute } from "./frontend/components/ProtectedRoute";

const DRAWER_WIDTH = 60;

export const App = () => {
  const { isLoggedIn, profile, roleId, listenAuthState, authHydrated, loading, plaidConnected } = useUserStore();
  
  // Initialize theme from localStorage or system preference
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Create theme toggle handler (memoized to prevent recreation)
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prevMode => {
      const nextMode = !prevMode;
      localStorage.setItem("theme", nextMode ? "dark" : "light");
      return nextMode;
    });
  }, []);

  // Generate theme object
  const theme = useMemo(() => 
    createAppTheme(isDarkMode ? "dark" : "light"), 
    [isDarkMode]
  );
  
  // Responsive layout hooks
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();

  // Cross-tab theme synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        setIsDarkMode(e.newValue === 'dark');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // System theme preference change listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only apply if user hasn't explicitly set a preference
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Initialize authentication listener
  useEffect(() => {
    const unsubscribe = listenAuthState();
    return unsubscribe;
  }, [listenAuthState]);

  // Layout conditions
  const hiddenRoutes = ["/profile-onboarding", "/connect", "/review"];
  const shouldHideUI = hiddenRoutes.includes(location.pathname);
  
  const showSidebar = isLoggedIn && !isMobile && !shouldHideUI;
  const showMobileNav = isLoggedIn && isMobile && !shouldHideUI;

  // Redirect logic
  const getRedirect = () => {
    if (profile?.is_new_user) return "/stripe-dashboard";
    return roleId === 1 ? "/admin-dashboard" : "/user-dashboard";
  };

  // Loading states - show loading screen during authentication
  if (!authHydrated || loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingModal message={!authHydrated ? "Loading..." : "Just a moment..."} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar for desktop */}
        {showSidebar && (
          <Sidebar
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            isMobile={isMobile}
          />
        )}

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            ml: showSidebar ? `${DRAWER_WIDTH}px` : 0,
            pb: showMobileNav ? 10 : 0,
          }}
        >
          <Routes>
            {/* Authentication routes */}
            <Route
              path="/"
              element={
                isLoggedIn
                  ? <Navigate to={profile ? getRedirect() : "/profile-onboarding"} />
                  : <LoginPage />
              }
            />
            <Route
              path="/login"
              element={
                isLoggedIn
                  ? <Navigate to={profile ? getRedirect() : "/profile-onboarding"} />
                  : <LoginPage />
              }
            />
            <Route
              path="/signup"
              element={
                isLoggedIn
                  ? <Navigate to={profile ? getRedirect() : "/profile-onboarding"} />
                  : <SignUpPage />
              }
            />

            {/* Onboarding */}
            <Route
              path="/profile-onboarding"
              element={
                isLoggedIn && !profile
                  ? <ProfileOnboarding />
                  : <Navigate to={getRedirect()} />
              }
            />

            {/* Connect Bank Route */}
            <Route
              path="/connect"
              element={
                <ProtectedRoute allowedRoles={[1, 2]}>
                 <Connect />
                </ProtectedRoute>
              }
            />

            {/* Review Route */}
            <Route path="/review" element={
              <ProtectedRoute allowedRoles={[1, 2]}>
                <TransactionReview />
              </ProtectedRoute>
            } />

            {/* Transactions Route */}
            <Route path="/transactions" element={
              <ProtectedRoute allowedRoles={[1, 2]}>
                <Transactions />
              </ProtectedRoute>
            } />

            {/* Reports Route */}
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={[1, 2]}>
                <Reports />
              </ProtectedRoute>
            } />

            {/* Protected routes with role-based access */}
            <Route path="/user-profile" element={
              <ProtectedRoute><UserProfilePage /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><Navigate to={getRedirect()} /></ProtectedRoute>
            } />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute allowedRoles={[1]}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/user-dashboard" element={
              <ProtectedRoute allowedRoles={[2]}><UserDashboard /></ProtectedRoute>
            } />
            <Route path="/stripe-dashboard" element={
              <ProtectedRoute allowedRoles={[1, 2]}><StripeDashboard /></ProtectedRoute>
            } />
            <Route path="/payment-success" element={
              <ProtectedRoute allowedRoles={[1, 2]}><PaymentSuccessPage /></ProtectedRoute>
            } />

            {/* Fallback route for unmatched paths */}
            <Route path="*" element={<Navigate to={isLoggedIn ? getRedirect() : "/"} />} />
          </Routes>
        </Box>

        {/* Mobile navigation bar */}
        {showMobileNav && (
          <MobileBottomNavigation
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        )}
      </Box>
    </ThemeProvider>
  );
};