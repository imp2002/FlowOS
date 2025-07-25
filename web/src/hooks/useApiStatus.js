import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export const useApiStatus = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await apiService.checkApiStatus();
        setApiStatus(status);
      } catch (error) {
        setApiStatus('offline');
      }
    };
    
    checkStatus();
    
    // 每30秒检查一次API状态
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return apiStatus;
};