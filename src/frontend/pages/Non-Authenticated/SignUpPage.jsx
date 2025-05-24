import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  useTheme,
  Paper,
  Divider,
  InputAdornment,
  IconButton
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { signUp as firebaseSignUp, checkEmailExists } from "../../../firebase";
import { postData } from "../../utils/BackendRequestHelper";
import { useUserStore } from "../../store/userStore";

export function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const theme = useTheme();
  const navigate = useNavigate();
  const { isLoggedIn, setUser } = useUserStore();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  // Password strength calculation
  const calculatePasswordStrength = (pwd) => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const strength = Math.round((passed / Object.keys(checks).length) * 100);

    let color = theme.palette.error.main;
    if (strength >= 80) {
      color = theme.palette.success.main;
    } else if (strength >= 60) {
      color = theme.palette.warning.main;
    }

    return { strength, color, checks };
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    const { checks } = calculatePasswordStrength(password);

    // Email
    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password
    if (!password) {
      errors.password = "Password is required";
    } else if (!checks.length) {
      errors.password = "Password must be at least 8 characters";
    } else if (!checks.uppercase) {
      errors.password = "Include at least one uppercase letter";
    } else if (!checks.lowercase) {
      errors.password = "Include at least one lowercase letter";
    } else if (!checks.number) {
      errors.password = "Include at least one number";
    } else if (!checks.special) {
      errors.password = "Include at least one special character";
    }

    // Confirm Password
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle sign up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setFieldErrors(prev => ({ ...prev, email: "An account with this email already exists" }));
        setIsSubmitting(false);
        return;
      }

      const user = await firebaseSignUp(email, password);
      const { user: backendUser } = await postData("/users", {
        firebase_uid: user.uid,
        email: user.email,
        role_id: 1
      });

      setUser(user.uid, 1, backendUser.user_id);
      navigate("/profile-onboarding");
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setFieldErrors(prev => ({ ...prev, email: "Email is already registered" }));
          break;
        case "auth/invalid-email":
          setFieldErrors(prev => ({ ...prev, email: "Invalid email format" }));
          break;
        case "auth/operation-not-allowed":
          setError("Sign up is currently disabled. Please try again later.");
          break;
        case "auth/weak-password":
          setFieldErrors(prev => ({ ...prev, password: "Password is too weak" }));
          break;
        default:
          setError("Failed to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field changes
  const handleFieldChange = (field, value) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);

    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (error) setError("");
  };

  const passwordStrength = calculatePasswordStrength(password);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        bgcolor: theme.palette.background.default,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            theme.palette.mode === "dark"
              ? `radial-gradient(circle at 30% 20%, ${theme.palette.primary.dark}15 0%, transparent 50%),
                 radial-gradient(circle at 70% 80%, ${theme.palette.secondary.dark}10 0%, transparent 50%)`
              : `radial-gradient(circle at 30% 20%, ${theme.palette.primary.light}15 0%, transparent 50%),
                 radial-gradient(circle at 70% 80%, ${theme.palette.secondary.light}10 0%, transparent 50%)`,
          zIndex: 0
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join DuductEase and take control of your taxes. We’ll help you find deductions you’re missing.
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleSignUp} noValidate>
            {/* General Error */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Email Field */}
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
              disabled={isSubmitting}
            />

            {/* Password Field */}
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              value={password}
              onChange={(e) => handleFieldChange("password", e.target.value)}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              margin="normal"
              required
              autoComplete="new-password"
              disabled={isSubmitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Password Strength Indicator */}
            {password && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Box sx={{ display: "flex", gap: 0.5, mb: 1 }}>
                  {[0, 20, 40, 60, 80].map((threshold) => (
                    <Box
                      key={threshold}
                      sx={{
                        height: 4,
                        flex: 1,
                        bgcolor:
                          passwordStrength.strength > threshold
                            ? passwordStrength.color
                            : theme.palette.grey[300],
                        borderRadius: 2,
                        transition: "background-color 0.3s"
                      }}
                    />
                  ))}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: passwordStrength.color,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5
                  }}
                >
                  {passwordStrength.strength < 80
                    ? `Include: ${!passwordStrength.checks.length ? "8+ chars, " : ""}${
                        !passwordStrength.checks.uppercase ? "uppercase, " : ""
                      }${!passwordStrength.checks.lowercase ? "lowercase, " : ""}${
                        !passwordStrength.checks.number ? "number, " : ""
                      }${!passwordStrength.checks.special ? "special char" : ""}`
                    : "Strong password"}
                </Typography>
              </Box>
            )}

            {/* Confirm Password Field */}
            <TextField
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              value={confirmPassword}
              onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword}
              margin="normal"
              required
              autoComplete="new-password"
              disabled={isSubmitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ py: 1.5, mt: 3, position: "relative" }}
            >
              {isSubmitting && (
                <CircularProgress
                  size={24}
                  sx={{
                    position: "absolute",
                    left: "50%",
                    marginLeft: "-12px"
                  }}
                />
              )}
              Create Account
            </Button>

            <Divider sx={{ my: 3 }} />

            {/* Sign In Link */}
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{" "}
                <Link
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/login");
                  }}
                  sx={{ textDecoration: "none", fontWeight: 600 }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
