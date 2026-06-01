import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireSuperAdmin = false }) => {
  const token = localStorage.getItem('admin_token');
  const userStr = localStorage.getItem('admin_user');

  if (!token || !userStr) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requireSuperAdmin) {
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'super_admin') {
        return <Navigate to="/admin/dashboard" replace />;
      }
    } catch {
      return <Navigate to="/admin/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
