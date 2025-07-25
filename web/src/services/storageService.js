export const storageService = {
  // 消息相关
  getMessages: () => {
    const saved = localStorage.getItem('adventurex-chat-history');
    return saved ? JSON.parse(saved) : [];
  },
  
  saveMessages: (messages) => {
    localStorage.setItem('adventurex-chat-history', JSON.stringify(messages));
  },
  
  clearMessages: () => {
    localStorage.removeItem('adventurex-chat-history');
  },
  
  // 用户画像相关
  getUserProfile: () => {
    const saved = localStorage.getItem('adventurex-user-profile');
    return saved ? JSON.parse(saved) : null;
  },
  
  saveUserProfile: (profile) => {
    localStorage.setItem('adventurex-user-profile', JSON.stringify(profile));
  },
  
  clearUserProfile: () => {
    localStorage.removeItem('adventurex-user-profile');
  },
  
  // 匹配结果相关
  getMatchResults: () => {
    const saved = localStorage.getItem('adventurex-match-results');
    return saved ? JSON.parse(saved) : [];
  },
  
  saveMatchResults: (results) => {
    localStorage.setItem('adventurex-match-results', JSON.stringify(results));
  },
  
  clearMatchResults: () => {
    localStorage.removeItem('adventurex-match-results');
  },

  // 访问人次相关
  getVisitorCount: () => {
    const saved = localStorage.getItem('adventurex-visitor-count');
    return saved ? parseInt(saved, 10) : 0;
  },

  incrementVisitorCount: () => {
    const currentCount = storageService.getVisitorCount();
    const newCount = currentCount + 1;
    localStorage.setItem('adventurex-visitor-count', newCount.toString());
    return newCount;
  },

  resetVisitorCount: () => {
    localStorage.removeItem('adventurex-visitor-count');
    return 0;
  }
};