import React, { useState, useEffect, useRef } from 'react';
import { apiService } from './services/apiService';
import { storageService } from './services/storageService';
import { useApiStatus } from './hooks/useApiStatus';
import { useMobile } from './hooks/useMobile';
import { analyzeUserProfile } from './utils/profileAnalyzer';
import { CONVERSATION_STAGES, MESSAGE_TYPES, API_STATUS } from './utils/constants';

// 模拟人物库数据
const mockPersonDatabase = [
  {
    id: 1,
    name: "李小雨",
    age: 22,
    university: "清华大学",
    major: "计算机科学",
    interests: ["编程", "跑步", "摄影", "旅行"],
    personality: "开朗外向，喜欢挑战",
    avatar: "👩‍💻",
    matchScore: 95
  },
  {
    id: 2,
    name: "张明轩",
    age: 24,
    university: "北京大学",
    major: "经济学",
    interests: ["篮球", "音乐", "读书", "健身"],
    personality: "稳重可靠，有责任心",
    avatar: "👨‍🎓",
    matchScore: 88
  },
  {
    id: 3,
    name: "王思涵",
    age: 21,
    university: "复旦大学",
    major: "心理学",
    interests: ["绘画", "瑜伽", "咖啡", "电影"],
    personality: "温柔细腻，善于倾听",
    avatar: "👩‍🎨",
    matchScore: 92
  }
];

