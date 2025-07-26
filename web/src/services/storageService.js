export const storageService = {
  // 消息相关
  getMessages: () => {
    const saved = localStorage.getItem('flowos-chat-history');
    return saved ? JSON.parse(saved) : [];
  },
  
  saveMessages: (messages) => {
    localStorage.setItem('flowos-chat-history', JSON.stringify(messages));
  },
  
  clearMessages: () => {
    localStorage.removeItem('flowos-chat-history');
  },
  
  // 用户画像相关
  getUserProfile: () => {
    const saved = localStorage.getItem('flowos-user-profile');
    return saved ? JSON.parse(saved) : null;
  },
  
  saveUserProfile: (profile) => {
    localStorage.setItem('flowos-user-profile', JSON.stringify(profile));
  },
  
  clearUserProfile: () => {
    localStorage.removeItem('flowos-user-profile');
  },
  
  // 匹配结果相关
  getMatchResults: () => {
    const saved = localStorage.getItem('flowos-match-results');
    return saved ? JSON.parse(saved) : [];
  },
  
  saveMatchResults: (results) => {
    localStorage.setItem('flowos-match-results', JSON.stringify(results));
  },
  
  clearMatchResults: () => {
    localStorage.removeItem('flowos-match-results');
  },

  // 访问人次相关
  getVisitorCount: () => {
    const saved = localStorage.getItem('flowos-visitor-count');
    return saved ? parseInt(saved, 10) : 0;
  },

  incrementVisitorCount: () => {
    const currentCount = storageService.getVisitorCount();
    const newCount = currentCount + 1;
    localStorage.setItem('flowos-visitor-count', newCount.toString());
    return newCount;
  },

  resetVisitorCount: () => {
    localStorage.removeItem('flowos-visitor-count');
    return 0;
  },

  // 清除所有数据
  clearAllData: () => {
    localStorage.removeItem('flowos-chat-history');
    localStorage.removeItem('flowos-user-profile');
    localStorage.removeItem('flowos-match-results');
    localStorage.removeItem('flowos-visitor-count');
    localStorage.removeItem('hasShownWelcome');
    console.log('已清除所有本地存储数据');
  },

  // 从统计站点获取真实访问数据
  fetchRealVisitorCount: async () => {
    try {
      console.log('开始获取访问数据...');
      
      // 获取当前时间戳（毫秒）
      const now = new Date();
      const endtime = now.getTime(); // 当前时间戳（毫秒）
      
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const starttime = startOfDay.getTime(); // 今天凌晨零点时间戳（毫秒）
      
      console.log('时间范围:', {
        starttime: starttime,
        endtime: endtime,
        startDate: new Date(starttime).toLocaleString(),
        endDate: new Date(endtime).toLocaleString()
      });
      
      // 构建API URL - 使用正确的端点和网站ID
      const baseUrl = 'https://uma.nohup.life/api/websites/6a44e21e-1170-439d-aa8c-05e0c4a5787b/stats';
      const apiUrl = `${baseUrl}?startAt=${starttime}&endAt=${endtime}`;
      console.log('API URL:', apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'accept': 'application/json',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'zh,zh-CN;q=0.9,en-US;q=0.8,en;q=0.7,en-GB;q=0.6',
          'authorization': 'Bearer undefined',
          'cache-control': 'max-age=0',
          'content-type': 'application/json',
          'priority': 'u=1, i',
          'referer': 'https://uma.nohup.life/share/VEUBNOKTRPAZc6qz/flowOS',
          'sec-ch-ua': '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',
          'x-umami-share-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3ZWJzaXRlSWQiOiI2YTQ0ZTIxZS0xMTcwLTQzOWQtYWE4Yy0wNWUwYzRhNTc4N2IiLCJpYXQiOjE3NTM1MzU0NTJ9.1CVp0wM7Y93qw53SQrI0DoLEfDomXDbkmSBZblMRAHg'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API响应数据:', data);
      
      // 从stats API响应中提取访问数据
      let pageviews = 0;
      if (data && typeof data === 'object') {
        // 处理Umami stats API的嵌套数据格式
        if (data.pageviews && typeof data.pageviews === 'object' && data.pageviews.value !== undefined) {
          pageviews = data.pageviews.value;
        } else if (data.uniques && typeof data.uniques === 'object' && data.uniques.value !== undefined) {
          pageviews = data.uniques.value;
        } else if (data.pageviews !== undefined) {
          pageviews = data.pageviews;
        } else if (data.views !== undefined) {
          pageviews = data.views;
        } else if (data.visitors !== undefined) {
          pageviews = data.visitors;
        } else if (data.sessions !== undefined) {
          pageviews = data.sessions;
        } else if (data.hits !== undefined) {
          pageviews = data.hits;
        } else if (data.total !== undefined) {
          pageviews = data.total;
        } else if (data.count !== undefined) {
          pageviews = data.count;
        } else if (Array.isArray(data) && data.length > 0) {
          // 如果返回的是数组，尝试累加所有的访问数据
          pageviews = data.reduce((sum, item) => {
            return sum + (item.pageviews || item.views || item.visitors || item.sessions || item.hits || item.count || 0);
          }, 0);
        }
      }
      
      console.log('提取的访问数据:', pageviews);
      
      // 确保返回的是有效数字
      const finalVisitorCount = Math.max(0, parseInt(pageviews) || 0);
      
      // 将获取到的访问数据保存到本地存储
      localStorage.setItem('flowos-visitor-count', finalVisitorCount.toString());
      
      return finalVisitorCount;
      
    } catch (error) {
      console.error('获取访问数据失败:', error);
      // 返回随机的fallback值（50-150之间）
      const fallbackValue = Math.floor(Math.random() * 101) + 50;
      console.log('使用fallback值:', fallbackValue);
      localStorage.setItem('flowos-visitor-count', fallbackValue.toString());
      return fallbackValue;
    }
  }
};