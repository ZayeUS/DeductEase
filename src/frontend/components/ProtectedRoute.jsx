// ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { LoadingModal } from '../components/LoadingModal';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, roleId, profile, authHydrated, plaidConnected } = useUserStore();
  const location = useLocation();

  if (!authHydrated) return <LoadingModal message="Authenticating..." />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/profile-onboarding" replace />;

  // Exempt routes that don't require Plaid connection
  const plaidExemptRoutes = ["/connect", "/review"]; // Add /review here
  
  // Check if Plaid connection is required
  if (!plaidConnected && !plaidExemptRoutes.includes(location.pathname)) {
    return <Navigate to="/connect" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(roleId)) {
    return <Navigate to={roleId === 1 ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }

  return children;
};