function App() {
  // 状态管理
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchResults, setMatchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [conversationStage, setConversationStage] = useState(CONVERSATION_STAGES.INITIAL);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showContactPush, setShowContactPush] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]); // 新增：对话历史数组
  const messagesEndRef = useRef(null);

  // 使用自定义 hooks
  const apiStatus = useApiStatus();
  const isMobile = useMobile();

  // 初始化数据
  useEffect(() => {
    const savedMessages = storageService.getMessages();
    const savedProfile = storageService.getUserProfile();
    const savedMatches = storageService.getMatchResults();
    
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      // 添加示例对话
      const exampleMessages = [
        {
          id: 1,
          type: MESSAGE_TYPES.AI,
          content: '欢迎使用AdventureX智能匹配！我是您的AI助手，可以通过多轮对话帮您找到最合适的队友。请告诉我您的基本情况和期望吧！',
          timestamp: new Date().toLocaleTimeString()
        }
      ];
      setMessages(exampleMessages);
    }
    
    if (savedProfile) {
      setUserProfile(savedProfile);
    }
    if (savedMatches.length > 0) {
      setMatchResults(savedMatches);
      setShowResults(true);
    }
  }, []);

  // 保存数据到localStorage
  useEffect(() => {
    if (messages.length > 0) {
      storageService.saveMessages(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (userProfile) {
      storageService.saveUserProfile(userProfile);
    }
  }, [userProfile]);

  useEffect(() => {
    if (matchResults.length > 0) {
      storageService.saveMatchResults(matchResults);
    }
  }, [matchResults]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 模拟匹配算法
  const findMatches = (userInput, profile) => {
    const matches = mockPersonDatabase.map(person => {
      let score = person.matchScore;
      
      // 根据兴趣匹配调整分数
      profile.interests.forEach(interest => {
        if (person.interests.some(pInterest => 
          pInterest.includes(interest) || interest.includes(pInterest)
        )) {
          score += 5;
        }
      });
      
      return { ...person, matchScore: Math.min(score, 100) };
    });
    
    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  };

  // 生成AI响应
  const generateAIResponse = (stage, userInput, currentProfile, matches) => {
    const responses = {
      [CONVERSATION_STAGES.INITIAL]: [
        `了解了您的基本情况！${userInput.includes('计算机') ? '计算机专业很有前景呢！' : ''}${userInput.includes('跑步') ? '跑步是很好的运动习惯！' : ''}${userInput.includes('摄影') ? '摄影能记录美好瞬间！' : ''} \n\n为了更精准地为您匹配，请告诉我：\n\n🎯 您希望队友的年龄范围是？\n🎯 对学校或专业有特殊要求吗？\n🎯 您更喜欢什么性格的人？`,
        `很棒的自我介绍！让我们进一步了解您的偏好：\n\n• 您希望找到同校的朋友还是不限学校？\n• 对方的兴趣爱好中，哪些是您最看重的？\n• 您期望的交流频率是怎样的？`,
        `听起来您很清楚自己想要什么！为了找到最合适的伙伴，还想了解：\n\n→ 您的空闲时间主要在什么时候？\n→ 希望对方具备什么特质？\n→ 对初次见面有什么想法？`
      ],
      [CONVERSATION_STAGES.REFINING]: [
        `很好！根据您的补充信息，我对您的需求有了更清晰的了解。${currentProfile.interests && currentProfile.interests.length > 0 ? `看得出您的兴趣很广泛：${currentProfile.interests.slice(0,2).join('、')}等。` : ''} \n\n让我再确认几个细节：\n\n🎯 您最看重的匹配因素是什么？\n🎯 对于初次见面，您更倾向于什么方式？`,
        `完善的信息！我已经记录了您的偏好。最后想确认：\n\n✨ 您希望我优先匹配哪类特征的人？\n✨ 对于队友的沟通风格有偏好吗？\n✨ 准备好开始匹配了吗？`,
        `信息收集得差不多了！基于您的描述，我有信心为您找到合适的伙伴。\n\n🔍 让我最后确认一下重点需求...\n🔍 您觉得还有什么重要信息需要补充吗？`
      ],
      [CONVERSATION_STAGES.FINAL]: [
        `太棒了！我已经收集到足够的信息，正在为您进行智能匹配...\n\n🎉 匹配完成！为您找到了几位高度契合的潜在队友，匹配度都在85%以上！${isMobile ? '请查看下方的推荐卡片' : '请查看右侧的匹配结果'}，您可以选择感兴趣的联系人进行推送！`,
        `完美！基于您的详细需求，匹配系统已经为您筛选出最合适的候选人。\n\n✅ 个性化匹配已完成\n✅ 高质量推荐已生成\n✅ 联系人信息已准备\n\n${isMobile ? '请查看下方推荐卡片' : '请查看匹配结果'}，选择您感兴趣的联系人进行推送！`
      ]
    };
    
    const stageResponses = responses[stage] || responses[CONVERSATION_STAGES.INITIAL];
    return stageResponses[Math.floor(Math.random() * stageResponses.length)];
  };

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: MESSAGE_TYPES.USER,
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setLoading(true);

    // 添加用户消息到对话历史
    const newUserHistoryMessage = {
      role: 'user',
      content: currentInput
    };
    setConversationHistory(prev => [...prev, newUserHistoryMessage]);

    try {
      // 分析用户画像
      const updatedProfile = analyzeUserProfile(currentInput, userProfile);
      setUserProfile(updatedProfile);
      
      let newStage = conversationStage;
      let aiResponseText = '';
      let matches = [];
      
      // 创建AI消息占位符用于流式更新
      const aiMessageId = Date.now() + 1;
      const aiMessage = {
        id: aiMessageId,
        type: MESSAGE_TYPES.AI,
        content: '',
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true
      };
      setMessages(prev => [...prev, aiMessage]);
      
      try {
        // 使用Kimi API流式输出
        await apiService.sendChatMessageStream(
          conversationHistory.concat([newUserHistoryMessage]),
          (chunk) => {
            // 流式更新AI消息内容
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: msg.content + chunk, isStreaming: true }
                : msg
            ));
          },
          () => {
            // 流式输出完成
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, isStreaming: false }
                : msg
            ));
            setLoading(false);
          },
          (error) => {
            console.error('Kimi API流式输出错误:', error);
            // 流式输出出错时的处理
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    content: msg.content || '抱歉，处理您的消息时出现了问题，请稍后重试。',
                    isStreaming: false,
                    isError: true
                  }
                : msg
            ));
            setLoading(false);
          }
        );
        
        // 获取完整的AI响应内容
        const finalAiMessage = messages.find(msg => msg.id === aiMessageId);
        if (finalAiMessage && finalAiMessage.content) {
          aiResponseText = finalAiMessage.content;
          
          // 添加AI响应到对话历史
          const newAiHistoryMessage = {
            role: 'assistant',
            content: aiResponseText
          };
          setConversationHistory(prev => [...prev, newAiHistoryMessage]);
        }
        
      } catch (apiError) {
        console.warn('Kimi API调用失败，使用本地逻辑:', apiError);
        
        // API失败时使用本地逻辑
        // 判断对话阶段转换
        if (conversationStage === CONVERSATION_STAGES.INITIAL && !newStage) {
          newStage = CONVERSATION_STAGES.REFINING;
        } else if (conversationStage === CONVERSATION_STAGES.REFINING && 
                   (currentInput.includes('满意') || currentInput.includes('可以') || 
                    currentInput.includes('就这样') || currentInput.includes('确定'))) {
          newStage = CONVERSATION_STAGES.FINAL;
          setShowContactPush(true);
        }
        
        // 如果到了最终阶段且没有匹配结果，生成本地匹配
        if (newStage === CONVERSATION_STAGES.FINAL && matches.length === 0) {
          matches = findMatches(currentInput, updatedProfile);
        }
        
        // 生成本地AI响应
        aiResponseText = generateAIResponse(newStage, currentInput, updatedProfile, matches);
        
        // 更新流式消息为本地生成的响应
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: aiResponseText,
                isStreaming: false,
                hasMatches: matches.length > 0,
                stage: newStage,
                matchResults: (isMobile && newStage === CONVERSATION_STAGES.FINAL) ? matches : null,
                userProfile: (isMobile && newStage === CONVERSATION_STAGES.FINAL) ? updatedProfile : null
              }
            : msg
        ));
        
        // 添加本地生成的AI响应到对话历史
        const newAiHistoryMessage = {
          role: 'assistant',
          content: aiResponseText
        };
        setConversationHistory(prev => [...prev, newAiHistoryMessage]);
      }
      
      // 更新匹配结果
      if (matches.length > 0) {
        setMatchResults(matches);
        setShowResults(true);
      }
      
      setConversationStage(newStage);
      
    } catch (error) {
      console.error('处理消息失败:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: MESSAGE_TYPES.AI,
        content: '抱歉，处理您的消息时出现了问题，请稍后重试。',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 清空历史记录
  const clearHistory = () => {
    setMessages([{
      id: 1,
      type: MESSAGE_TYPES.AI,
      content: '欢迎使用AdventureX智能匹配！我是您的AI助手，可以通过多轮对话帮您找到最合适的队友。请告诉我您的基本情况和期望吧！',
      timestamp: new Date().toLocaleTimeString()
    }]);
    setUserProfile(null);
    setMatchResults([]);
    setShowResults(false);
    setConversationStage(CONVERSATION_STAGES.INITIAL);
    setSelectedContacts([]);
    setShowContactPush(false);
    setConversationHistory([]); // 清空对话历史数组
    storageService.clearMessages();
  };

  // 开始新匹配
  const startNewMatch = () => {
    setShowResults(false);
    setMatchResults([]);
    setUserProfile(null);
    setConversationStage(CONVERSATION_STAGES.INITIAL);
    setSelectedContacts([]);
    setShowContactPush(false);
  };

  // 切换联系人选择
  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  // 处理联系人推送
  const handleContactPush = () => {
    if (selectedContacts.length === 0) {
      alert('请先选择要推送的联系人');
      return;
    }
    
    const pushMessage = {
      id: Date.now(),
      type: MESSAGE_TYPES.AI,
      content: `已为您推送 ${selectedContacts.length} 位联系人的信息！他们会收到您的基本信息，如果双方都感兴趣，系统会自动建立联系。`,
      timestamp: new Date().toLocaleTimeString(),
      isPushNotification: true
    };
    
    setMessages(prev => [...prev, pushMessage]);
    setSelectedContacts([]);
    setShowContactPush(false);
  };

  // 处理一键推送全部联系人
  const handlePushAllContacts = () => {
    if (matchResults.length === 0) {
      alert('暂无可推送的联系人');
      return;
    }
    
    const allContactIds = matchResults.map(match => match.id);
    setSelectedContacts(allContactIds);
    
    const pushMessage = {
      id: Date.now(),
      type: MESSAGE_TYPES.AI,
      content: `已为您推送全部 ${matchResults.length} 位联系人的信息！他们会收到您的基本信息，如果双方都感兴趣，系统会自动建立联系。`,
      timestamp: new Date().toLocaleTimeString(),
      isPushNotification: true
    };
    
    setMessages(prev => [...prev, pushMessage]);
    setSelectedContacts([]);
    setShowContactPush(false);
  };

  // 处理聊天界面的联系人推送
  const handleChatPushContacts = async () => {
    try {
      // 模拟调用后端接口
      console.log('调用后端接口推送联系人信息...');
      
      // 这里可以添加实际的API调用
      // const response = await apiService.pushContactInfo(userProfile);
      
      const pushMessage = {
        id: Date.now(),
        type: MESSAGE_TYPES.AI,
        content: '📱 已通过后端接口推送您的联系人基本信息！系统会自动匹配合适的用户并建立联系。',
        timestamp: new Date().toLocaleTimeString(),
        isPushNotification: true
      };
      
      setMessages(prev => [...prev, pushMessage]);
      
      // 显示成功提示
      alert('联系人信息推送成功！');
      
    } catch (error) {
      console.error('推送联系人信息失败:', error);
      
      const errorMessage = {
        id: Date.now(),
        type: MESSAGE_TYPES.AI,
        content: '❌ 推送联系人信息失败，请稍后重试。',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      alert('推送失败，请稍后重试！');
    }
  };

  // 快速开始
  const handleQuickStart = (text) => {
    setInputValue(text);
    setTimeout(() => handleSendMessage(), 100);
  };

  // 渲染内联推荐卡片
  const renderInlineMatchCards = (matches, profile) => {
    return (
      <div className="mt-4 space-y-3">
        {/* 用户画像分析 */}
        {profile && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">📊 您的画像分析</h4>
            <div className="space-y-1 text-xs">
              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <span className="text-blue-700 font-medium">兴趣：</span>
                  <span className="text-blue-600">{profile.interests.join('、')}</span>
                </div>
              )}
              {profile.personality && profile.personality.length > 0 && (
                <div>
                  <span className="text-blue-700 font-medium">性格：</span>
                  <span className="text-blue-600">{profile.personality.join('、')}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 推荐卡片 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="text-sm font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">为您推荐</h4>
            <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
              {matches.length} 个匹配
            </div>
          </div>
          {matches.map((match) => (
            <div key={match.id} className="group p-4 bg-white rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-lg transform hover:scale-102 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <span className="text-xl">{match.avatar}</span>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800 group-hover:text-emerald-800 transition-colors duration-300">{match.name}</div>
                    <div className="text-xs text-gray-600">{match.age}岁 · {match.university}</div>
                    <div className="flex items-center space-x-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-2.5 h-2.5 ${i < Math.floor(match.matchScore / 20) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                  {match.matchScore}% 匹配
                </div>
              </div>
              <div className="text-xs text-gray-700 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-800">兴趣：</span>{match.interests.slice(0, 3).join('、')}
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <span>发起聊天</span>
                </button>
                <button 
                  onClick={() => toggleContactSelection(match.id)}
                  className={`flex-1 text-xs px-3 py-2 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center space-x-1 ${
                    selectedContacts.includes(match.id)
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
                      : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400'
                  }`}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span>{selectedContacts.includes(match.id) ? '已选择' : '选择联系人'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* 联系人推送按钮 */}
        {selectedContacts.length > 0 && (
          <button
            onClick={handleContactPush}
            className="w-full text-sm bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3 rounded-2xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            <span>推送联系方式 ({selectedContacts.length})</span>
            <div className="w-2 h-2 bg-white bg-opacity-30 rounded-full animate-pulse"></div>
          </button>
        )}
      </div>
    );
  };

  // 渲染匹配结果
  const renderMatchResults = () => {
    return (
      <div className="w-1/2 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* 用户画像分析 */}
          {userProfile && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">📊 您的画像分析</h3>
              <div className="space-y-2">
                {userProfile.interests && userProfile.interests.length > 0 && (
                  <div>
                    <span className="text-blue-700 font-medium">兴趣爱好：</span>
                    <span className="text-blue-600">{userProfile.interests.join('、')}</span>
                  </div>
                )}
                {userProfile.personality && userProfile.personality.length > 0 && (
                  <div>
                    <span className="text-blue-700 font-medium">性格特点：</span>
                    <span className="text-blue-600">{userProfile.personality.join('、')}</span>
                  </div>
                )}
                {userProfile.goals && userProfile.goals.length > 0 && (
                  <div>
                    <span className="text-blue-700 font-medium">目标期望：</span>
                    <span className="text-blue-600">{userProfile.goals.join('、')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 推荐匹配 */}
          <div>
            {/* 匹配结果标题和快捷操作 */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">为您推荐的队友</h3>
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                  找到 {matchResults.length} 个匹配
                </div>
              </div>
              <button
                onClick={handlePushAllContacts}
                className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-2xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                <span>一键推送全部</span>
              </button>
            </div>
            <div className="space-y-4">
              {matchResults.map((match) => (
                <div key={match.id} className="group bg-white rounded-2xl border-2 border-emerald-100 p-5 hover:border-emerald-300 hover:shadow-xl transform hover:scale-102 transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <span className="text-3xl">{match.avatar}</span>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 group-hover:text-emerald-800 transition-colors duration-300">{match.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{match.age}岁 · {match.university} · {match.major}</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-4 h-4 ${i < Math.floor(match.matchScore / 20) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-emerald-600 font-medium">{match.matchScore}% 匹配</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold border border-emerald-200 shadow-sm">
                        {match.matchScore}% 匹配
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                      <span className="font-semibold text-gray-800">性格特点：</span>
                      <span className="text-gray-600">{match.personality}</span>
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-800">兴趣爱好：</span>
                      <span className="text-gray-600">{match.interests.join('、')}</span>
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span>发起聊天</span>
                    </button>
                    <button 
                      onClick={() => toggleContactSelection(match.id)}
                      className={`flex-1 px-4 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 ${
                        selectedContacts.includes(match.id)
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
                          : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span>{selectedContacts.includes(match.id) ? '已选择联系人' : '选择联系人'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 联系人推送 */}
          {showContactPush && selectedContacts.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-3xl p-6 border-2 border-emerald-200 shadow-xl backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">联系人推送</h4>
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                  {selectedContacts.length} 位联系人
                </div>
              </div>
              <p className="text-sm text-emerald-700 mb-4 leading-relaxed bg-white bg-opacity-60 p-3 rounded-xl border border-emerald-200">
                已选择 {selectedContacts.length} 位联系人，点击下方按钮推送您的联系方式，系统会自动匹配合适的用户并建立联系。
              </p>
              <button
                onClick={handleContactPush}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4 rounded-2xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                <span>推送联系方式</span>
                <div className="w-2 h-2 bg-white bg-opacity-30 rounded-full animate-pulse"></div>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-slate-100 flex flex-col">
      {/* 顶部标题栏 - 清新简约风格 */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 px-6 py-5 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* 推荐联系人按钮 */}
            <button
              onClick={handleChatPushContacts}
              className="group flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/50 hover:border-blue-300/50 rounded-lg transition-all duration-200 text-sm font-medium text-blue-700 hover:text-blue-800 shadow-sm hover:shadow-md"
            >
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <span>推荐联系人</span>
            </button>
            
            <h1 className={`font-semibold text-slate-800 ${
              isMobile ? 'text-lg' : 'text-xl'
            }`}>
              FlowOS
              {/* 清新的API状态指示器 */}
               <span className={`ml-3 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                 apiStatus === API_STATUS.ONLINE ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                 apiStatus === API_STATUS.OFFLINE ? 'bg-red-50 text-red-600 border border-red-200' :
                 'bg-amber-50 text-amber-600 border border-amber-200'
               }`}>
                 <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                   apiStatus === API_STATUS.ONLINE ? 'bg-emerald-500' :
                   apiStatus === API_STATUS.OFFLINE ? 'bg-red-500' :
                   'bg-amber-500 animate-pulse'
                 }`}></div>
                 {apiStatus === API_STATUS.ONLINE ? '在线' :
                  apiStatus === API_STATUS.OFFLINE ? '离线' : '检查中'}
               </span>
             </h1>
             
             {/* 简洁的对话进度指示器 */}
             <div className="flex items-center mt-2 space-x-4">
               <div className="flex items-center space-x-1.5">
                 <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                   conversationStage === CONVERSATION_STAGES.INITIAL ? 'bg-rose-400' : 
                   conversationStage === CONVERSATION_STAGES.REFINING || conversationStage === CONVERSATION_STAGES.FINAL ? 'bg-emerald-400' : 'bg-slate-300'
                 }`}></div>
                 <span className={`text-xs font-medium ${
                   conversationStage === CONVERSATION_STAGES.INITIAL ? 'text-rose-600' : 'text-slate-500'
                 }`}>初步了解</span>
               </div>
               <div className="flex items-center space-x-1.5">
                 <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                   conversationStage === CONVERSATION_STAGES.REFINING ? 'bg-rose-400' : 
                   conversationStage === CONVERSATION_STAGES.FINAL ? 'bg-emerald-400' : 'bg-slate-300'
                 }`}></div>
                 <span className={`text-xs font-medium ${
                   conversationStage === CONVERSATION_STAGES.REFINING ? 'text-rose-600' : 'text-slate-500'
                 }`}>深度对话</span>
               </div>
               <div className="flex items-center space-x-1.5">
                 <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                   conversationStage === CONVERSATION_STAGES.FINAL ? 'bg-emerald-400' : 'bg-slate-300'
                 }`}></div>
                 <span className={`text-xs font-medium ${
                   conversationStage === CONVERSATION_STAGES.FINAL ? 'text-emerald-600' : 'text-slate-500'
                 }`}>匹配完成</span>
               </div>
             </div>
           </div>
          {/* 清新的按钮区域 */}
           <div className="flex items-center space-x-3">
             <button
               onClick={clearHistory}
               className="text-sm text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all duration-200 font-medium"
             >
               清除历史
             </button>
           </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 左侧：对话区域 */}
        <div className={`${showResults && !isMobile ? 'w-1/2' : 'w-full'} flex flex-col transition-all duration-300`}>
          {/* 聊天消息区域 */}
          <div className="flex-1 overflow-y-auto px-4 py-3">

            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length <= 1 ? (
                <div className="text-center text-slate-600 mt-8">
                  <div className="relative mb-6">
                    <div className="text-5xl mb-4 opacity-80">💬</div>
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-200 to-violet-200 opacity-20 rounded-full blur-2xl"></div>
                  </div>
                  <h2 className="text-2xl font-light text-slate-800 mb-3">AI智能交友</h2>
                  <p className="text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">通过智能对话分析和个性化匹配，连接志同道合的人</p>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-left max-w-3xl mx-auto shadow-lg border border-slate-200/50">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-6 h-6 bg-gradient-to-r from-rose-400 to-violet-400 rounded-lg flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-700">快速开始示例</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <button 
                        onClick={() => handleQuickStart('我是计算机专业学生，喜欢跑步和摄影，寻找志同道合的朋友一起学习和运动。')}
                        className="group w-full text-left p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200/50 hover:border-blue-300/50 hover:shadow-md transition-all duration-200 text-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-7 h-7 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-medium">🎓</div>
                          <div className="flex-1">
                            <p className="text-slate-700 font-medium leading-relaxed">"我是计算机专业学生，喜欢跑步和摄影，寻找志同道合的朋友"</p>
                            <p className="text-xs text-blue-600 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">点击开始学术匹配</p>
                          </div>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => handleQuickStart('寻找有技术背景、性格开朗、热爱讨论创新项目想法的创业合伙人。')}
                        className="group w-full text-left p-4 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-xl border border-violet-200/50 hover:border-violet-300/50 hover:shadow-md transition-all duration-200 text-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-7 h-7 bg-gradient-to-r from-violet-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-medium">💼</div>
                          <div className="flex-1">
                            <p className="text-slate-700 font-medium leading-relaxed">"寻找有技术背景且热爱创新的创业合伙人"</p>
                            <p className="text-xs text-violet-600 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">点击开始商务匹配</p>
                          </div>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => handleQuickStart('寻找喜欢音乐和旅行、年龄相近的朋友，一起参加音乐节和探索新地方。')}
                        className="group w-full text-left p-4 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-xl border border-emerald-200/50 hover:border-emerald-300/50 hover:shadow-md transition-all duration-200 text-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-medium">🎵</div>
                          <div className="flex-1">
                            <p className="text-slate-700 font-medium leading-relaxed">"寻找喜欢音乐和旅行的朋友，一起探索新体验"</p>
                            <p className="text-xs text-emerald-600 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">点击开始兴趣匹配</p>
                          </div>
                        </div>
                      </button>
                    </div>
                    
                    <div className="mt-6 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">点击示例开始，或在下方描述您的偏好</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === MESSAGE_TYPES.USER ? 'justify-end' : 'justify-start'} mb-4 group`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 group-hover:shadow-md relative ${
                        message.type === MESSAGE_TYPES.USER
                          ? 'bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-500 text-white rounded-br-md shadow-lg'
                          : message.isError
                          ? 'bg-gradient-to-br from-rose-50 to-pink-50 text-red-700 border border-rose-200/50 rounded-bl-md'
                          : message.isPushNotification
                          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/50 rounded-bl-md'
                          : 'bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 text-slate-700 border border-purple-200/30 rounded-bl-md shadow-sm'
                      }`}
                    >
                      {/* AI message with icon */}
                      {message.type === MESSAGE_TYPES.AI && !message.isError && !message.isPushNotification && (
                        <div className="flex items-start space-x-2 mb-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                          <div className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">FlowOS AI</div>
                        </div>
                      )}
                      
                      <div className={`text-sm leading-relaxed ${
                        message.type === MESSAGE_TYPES.USER ? 'font-medium' : 'font-normal'
                      }`}>
                        {message.content}
                        {/* 流式输出动画效果 */}
                        {message.isStreaming && (
                          <span className="inline-flex items-center ml-1">
                            <span className="w-1 h-4 bg-purple-400 rounded-full animate-pulse"></span>
                            <span className="w-1 h-4 bg-pink-400 rounded-full animate-pulse ml-0.5" style={{animationDelay: '0.2s'}}></span>
                            <span className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse ml-0.5" style={{animationDelay: '0.4s'}}></span>
                          </span>
                        )}
                      </div>
                      
                      {/* 移动端内联推荐卡片 */}
                      {message.type === MESSAGE_TYPES.AI && message.matchResults && isMobile && (
                        renderInlineMatchCards(message.matchResults, message.userProfile)
                      )}
                      
                      <div className={`text-xs mt-2 opacity-60 ${
                        message.type === MESSAGE_TYPES.USER 
                          ? 'text-blue-100 text-right' 
                          : message.isError
                          ? 'text-red-500'
                          : message.isPushNotification
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}>
                        {message.timestamp}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* 现代化加载状态 */}
              {loading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gradient-to-br from-purple-50/90 via-pink-50/90 to-white/90 backdrop-blur-sm border border-purple-200/40 shadow-lg rounded-2xl rounded-bl-md px-5 py-4 max-w-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce shadow-sm"></div>
                        <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce shadow-sm" style={{animationDelay: '0.15s'}}></div>
                        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce shadow-sm" style={{animationDelay: '0.3s'}}></div>
                      </div>
                      <span className="text-sm text-purple-600 font-semibold">FlowOS AI 正在分析...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 底部输入区域 - 现代简约风格 */}
          <div className="bg-gradient-to-t from-purple-50/50 to-white/80 border-t border-purple-200/30 px-6 py-4">
            <div className="max-w-4xl mx-auto">
              
              {/* 现代化聊天输入框 */}
              <div className="relative">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-200/40 p-6 mx-4 transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                  <div className="relative">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        conversationStage === CONVERSATION_STAGES.INITIAL 
                          ? "描述您的情况和期望，例如：我是大三学生，喜欢运动和摄影，希望找到志同道合的朋友..."
                          : conversationStage === CONVERSATION_STAGES.REFINING
                          ? "补充更多偏好，例如：年龄相近、同校优先、性格开朗..."
                          : "如果对当前匹配满意，请说'满意'或'确认'以进行联系方式分享"
                      }
                      className="w-full px-6 py-4 pr-20 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border border-purple-200/40 rounded-2xl focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100/50 resize-none text-slate-700 placeholder-purple-400/70 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg"
                      rows="2"
                      style={{ minHeight: '70px', maxHeight: '160px' }}
                      disabled={loading}
                    />
                    
                    {/* 现代化发送按钮 */}
                    <button
                      onClick={handleSendMessage}
                      disabled={loading || !inputValue.trim()}
                      className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-600 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center group transform hover:scale-110 active:scale-95"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* 简洁的状态指示器 */}
                <div className="mt-6 flex items-center justify-center">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        loading ? 'bg-purple-400 animate-pulse shadow-lg' : 
                        conversationStage === CONVERSATION_STAGES.INITIAL ? 'bg-slate-300' :
                        conversationStage === CONVERSATION_STAGES.REFINING ? 'bg-purple-400 shadow-purple-200 shadow-lg' :
                        'bg-pink-400 shadow-pink-200 shadow-lg'
                      }`}></div>
                      <span className="text-sm font-medium text-purple-600">
                        {loading ? '分析中...' :
                         conversationStage === CONVERSATION_STAGES.INITIAL ? '准备输入' :
                         conversationStage === CONVERSATION_STAGES.REFINING ? '优化匹配' :
                         '匹配完成'}
                      </span>
                    </div>
                    
                    {/* 简洁的匹配进度 */}
                    {conversationStage !== CONVERSATION_STAGES.INITIAL && (
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-purple-500 font-medium">进度</span>
                        <div className="w-20 h-2 bg-purple-100 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-700 ease-out rounded-full shadow-sm ${
                              conversationStage === CONVERSATION_STAGES.REFINING ? 'bg-gradient-to-r from-purple-400 to-pink-400 w-2/3' : 'bg-gradient-to-r from-pink-400 to-purple-500 w-full'
                            }`}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-purple-600">
                          {conversationStage === CONVERSATION_STAGES.REFINING ? '66%' : '100%'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：匹配结果区域 (仅在非移动端显示) */}
        {showResults && !isMobile && renderMatchResults()}
      </div>
      

    </div>
  );
}

export default App;