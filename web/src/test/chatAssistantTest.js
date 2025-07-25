// 聊天助手API测试文件
import { apiService } from '../services/apiService';

// 测试askChatAssistant函数
export const testChatAssistant = async () => {
  console.log('开始测试聊天助手API...');
  
  try {
    // 测试消息
    const testMessage = "请给我推荐几个喜欢动漫的朋友";
    
    console.log('发送消息:', testMessage);
    
    // 调用API
    const result = await apiService.askChatAssistant(testMessage, 'test-session');
    
    console.log('API返回结果:', result);
    
    if (result) {
      console.log('✅ 测试成功！');
      return result;
    } else {
      console.log('❌ 测试失败：返回结果为空');
      return null;
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return null;
  }
};

// 如果直接运行此文件
if (typeof window === 'undefined') {
  // Node.js环境
  testChatAssistant();
} else {
  // 浏览器环境
  window.testChatAssistant = testChatAssistant;
  console.log('测试函数已添加到window对象，可在控制台调用: testChatAssistant()');
}

// 导出测试函数
export default testChatAssistant;