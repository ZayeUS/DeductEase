import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  useTheme,
  Container,
  CircularProgress,
  Fade,
  Avatar,
  Chip,
  LinearProgress,
  Link,
  Stack,
} from "@mui/material";
import {
  AccountBalance as BankIcon,
  CheckCircle as CheckIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  ArrowForward as ArrowIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { postData } from "../../utils/BackendRequestHelper";
import { usePlaidLink } from "react-plaid-link";
import { useUserStore } from "../../store/userStore";
import { auth } from "../../../firebase";
import { signOut } from "firebase/auth";

const TRUSTED_APPS = [
  "Venmo",
  "Robinhood",
  "Betterment",
  "Acorns",
  "Chime",
  "Coinbase",
  "SoFi",
  "Wealthfront",
];

export const Connect = () => {
  const [state, setState] = useState({
    linkToken: null,
    loading: false,
    syncing: false,
    error: null,
    currentStep: "",
    bankInfo: null,
    progress: 0,
    syncFailed: false,
  });

  const theme = useTheme();
  const navigate = useNavigate();
  const { profile, clearUser, setPlaidConnected } = useUserStore();

  useEffect(() => {
    fetchLinkToken();
  }, []);

  const fetchLinkToken = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null, syncFailed: false }));
      const response = await postData("/plaid/link-token", {});
      setState((prev) => ({ ...prev, linkToken: response.link_token, loading: false }));
    } catch (err) {
      console.error("Failed to get link token:", err);
      setState((prev) => ({
        ...prev,
        error: "Unable to initialize bank connection. Please try again.",
        loading: false,
      }));
    }
  };

  const handlePlaidSuccess = async (public_token, metadata) => {
    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        bankInfo: metadata.institution,
        progress: 25,
        syncFailed: false,
      }));

      await postData("/plaid/exchange-token", { public_token });

      await syncTransactions();
    } catch (err) {
      console.error("Failed to connect bank:", err);
      setState((prev) => ({
        ...prev,
        error: "Failed to connect your bank. Please try again.",
        loading: false,
      }));
    }
  };

  const syncTransactions = async () => {
    try {
      setState((prev) => ({
        ...prev,
        syncing: true,
        currentStep: "Syncing transactions...",
        progress: 50,
        error: null,
        syncFailed: false,
      }));

      await postData("/plaid/sync", {});

      setState((prev) => ({
        ...prev,
        currentStep: "Categorizing expenses...",
        progress: 75,
      }));

      await postData("/category/auto-categorize", {});

      setState((prev) => ({
        ...prev,
        currentStep: "Finalizing setup...",
        progress: 100,
      }));

      setPlaidConnected(true);

      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to sync transactions:", err);
      setPlaidConnected(true);

      setState((prev) => ({
        ...prev,
        syncing: false,
        error:
          "Failed to sync transactions. You can retry syncing from your dashboard or try again here.",
        syncFailed: true,
        currentStep: "",
        progress: 0,
      }));
    }
  };

  const retrySync = async () => {
    setState((prev) => ({
      ...prev,
      error: null,
      syncing: true,
      currentStep: "Retrying sync...",
      progress: 10,
      syncFailed: false,
    }));
    try {
      await syncTransactions();
    } catch {
      // syncTransactions already handles error state
    }
  };

  const { open, ready } = usePlaidLink({
    token: state.linkToken,
    onSuccess: handlePlaidSuccess,
    onExit: (err) => {
      if (err && err.error_code !== "USER_CANCELLED") {
        setState((prev) => ({
          ...prev,
          error: "Connection failed. Please try again.",
        }));
      }
    },
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to sign out. Please try again.",
      }));
    }
  };

  if (state.syncing) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: theme.palette.background.default,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
              Setting up your account
            </Typography>

            <Box sx={{ mb: 4 }}>
              <CircularProgress size={60} thickness={4} />
            </Box>

            <Typography variant="h6" color="text.secondary">
              {state.currentStep}
            </Typography>

            <LinearProgress
              variant="determinate"
              value={state.progress}
              sx={{ mt: 3, borderRadius: 1, height: 8 }}
              aria-label="Progress"
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This may take a moment...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        display: "flex",
        alignItems: "center",
        py: 4,
        position: "relative",
      }}
    >
      {/* Header with User Info, Back to Dashboard, and Logout */}
      <Box
        sx={{
          position: "absolute",
          top: 24,
          right: 24,
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          maxWidth: 400,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate("/dashboard")}
          aria-label="Back to dashboard"
          sx={{ whiteSpace: "nowrap" }}
        >
          Back to Dashboard
        </Button>

        {profile && (
          <Chip
            avatar={
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                {profile.first_name?.[0]?.toUpperCase() || <BankIcon />}
              </Avatar>
            }
            label={`${profile.first_name} ${profile.last_name}`}
            variant="outlined"
          />
        )}
        <Button
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          color="inherit"
          sx={{ textTransform: "none" }}
        >
          Sign out
        </Button>
      </Box>

      <Container maxWidth="xs">
        <Fade in timeout={600}>
          <Box sx={{ textAlign: "center" }}>
            {/* Logo */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight={700}>
              DuductEase
              </Typography>
            </Box>

            {/* Progress Steps */}
            <Box
              sx={{
                mb: 6,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <CheckIcon
                  sx={{ color: theme.palette.success.main, fontSize: 24 }}
                  aria-label="Profile step completed"
                />
                <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
                  Profile
                </Typography>
              </Box>
              <Box sx={{ width: 40, height: 2, bgcolor: theme.palette.divider }} />
              <Box sx={{ textAlign: "center" }}>
                <BankIcon
                  sx={{
                    color: state.bankInfo
                      ? theme.palette.success.main
                      : theme.palette.primary.main,
                    fontSize: 24,
                  }}
                  aria-label={state.bankInfo ? "Bank linked" : "Bank linking step"}
                />
                <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
                  Bank
                </Typography>
              </Box>
              <Box sx={{ width: 40, height: 2, bgcolor: theme.palette.divider }} />
              <Box sx={{ textAlign: "center" }}>
                <ArrowIcon
                  sx={{ color: theme.palette.action.disabled, fontSize: 24 }}
                  aria-label="Dashboard step"
                />
                <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
                  Dashboard
                </Typography>
              </Box>
            </Box>

            {/* Main Content */}
            {state.bankInfo ? (
              <Box sx={{ mb: 3 }}>
                <Avatar
                  src={state.bankInfo.logo_url}
                  alt={state.bankInfo.name}
                  sx={{
                    width: 72,
                    height: 72,
                    mx: "auto",
                    mb: 2,
                    borderRadius: 1,
                    backgroundColor: "#fff",
                    boxShadow: theme.shadows[3],
                  }}
                />
                <Typography variant="h6" fontWeight={600}>
                  Connected to {state.bankInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Your bank account is securely linked.
                </Typography>
              </Box>
            ) : (
              <BankIcon
                sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 3 }}
                aria-label="Bank icon"
              />
            )}

            {!state.error && (
              <Typography
                color="text.secondary"
                sx={{ mb: 2, maxWidth: 320, mx: "auto" }}
                variant="body2"
              >
                Securely link your business bank account to start tracking expenses automatically.
              </Typography>
            )}

            {/* Error */}
            {state.error && (
              <Alert
                severity="error"
                sx={{ mb: 3 }}
                onClose={() => setState((prev) => ({ ...prev, error: null }))}
                icon={<ErrorIcon />}
              >
                {state.error}
              </Alert>
            )}

            {/* Connect Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={
                state.loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <BankIcon />
                )
              }
              onClick={() => open()}
              disabled={!ready || state.loading}
              sx={{
                py: 1.5,
                mb: 1,
                fontSize: "1rem",
                textTransform: "none",
                fontWeight: 600,
              }}
              aria-label="Connect with Plaid"
            >
              {state.loading ? "Preparing connection..." : "Connect with Plaid"}
            </Button>

            {/* Retry Sync Button on failure */}
            {state.syncFailed && (
              <Button
                variant="outlined"
                fullWidth
                onClick={retrySync}
                sx={{ mb: 2 }}
                aria-label="Retry syncing transactions"
              >
                Retry Sync
              </Button>
            )}

            {/* Security Badge near button */}
            <Box
              sx={{
                mt: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                color: "text.secondary",
              }}
            >
              <LockIcon sx={{ fontSize: 16 }} aria-hidden="true" />
              <Typography variant="caption" component="p" sx={{ maxWidth: 280 }}>
                Bank-grade encryption &nbsp;&bull;&nbsp; Read-only access. We never
                store your login credentials.
              </Typography>
            </Box>

            {/* Plaid Badge */}
            <Box sx={{ mt: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Trusted by
              </Typography>
              <Stack
                direction="row"
                spacing={1.5}
                justifyContent="center"
                sx={{ mt: 0.5, flexWrap: "wrap", gap: 1 }}
                aria-label="Apps that use Plaid"
              >
                {TRUSTED_APPS.map((app) => (
                  <Chip
                    key={app}
                    label={app}
                    size="small"
                    sx={{ fontWeight: 600 }}
                    color="primary"
                  />
                ))}
              </Stack>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  letterSpacing: "-0.5px",
                  mt: 1,
                }}
              >
                powered by&nbsp;
                <Link
                  href="https://plaid.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{ fontWeight: 700 }}
                >
                  Plaid
                </Link>
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};
