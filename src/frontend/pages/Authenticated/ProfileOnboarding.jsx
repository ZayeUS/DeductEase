import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  useTheme,
  Container,
  CircularProgress,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  FormGroup,
} from "@mui/material";
import { ArrowForward as ArrowIcon, Gavel as LegalIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { postData } from "../../utils/BackendRequestHelper";
import { useUserStore } from "../../store/userStore";

const BUSINESS_TYPES = [
  { value: "LLC", label: "LLC" },
  { value: "S_CORP", label: "S-Corp" },
  { value: "SOLE_PROP", label: "Sole Proprietorship" },
];
const AGENCY_TYPES = [
  { value: "DIGITAL", label: "Digital Agency" },
  { value: "CREATIVE", label: "Creative Agency" },
  { value: "MARKETING", label: "Marketing Agency" },
  { value: "DEV", label: "Development Agency" },
  { value: "CONSULTING", label: "Consulting" },
  { value: "OTHER", label: "Other" },
];

const LEGAL_DISCLAIMERS = [
  {
    name: "disclaimer_tax_advice",
    label:
      "I understand that DuductEase provides estimates and does not offer official tax advice or prepare my tax returns.",
  },
  {
    name: "disclaimer_data_use",
    label:
      "I consent to DuductEase securely accessing and using my financial data to provide tax tracking services.",
  },
  {
    name: "disclaimer_no_liability",
    label:
      "I acknowledge that DuductEase is not responsible for any financial losses resulting from use of the service.",
  },
  // {
  //   name: "disclaimer_terms",
  //   label: (
  //     <>
  //       I agree to the{" "}
  //       <a href="/terms" target="_blank" rel="noopener noreferrer">
  //         Terms of Service
  //       </a>{" "}
  //       and{" "}
  //       <a href="/privacy" target="_blank" rel="noopener noreferrer">
  //         Privacy Policy
  //       </a>
  //       .
  //     </>
  //   ),
  // },
];

const calculateAge = (dateString) => {
  const dob = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

export const ProfileOnboarding = () => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    business_type: "",
    agency_type: "",
  });
  const [disclaimers, setDisclaimers] = useState(
    LEGAL_DISCLAIMERS.reduce((acc, item) => ({ ...acc, [item.name]: false }), {})
  );
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const firstInvalidRef = useRef(null);

  const theme = useTheme();
  const navigate = useNavigate();
  const { setProfile, clearUser } = useUserStore();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("disclaimer_")) {
      setDisclaimers((prev) => ({ ...prev, [name]: checked }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (apiError) setApiError("");
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = "Required";
    if (!form.last_name.trim()) errs.last_name = "Required";
    if (!form.business_type) errs.business_type = "Required";
    if (!form.agency_type) errs.agency_type = "Required";
    if (!form.date_of_birth) {
      errs.date_of_birth = "Required";
    } else {
      const age = calculateAge(form.date_of_birth);
      if (age < 18) errs.date_of_birth = "Must be 18 or older";
      else if (age > 120) errs.date_of_birth = "Invalid date";
    }
    LEGAL_DISCLAIMERS.forEach(({ name }) => {
      if (!disclaimers[name]) {
        errs[name] = "Required";
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const focusFirstError = () => {
    if (!firstInvalidRef.current) return;
    firstInvalidRef.current.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      focusFirstError();
      return;
    }
    setLoading(true);
    try {
      const profileRes = await postData("/profile", {
        ...form,
        is_new_user: true,
        accepted_terms: true,
        accepted_disclaimers: Object.keys(disclaimers).filter(
          (key) => disclaimers[key]
        ),
        terms_accepted_at: new Date().toISOString(),
      });
      if (profileRes?.profile) {
        setProfile(profileRes.profile);
        navigate("/connect");
      } else {
        setApiError("Unable to save profile. Please try again.");
      }
    } catch (err) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearUser();
    navigate("/login");
  };

  // Utility to assign ref to first invalid field
  const getFieldRef = (fieldName) =>
    errors[fieldName] && !firstInvalidRef.current
      ? (el) => {
          if (el) firstInvalidRef.current = el;
        }
      : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ letterSpacing: 1, mb: 1 }}
            >
              GET STARTED
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
              Welcome to DuductEase
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quick setup. Get personalized, audit-ready tax tracking for your
              agency.
            </Typography>
          </Box>

          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError("")}>
              {apiError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Name Fields */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
                mb: 3,
              }}
            >
              <TextField
                inputRef={getFieldRef("first_name")}
                name="first_name"
                label="First Name"
                value={form.first_name}
                onChange={handleChange}
                error={!!errors.first_name}
                helperText={errors.first_name}
                disabled={loading}
                fullWidth
                required
                autoComplete="given-name"
              />
              <TextField
                inputRef={getFieldRef("last_name")}
                name="last_name"
                label="Last Name"
                value={form.last_name}
                onChange={handleChange}
                error={!!errors.last_name}
                helperText={errors.last_name}
                disabled={loading}
                fullWidth
                required
                autoComplete="family-name"
              />
            </Box>

            <TextField
              select
              inputRef={getFieldRef("business_type")}
              name="business_type"
              label="Business Type"
              value={form.business_type}
              onChange={handleChange}
              error={!!errors.business_type}
              helperText={errors.business_type || "This affects how we calculate your taxes"}
              disabled={loading}
              fullWidth
              required
              sx={{ mb: 3 }}
            >
              <MenuItem value="" disabled>
                Select your business type
              </MenuItem>
              {BUSINESS_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              inputRef={getFieldRef("agency_type")}
              name="agency_type"
              label="Agency Type"
              value={form.agency_type}
              onChange={handleChange}
              error={!!errors.agency_type}
              helperText={errors.agency_type}
              disabled={loading}
              fullWidth
              required
              sx={{ mb: 3 }}
            >
              <MenuItem value="" disabled>
                What type of agency do you run?
              </MenuItem>
              {AGENCY_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              inputRef={getFieldRef("date_of_birth")}
              name="date_of_birth"
              type="date"
              label="Date of Birth"
              value={form.date_of_birth}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              error={!!errors.date_of_birth}
              helperText={errors.date_of_birth}
              disabled={loading}
              fullWidth
              required
              sx={{ mb: 4 }}
              inputProps={{
                max: new Date().toISOString().split("T")[0],
              }}
            />

            {/* Legal & Privacy Disclaimers */}
            <Box sx={{ mb: 4, mt: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <LegalIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Legal & Privacy
                </Typography>
              </Box>
              <FormGroup>
                {LEGAL_DISCLAIMERS.map(({ name, label }) => (
                  <FormControlLabel
                  control={
                    <Checkbox
                      name={name}
                      checked={disclaimers[name]}
                      onChange={handleChange}
                      color="primary"
                      required={false} // prevents automatic asterisk
                      inputRef={getFieldRef(name)}
                    />
                  }
                  label={<Typography variant="body2" fontWeight={500}>{label}</Typography>}
                />
                
                ))}
                {Object.entries(errors)
                  .filter(([key]) => key.startsWith("disclaimer") && errors[key])
                  .map(([key]) => (
                    <FormHelperText key={key} error sx={{ ml: 4 }}>
                      {errors[key]}
                    </FormHelperText>
                  ))}
              </FormGroup>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              size="large"
              endIcon={
                loading ? <CircularProgress size={20} color="inherit" /> : <ArrowIcon />
              }
              sx={{ py: 1.5, mb: 3 }}
            >
              {loading ? "Saving..." : "Get My Tax Overview"}
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Button
                variant="text"
                color="inherit"
                onClick={() => {
                  clearUser();
                  navigate("/login");
                }}
                size="small"
                sx={{ color: theme.palette.text.secondary }}
              >
                Not you? Sign out
              </Button>
            </Box>
          </form>
        </Paper>
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            Next: Securely connect your bank to unlock your dashboard.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
