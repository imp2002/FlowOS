import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useMobile } from './hooks/useMobile';
import { storageService } from './services/storageService';
import DesktopApp from './components/DesktopApp';
import MobileApp from './components/MobileApp';
import LandingPage from './components/LandingPage';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const isMobile = useMobile();



  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 登陆页路由 */}
          <Route path="/" element={<LandingPage />} />

          {/* 主应用路由 */}
          <Route 
            path="/app" 
            element={
              <PrivateRoute>
                {isMobile ? <MobileApp /> : <DesktopApp />}
              </PrivateRoute>
            }
          />
          
          {/* 默认重定向到主页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;