import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMobile } from '../hooks/useMobile';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import { MESSAGE_TYPES } from '../utils/constants';
import PersonCard from './PersonCard';

const MobileApp = () => {

  // 状态管理
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [visitorCount, setVisitorCount] = useState(0);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showPersonCards, setShowPersonCards] = useState(false);
  const [currentStreamingId, setCurrentStreamingId] = useState(null);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const isMobile = useMobile();

  // 初始化数据
  useEffect(() => {
    // 获取真实访问人次 - 每次进入都重新获取最新数据
    const fetchVisitorCount = async () => {
      const realVisitorCount = await storageService.fetchRealVisitorCount();
      setVisitorCount(realVisitorCount);
    };
    fetchVisitorCount();
    
    // 定期刷新访问人次（每30秒）
    const interval = setInterval(fetchVisitorCount, 30000);
    
    // 检查是否需要显示欢迎弹窗（只在首次访问时显示）
    const hasShownWelcome = localStorage.getItem('hasShownWelcome');
    if (!hasShownWelcome) {
      setShowWelcomeModal(true);
    }
    
    // 添加示例对话
    const exampleMessages = [
      {
        id: 1,
        type: MESSAGE_TYPES.AI,
        content: '欢迎使用搭子人员搜索！🔍\n\n请告诉我您需要什么样的搭子，比如：\n• "给我找一些后端工程师"\n• "我需要会Python的开发者"\n• "找一些有创意的设计师"\n\n我会为您搜索并推荐合适的搭子！',
        timestamp: new Date().toLocaleTimeString()
      }
    ];
    setMessages(exampleMessages);
    
    return () => clearInterval(interval);
  }, []);

  // 保存数据到localStorage
  useEffect(() => {
    if (messages.length > 0) {
      storageService.saveMessages(messages);
    }
  }, [messages]);

  // 调用真实API
  const callRealAPI = useCallback(async (userMessage) => {
    try {
      // 调用真实的后端API
      const response = await apiService.askChatAssistant(
        [userMessage], 
        sessionId
      );
      
      console.log('API返回结果:', response);
      
      // 检查返回的数据格式 - 根据实际API响应调整
      let peopleData = [];
      if (response && response.data && Array.isArray(response.data)) {
        peopleData = response.data;
      } else if (response && Array.isArray(response)) {
        peopleData = response;
      } else if (response && response.people && Array.isArray(response.people)) {
        peopleData = response.people;
      }
      
      // 根据返回的数据生成合适的回复
      let text;
      if (peopleData.length > 0) {
        text = `✅ 为您找到了 ${peopleData.length} 位合适的人员！\n\n`;
        
        peopleData.forEach((person, index) => {
          text += `👤 **搭子 ${index + 1}**\n`;
          text += `• 姓名：${person.name || '未提供'}\n`;
          text += `• 描述：${person.description || '未提供'}\n`;
          if (person.MBTI) text += `• MBTI：${person.MBTI}\n`;
          if (person.contact) text += `• 联系方式：${person.contact}\n`;
          if (person.tag) text += `• 标签：${person.tag}\n`;
          text += `\n`;
        });
        
        text += `🎯 以上搭子都很符合您的需求！`;
      } else {
        text = "对不起，您目前的搭子暂不存在";
      }
      
      return {
        text: response.content || response.message || text,
        peopleData: peopleData
      };
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    }
  }, []);

  // 处理发送消息
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = {
      id: crypto.randomUUID(),
      type: MESSAGE_TYPES.USER,
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);
    
    try {
      // 创建AI消息占位符
      const aiMessageId = crypto.randomUUID();
      const aiMessage = {
        id: aiMessageId,
        type: MESSAGE_TYPES.AI,
        content: '🔍 正在为您搜索合适的人员...',
        timestamp: new Date().toLocaleTimeString(),
        isLoading: true
      };
      setMessages(prev => [...prev, aiMessage]);
      
      const response = await callRealAPI(currentInput);
      
      if (response.peopleData && response.peopleData.length > 0) {
        // 更新消息显示结果
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? {
                ...msg,
                content: response.text,
                isLoading: false,
                peopleData: response.peopleData
              }
            : msg
        ));
        
        // 自动触发显示卡片
        setShowPersonCards(true);
        
        // 显示推送通知
        setTimeout(() => {
          const pushMessage = {
            id: crypto.randomUUID(),
            type: MESSAGE_TYPES.PUSH,
            content: `为您找到了 ${response.peopleData.length} 位匹配的搭子`,
            timestamp: new Date().toLocaleTimeString(),
            peopleData: response.peopleData
          };
          setMessages(prev => [...prev, pushMessage]);
        }, 1000);
      } else {
        // 没有找到数据
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? {
                ...msg,
                content: response.text,
                isLoading: false
              }
            : msg
        ));
      }
      
    } catch (error) {
      console.error('搜索人员失败:', error);
      
      // 显示错误信息
      setMessages(prev => prev.map(msg => 
        msg.isLoading 
          ? {
              ...msg,
              content: `❌ 搜索失败\n\n**错误信息：**\n${error.message}\n\n请检查网络连接或稍后重试。`,
              isLoading: false,
              isError: true
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, callRealAPI]);

  // 处理键盘事件
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // 处理快速开始按钮
  const handleQuickStart = useCallback((text) => {
    setInputValue(text);
    setShowWelcomeModal(false);
  }, []);

  // 处理推送消息点击
  const handlePushClick = useCallback((peopleData) => {
    setShowPersonCards(true);
  }, []);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, scrollToBottom]);

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);



  // 选择的联系人状态
  const [selectedContacts, setSelectedContacts] = useState([]);
  
  // 处理联系人选择
  const handleToggleContact = useCallback((contactId) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  }, []);
  
  // 推送选中的联系人
  const handlePushSelectedContacts = useCallback(() => {
    if (selectedContacts.length === 0) {
      alert('请先选择要推送的联系人');
      return;
    }
    
    // 生成推送UUID
    const pushId = crypto.randomUUID();
    
    // 创建推送消息
    const pushMessage = {
      id: crypto.randomUUID(),
      type: MESSAGE_TYPES.PUSH,
      content: `已为您推送 ${selectedContacts.length} 位联系人的信息！推送ID: ${pushId.slice(0, 8)}`,
      timestamp: new Date().toLocaleTimeString(),
      pushId: pushId,
      selectedContactIds: [...selectedContacts]
    };
    
    setMessages(prev => [...prev, pushMessage]);
    setSelectedContacts([]);
    setShowPersonCards(false);
  }, [selectedContacts]);
  
  // 获取当前显示的人员数据
  const getCurrentPeopleData = useCallback(() => {
    // 从最新的消息中获取人员数据
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].peopleData && messages[i].peopleData.length > 0) {
        return messages[i].peopleData;
      }
    }
    return [];
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* 移动端头部 */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              搭子匹配
            </h1>
            <p className="text-xs text-slate-500">找到你的完美搭子</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowWelcomeModal(true)}
          className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200 transform hover:scale-110"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* 欢迎弹窗 */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">欢迎使用搭子匹配</h2>
              <p className="text-sm text-slate-600">AI智能匹配，找到最适合的搭子</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2 text-sm">💡 使用建议</h3>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• 详细描述你的兴趣爱好</li>
                  <li>• 说明你希望的搭子类型</li>
                  <li>• 提及你的地理位置偏好</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">🚀 快速开始</h3>
                <div className="space-y-2">
                  {[
                    "我想找一个一起健身的搭子",
                    "寻找喜欢看电影的朋友",
                    "想找个一起学习的伙伴",
                    "找个一起旅行的搭子"
                  ].map((text, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickStart(text)}
                      className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all duration-200 text-xs transform hover:scale-105"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowWelcomeModal(false);
                localStorage.setItem('hasShownWelcome', 'true');
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm font-medium transform hover:scale-105"
            >
              开始使用
            </button>
          </div>
        </div>
      )}

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">开始对话</h3>
            <p className="text-sm text-slate-500">告诉我你想找什么样的搭子</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === MESSAGE_TYPES.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              message.type === MESSAGE_TYPES.USER 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : message.type === MESSAGE_TYPES.ERROR
                ? 'bg-red-50 border border-red-200 text-red-700'
                : message.type === MESSAGE_TYPES.PUSH
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 cursor-pointer hover:from-green-100 hover:to-emerald-100 transition-all duration-200'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
            onClick={message.type === MESSAGE_TYPES.PUSH ? () => handlePushClick(message.peopleData) : undefined}
            >
              {message.type === MESSAGE_TYPES.PUSH && (
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-600">搭子推送</span>
                </div>
              )}
              
              <div className="text-sm leading-relaxed">
                {message.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>{message.content}</span>
                  </div>
                ) : (
                  message.content
                )}
              </div>
              
              {message.type === MESSAGE_TYPES.PUSH && (
                <div className="mt-2 text-xs text-green-600">
                  点击查看详情 →
                </div>
              )}
              
              {message.peopleData && message.peopleData.length > 0 && (
                <div className="mt-2 text-xs opacity-70">
                  找到 {message.peopleData.length} 位匹配的人员
                </div>
              )}
              
              <div className={`text-xs mt-2 opacity-70 ${
                message.type === MESSAGE_TYPES.USER ? 'text-white' : 'text-slate-500'
              }`}>
                {message.timestamp}
              </div>
            </div>
          </div>
        ))}
        
        {/* 流式消息显示 */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-white border border-slate-200 text-slate-700 rounded-2xl px-4 py-3">
              <div className="text-sm leading-relaxed">
                {streamingMessage}
                <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-pulse"></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 人员卡片滑窗 */}
      {showPersonCards && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setShowPersonCards(false)}
          />
          
          {/* 滑窗内容 */}
          <div className="fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out animate-slide-up">
            <div className="bg-white rounded-t-3xl shadow-2xl h-[90vh] flex flex-col">
              {/* 滑窗头部 */}
              <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                {/* 拖拽指示器 */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-slate-300 rounded-full"></div>
                
                <div className="mt-2">
                  <h2 className="text-xl font-bold text-slate-800">推荐搭子</h2>
                  <p className="text-sm text-slate-600">为您精选的完美搭子</p>
                </div>
                
                {/* 右上角关闭按钮 */}
                <button 
                  onClick={() => setShowPersonCards(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all duration-200 mt-2 transform hover:scale-110"
                >
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* 推送按钮区域 */}
              {selectedContacts.length > 0 && (
                <div className="px-6 py-3 bg-purple-50 border-b border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">
                      已选择 {selectedContacts.length} 位联系人
                    </span>
                    <button
                      onClick={handlePushSelectedContacts}
                      className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-all duration-200 transform hover:scale-105"
                    >
                      推送联系人
                    </button>
                  </div>
                </div>
              )}
              
              {/* 滑窗内容区域 */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  {(() => {
                    const peopleToShow = getCurrentPeopleData();
                    
                    return peopleToShow.map((person, index) => (
                      <div 
                        key={person.id || index} 
                        className="transform transition-all duration-300 ease-out"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: 'slideInUp 0.5s ease-out forwards'
                        }}
                      >
                        <PersonCard 
                          person={person} 
                          index={index}
                          onToggleSelect={handleToggleContact}
                          isSelected={selectedContacts.includes(person.id || index)}
                        />
                      </div>
                    ));
                  })()}
                </div>
                
                {/* 底部安全区域 */}
                <div className="h-6"></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 输入区域 */}
      <div className="bg-white/80 backdrop-blur-md border-t border-white/20 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="描述你想找的搭子类型..."
              className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm max-h-[120px] bg-white/90"
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-2xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 transform hover:scale-110 active:scale-95"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileApp;