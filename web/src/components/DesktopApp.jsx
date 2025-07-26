import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import { analyzeUserProfile } from '../utils/profileAnalyzer';
import { CONVERSATION_STAGES, MESSAGE_TYPES } from '../utils/constants';
import PersonCard from './PersonCard';

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

// 用户提供的后端数据
const backendPersonData = {
  "data": [
    {
      "name": "未提供",
      "description": "你是App的\"造型师\"和\"灵魂注入者\"。你需要将我们\"穿着西装的街头混混\"般的品牌人设，转化为真实的用户体验和视觉界面。我们想要一个既黑暗、优雅，又处处透露着黑色幽默的设计。",
      "MBTI": "未提供",
      "contact": "未提供",
      "tag": "UI/UX设计"
    },
    {
      "name": "未提供",
      "description": "用户界面视觉设计、交互逻辑梳理",
      "MBTI": "未提供",
      "contact": "未提供",
      "tag": "UI/UX设计"
    },
    {
      "name": "未提供",
      "description": "审美在线，熟练使用Figma等原型工具，如果能兼前端就更好了。加分项：对产品/AI有自己的理解，有Hackathon获奖经验，了解Hackathon模式，快速学习能力强，可以身兼多职。",
      "MBTI": "未提供",
      "contact": "未提供",
      "tag": "UI/UX设计, 前端开发"
    }
  ]
};

