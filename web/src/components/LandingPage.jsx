import React from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-transparent z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">FlowOS</div>
          <div className="flex items-center space-x-4">
            <button className="text-white/80 hover:text-white">登录</button>
            <button 
              className="bg-white/20 text-white px-4 py-2 rounded-md hover:bg-white/30 backdrop-blur-sm"
            >
              注册
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-gray-900/50 animate-gradient-xy"></div>
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 z-10">
             FlowOS
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-12 z-10">Social interaction before brain-computer interfaces.</p>
          
          <div 
            onClick={() => {
              storageService.saveUserProfile({ name: 'Test User' });
              navigate('/app');
            }}
            className="max-w-2xl mx-auto bg-white/10 rounded-2xl shadow-lg p-8 backdrop-blur-md border border-white/20 cursor-pointer hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
          >
            <h2 className="text-2xl font-semibold mb-2">直接体验</h2>
            <p className="text-white/80">无需注册，立即开始探索 FlowOS 的强大功能</p>
          </div>
        </div>
      </main>


    </div>
  );
};

export default LandingPage;