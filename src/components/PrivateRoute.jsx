import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, requiredRoles }) {
  const token = localStorage.getItem('accessToken');
  const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles) {
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/" replace />; // Redirect to user home if not authorized
    }
  }

  return children;
}