function DesktopApp() {
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
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showPersonCards, setShowPersonCards] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef(null);

  // 初始化数据
  useEffect(() => {
    // 初始化访问人次 - 每次进入都重新获取最新数据
    const initVisitorCount = async () => {
      const count = await storageService.fetchRealVisitorCount();
      setVisitorCount(count);
    };
    initVisitorCount();
    
    // 定期刷新访问人次（每30秒）
    const interval = setInterval(async () => {
      const count = await storageService.fetchRealVisitorCount();
      setVisitorCount(count);
    }, 30000);
    
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
        content: '欢迎使用搭子人员搜索！🔍\n\n请告诉我您需要什么样的搭子，比如：\n• "我想认识一些具身智能机器人的朋友"\n• "我想认识一些设计人员"\n• "我需要会Python和机器学习的开发者"\n\n我会为您搜索并推荐合适的搭子！',
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
        `太棒了！我已经收集到足够的信息，正在为您进行智能匹配...\n\n🎉 匹配完成！为您找到了几位高度契合的潜在队友，匹配度都在85%以上！请查看右侧的匹配结果，您可以选择感兴趣的联系人进行推送！`,
        `完美！基于您的详细需求，匹配系统已经为您筛选出最合适的搭子。\n\n✅ 个性化匹配已完成\n✅ 高质量推荐已生成\n✅ 联系人信息已准备\n\n请查看匹配结果，选择您感兴趣的联系人进行推送！`
      ]
    };
    
    const stageResponses = responses[stage] || responses[CONVERSATION_STAGES.INITIAL];
    return stageResponses[Math.floor(Math.random() * stageResponses.length)];
  };

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: crypto.randomUUID(),
      type: MESSAGE_TYPES.USER,
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setLoading(true);

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

      // 调用askChatAssistant API获取人员数据
      const result = await apiService.askChatAssistant(
        [currentInput], 
        sessionId
      );

      console.log('API返回结果:', result);

      // 检查返回的数据格式 - 根据实际API响应调整
      let peopleData = [];
      if (result && result.data && Array.isArray(result.data)) {
        peopleData = result.data;
      } else if (result && Array.isArray(result)) {
        peopleData = result;
      } else if (result && result.people && Array.isArray(result.people)) {
        peopleData = result.people;
      }

      if (peopleData.length > 0) {
        // 显示所有找到的人员
        let displayContent = `✅ 为您找到了 ${peopleData.length} 位合适的人员！\n\n`;
        
        peopleData.forEach((person, index) => {
          displayContent += `👤 **搭子 ${index + 1}**\n`;
          displayContent += `• 姓名：${person.name || '未提供'}\n`;
          displayContent += `• 描述：${person.description || '未提供'}\n`;
          if (person.MBTI) displayContent += `• MBTI：${person.MBTI}\n`;
          if (person.contact) displayContent += `• 联系方式：${person.contact}\n`;
          if (person.tag) displayContent += `• 标签：${person.tag}\n`;
          displayContent += `\n`;
        });
        
        displayContent += `🎯 以上搭子都很符合您的需求！`;
        
        // 更新消息显示结果
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? {
                ...msg,
                content: displayContent,
                isLoading: false,
                peopleData: peopleData
              }
            : msg
        ));
        
        // 自动触发分屏显示卡片
        setShowPersonCards(true);
      } else {
        // 没有找到数据
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? {
                ...msg,
                content: `对不起，您目前的搭子暂不存在`,
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
      content: '欢迎使用FlowOS人员搜索！🔍\n\n请告诉我您需要什么样的人，比如：\n• "我想认识一些具身智能机器人的朋友"\n• "我想认识一些设计人员"\n• "我需要会Python和机器学习的开发者"\n\n我会为您搜索并推荐合适的搭子！',
      timestamp: new Date().toLocaleTimeString()
    }]);
    setUserProfile(null);
    setMatchResults([]);
    setShowResults(false);
    setShowPersonCards(false);
    setConversationStage(CONVERSATION_STAGES.INITIAL);
    setSelectedContacts([]);
    setShowContactPush(false);
    setConversationHistory([]);
    setSessionId(crypto.randomUUID());
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
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
      type: MESSAGE_TYPES.AI,
      content: `已为您推送全部 ${matchResults.length} 位联系人的信息！他们会收到您的基本信息，如果双方都感兴趣，系统会自动建立联系。`,
      timestamp: new Date().toLocaleTimeString(),
      isPushNotification: true
    };
    
    setMessages(prev => [...prev, pushMessage]);
    setSelectedContacts([]);
    setShowContactPush(false);
  };

  // 处理欢迎弹窗关闭
  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('hasShownWelcome', 'true');
  };

  // 快速开始
  const handleQuickStart = (text) => {
    setInputValue(text);
    setTimeout(() => handleSendMessage(), 100);
  };

  // 渲染匹配结果
  const renderMatchResults = () => {
    return (
      <div className="fixed top-0 right-0 w-1/2 h-full bg-white/10 backdrop-blur-sm border-l border-white/20 p-6 overflow-y-auto z-20">
        <div className="space-y-6 pt-20">
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
      {/* 欢迎弹窗 */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-8">
              {/* 弹窗头部 */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎使用 FlowOS！</h2>
                <p className="text-gray-600 text-sm">让我们帮您找到最合适的搭子</p>
              </div>
              
              {/* 使用建议 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  使用建议
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 text-sm font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">先进行自我描述</p>
                      <p className="text-gray-600 text-sm">告诉我们您的技能、兴趣和期望</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-pink-600 text-sm font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">描述理想搭子</p>
                      <p className="text-gray-600 text-sm">说明您希望找到什么样的人</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-indigo-600 text-sm font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">获得精准匹配</p>
                      <p className="text-gray-600 text-sm">我们会为您推荐最合适的搭子</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 示例输入 */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">💡 示例输入：</h4>
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 leading-relaxed">
                  "我是一名前端开发者，熟悉React和Vue，希望找一些后端工程师合作开发项目，最好有Python或Node.js经验。"
                </div>
              </div>
              
              {/* 关闭按钮 */}
              <button
                onClick={handleWelcomeModalClose}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                开始使用 FlowOS
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 顶部标题栏 */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-5">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-slate-800">
              FlowOS
            </h1>
            
            {/* 信息收集按钮 */}
            <a
              href="https://ks2ynpxs58.feishu.cn/share/base/form/shrcnIvEYJvxlZOyoroqvBD2cne"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>信息收集</span>
            </a>
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
        <div className={`${(showResults || showPersonCards) ? 'w-1/2 pr-0' : 'w-full'} flex flex-col transition-all duration-300 bg-gradient-to-br from-slate-50 to-purple-50/30`}>
          {/* 聊天消息区域 */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length <= 1 ? (
                <div className="text-center text-slate-600 mt-8">
                  <div className="relative mb-6">
                    <div className="text-5xl mb-4 opacity-80">💬</div>
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-200 to-violet-200 opacity-20 rounded-full blur-2xl"></div>
                  </div>
                  <h2 className="text-2xl font-light text-slate-800 mb-3">AI搭子</h2>
                  <p className="text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">通过智能搜索快速找到符合您需求的专业人才</p>
                  
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
                        onClick={() => handleQuickStart('我想认识一些具身智能机器人的朋友')}
                        className="group w-full text-left p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200/50 hover:border-blue-300/50 hover:shadow-md transition-all duration-200 text-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-7 h-7 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white font-medium text-xs">🤖</div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">"我想认识一些具身智能机器人的朋友"</p>
                            <p className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1.5">点击搜索机器人专家</p>
                          </div>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => handleQuickStart('我需要会Python和机器学习的开发者')}
                        className="group w-full text-left p-4 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-xl border border-violet-200/50 hover:border-violet-300/50 hover:shadow-md transition-all duration-200 text-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-7 h-7 bg-gradient-to-r from-violet-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-medium text-xs">🤖</div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">"我需要会Python和机器学习的开发者"</p>
                            <p className="text-xs text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1.5">点击搜索AI专家</p>
                          </div>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => handleQuickStart('我想认识一些设计人员')}
                        className="group w-full text-left p-4 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-xl border border-emerald-200/50 hover:border-emerald-300/50 hover:shadow-md transition-all duration-200 text-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white font-medium text-xs">🎨</div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">"我想认识一些设计人员"</p>
                            <p className="text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1.5">点击搜索设计人才</p>
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
                    className={`flex ${message.type === MESSAGE_TYPES.USER ? 'justify-end' : 'justify-start'} group mb-4`}
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
                        <div className="whitespace-pre-wrap">
                          {message.content.split('\n').map((line, index) => {
                            // 处理列表项
                            if (line.startsWith('• ') || line.startsWith('→ ') || line.startsWith('✨ ') || line.startsWith('🎯 ')) {
                              return (
                                <div key={index} className="ml-2 mb-1">
                                  {line}
                                </div>
                              );
                            }
                            // 处理标题行（包含 ** 的行）
                            if (line.includes('**') && line.includes('**')) {
                              const parts = line.split('**');
                              return (
                                <div key={index} className="mb-2">
                                  {parts.map((part, partIndex) => 
                                    partIndex % 2 === 1 ? 
                                      <strong key={partIndex} className="font-semibold text-slate-800">{part}</strong> : 
                                      part
                                  )}
                                </div>
                              );
                            }
                            // 普通行
                            return (
                              <div key={index} className={line.trim() === '' ? 'mb-2' : 'mb-1'}>
                                {line || '\u00A0'}
                              </div>
                            );
                          })}
                        </div>
                        {/* 流式输出动画效果 */}
                        {message.isStreaming && (
                          <span className="inline-flex items-center ml-1">
                            <span className="w-1 h-4 bg-purple-400 rounded-full animate-pulse"></span>
                            <span className="w-1 h-4 bg-pink-400 rounded-full animate-pulse ml-0.5" style={{animationDelay: '0.2s'}}></span>
                            <span className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse ml-0.5" style={{animationDelay: '0.4s'}}></span>
                          </span>
                        )}
                      </div>
                      
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

          {/* 底部输入区域 */}
          <div className="bg-gradient-to-t from-purple-50/50 to-white/80 border-t border-purple-200/30 px-6 py-4">
            <div className="max-w-4xl mx-auto">
              {/* 现代化聊天输入框 */}
              <div className="relative">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 mx-4 shadow-xl border border-purple-200/40 transform transition-all duration-300 hover:shadow-2xl">
                  <div className="relative">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="请描述您需要什么样的人，例如：我想认识一些具身智能机器人的朋友、我想认识一些设计人员、我需要会Python和机器学习的开发者..."
                      className="w-full px-6 py-4 pr-20 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border border-purple-200/40 rounded-2xl focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100/50 resize-none text-base text-slate-700 placeholder-purple-400/70 transition-all duration-300 ease-out focus:shadow-lg"
                      rows="2"
                      style={{ 
                        minHeight: '70px', 
                        maxHeight: '160px' 
                      }}
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
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：匹配结果区域 */}
        {showResults && renderMatchResults()}
        
        {/* 右侧：人员卡片区域 */}
        {showPersonCards && (
          <div className="fixed top-0 right-0 w-1/2 h-full bg-white/10 backdrop-blur-sm border-l border-white/20 overflow-y-auto z-20">
            <div className="p-6 pt-20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">推荐人员</h2>
                  <p className="text-sm text-slate-600">为您精选的搭子</p>
                </div>
                <button 
                  onClick={() => setShowPersonCards(false)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {(() => {
                  // 获取最新的包含peopleData的AI消息
                  const latestMessageWithData = messages
                    .filter(msg => msg.type === MESSAGE_TYPES.AI && msg.peopleData && msg.peopleData.length > 0)
                    .pop();
                  
                  const peopleToShow = latestMessageWithData?.peopleData || backendPersonData.data;
                  
                  return peopleToShow.map((person, index) => (
                    <PersonCard key={index} person={person} index={index} />
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 访问人次显示 */}
      <div className="fixed bottom-4 left-4 z-10">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/40 rounded-full shadow-lg backdrop-blur-sm">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-purple-600">
            访问人次: {visitorCount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default DesktopApp;