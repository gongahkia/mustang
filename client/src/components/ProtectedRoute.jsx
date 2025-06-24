import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { purgeSession } from '../utils/purgeService';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isInitializing } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    return () => {
      if (location.pathname !== '/') {
        purgeSession();
      }
    };
  }, [location]);

  if (isInitializing) {
    return <LoadingSpinner securityMessage="Verifying session integrity..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser && currentUser.exp * 1000 < Date.now()) {
    purgeSession();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;