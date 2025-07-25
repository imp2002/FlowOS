// 模拟AI分析用户画像
export const analyzeUserProfile = (userInput, existingProfile = null) => {
  const profile = existingProfile || {
    interests: [],
    personality: [],
    goals: [],
    lifestyle: [],
    preferences: []
  };

  const text = userInput.toLowerCase();
  
  // 兴趣爱好检测
  if (text.includes('运动') || text.includes('跑步') || text.includes('健身')) {
    if (!profile.interests.includes('运动')) profile.interests.push('运动');
  }
  if (text.includes('音乐') || text.includes('唱歌')) {
    if (!profile.interests.includes('音乐')) profile.interests.push('音乐');
  }
  if (text.includes('读书') || text.includes('学习')) {
    if (!profile.interests.includes('学习')) profile.interests.push('学习');
  }
  
  // 性格特征检测
  if (text.includes('开朗') || text.includes('外向')) {
    if (!profile.personality.includes('开朗外向')) profile.personality.push('开朗外向');
  }
  if (text.includes('安静') || text.includes('内向')) {
    if (!profile.personality.includes('安静内向')) profile.personality.push('安静内向');
  }
  
  return profile;
};