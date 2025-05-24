import React, { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Button, Alert, Paper, 
  useTheme, CircularProgress, Avatar, 
  Container, Grid,Card
} from "@mui/material";
import { CloudUpload, Edit, Save, Cancel, Person } from "@mui/icons-material";
import { useUserStore } from "../../store/userStore";
import { putData, uploadFile } from "../../utils/BackendRequestHelper";

export function UserProfilePage() {
  // State
  const [formData, setFormData] = useState({ 
    first_name: "", 
    last_name: "", 
    date_of_birth: "" 
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Hooks
  const profile = useUserStore(state => state.profile);
  const setProfile = useUserStore(state => state.setProfile);
  const loading = useUserStore(state => state.loading);
  const setLoading = useUserStore(state => state.setLoading);
  const theme = useTheme();

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        date_of_birth: profile.date_of_birth
          ? new Date(profile.date_of_birth).toISOString().split("T")[0]
          : ""
      });
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  // Form input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors({ ...errors, [name]: null });
    if (apiError) setApiError("");
  };

  // Avatar handler
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // File validation
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setApiError("Only JPEG and PNG images are allowed");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setApiError("Image size should be less than 5MB");
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Form validation
  const validateForm = () => {
    const errs = {};
    if (!formData.first_name.trim()) errs.first_name = "First name is required";
    if (!formData.last_name.trim()) errs.last_name = "Last name is required";
    if (!formData.date_of_birth) errs.date_of_birth = "Date of birth is required";
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let profileData = { ...formData };

      // Upload avatar if exists
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        
        try {
          const avatarResponse = await uploadFile("/profile/avatar", formData);
          if (avatarResponse?.profile?.avatar_url) {
            profileData.avatar_url = avatarResponse.profile.avatar_url;
          }
        } catch (uploadError) {
          console.error("Avatar upload failed:", uploadError);
        }
      }

      // Submit profile data
      const response = await putData(`/profile`, profileData);
      if (response?.profile) {
        setProfile(response.profile);
        setIsEditing(false);
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        setAvatarFile(null);
      }
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setApiError("");
    
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        date_of_birth: profile.date_of_birth
          ? new Date(profile.date_of_birth).toISOString().split("T")[0]
          : ""
      });
      setAvatarPreview(profile.avatar_url);
      setAvatarFile(null);
    }
  };

  if (!profile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Person sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h5" fontWeight="600">
            Profile Settings
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Manage your personal information
        </Typography>
      </Box>

      {/* Main Card */}
      <Card sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 4 }}>
          {/* Messages */}
          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError("")}>
              {apiError}
            </Alert>
          )}
          
          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Avatar Section */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
              <Avatar
                src={avatarPreview}
                sx={{
                  width: 100,
                  height: 100,
                  mb: 2,
                  border: `2px solid ${theme.palette.divider}`,
                }}
              >
                {!avatarPreview && profile.first_name?.[0]}
              </Avatar>
              
              {isEditing && (
                <Button
                  component="label"
                  size="small"
                  startIcon={<CloudUpload />}
                  sx={{ textTransform: 'none' }}
                >
                  {avatarFile ? "Change Photo" : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/jpeg, image/jpg, image/png"
                    onChange={handleAvatarChange}
                    hidden
                  />
                </Button>
              )}
            </Box>

            {/* Form Fields */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  First Name
                </Typography>
                {isEditing ? (
                  <TextField
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    error={!!errors.first_name}
                    helperText={errors.first_name}
                    disabled={loading}
                  />
                ) : (
                  <Typography variant="body1">
                    {profile.first_name || "—"}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Last Name
                </Typography>
                {isEditing ? (
                  <TextField
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    error={!!errors.last_name}
                    helperText={errors.last_name}
                    disabled={loading}
                  />
                ) : (
                  <Typography variant="body1">
                    {profile.last_name || "—"}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Date of Birth
                </Typography>
                {isEditing ? (
                  <TextField
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    error={!!errors.date_of_birth}
                    helperText={errors.date_of_birth}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                ) : (
                  <Typography variant="body1">
                    {profile.date_of_birth 
                      ? new Date(profile.date_of_birth).toLocaleDateString() 
                      : "—"}
                  </Typography>
                )}
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {isEditing ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={loading}
                    startIcon={<Cancel />}
                    sx={{ borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    startIcon={<Save />}
                    sx={{ borderRadius: 2 }}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setIsEditing(true)}
                  startIcon={<Edit />}
                  sx={{ borderRadius: 2 }}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Card>
    </Container>
  );
}