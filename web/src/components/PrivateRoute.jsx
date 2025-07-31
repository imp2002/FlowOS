import React from 'react';
import { Navigate } from 'react-router-dom';
import { storageService } from '../services/storageService';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = storageService.getUserProfile(); // 假设登录后会存储用户信息

  return isAuthenticated ? children : <Navigate to="/" />;
};

export default PrivateRoute;