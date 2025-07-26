import React, { useEffect } from 'react';
import { useMobile } from './hooks/useMobile';
import { storageService } from './services/storageService';
import DesktopApp from './components/DesktopApp';
import MobileApp from './components/MobileApp';

function App() {
  const isMobile = useMobile();

  // 每次应用启动时清除所有历史数据
  useEffect(() => {
    storageService.clearAllData();
  }, []);

  return (
    <div className="App">
      {isMobile ? <MobileApp /> : <DesktopApp />}
    </div>
  );
}

export default App;