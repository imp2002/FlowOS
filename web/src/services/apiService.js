import axios from 'axios';

const API_BASE_URL = 'https://advx.up.railway.app';
const CHAT_ENDPOINT = '/chat-assistant';

// Kimi API 配置
const KIMI_API_BASE_URL = 'https://api.moonshot.cn/v1';
const KIMI_API_KEY = 'sk-6KDgwhB3ab1bYWVTEkYOTybh2rX95jZlEceu0Jquyy1obQMd';
const KIMI_MODEL = 'moonshot-v1-8k';

export const apiService = {
  // 使用 Kimi API 发送聊天消息（流式输出）
  sendChatMessageStream: async (message, messageHistory = [], onChunk = null) => {
    try {
      // 构建消息历史
      const messages = [
        {
          role: 'system',
          content: '你是一个智能交友助手，帮助用户分析个人信息并匹配合适的朋友。请根据用户的描述，分析他们的兴趣爱好、性格特点和交友需求，并提供个性化的建议。'
        },
        ...messageHistory.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ];

      const response = await fetch(`${KIMI_API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KIMI_API_KEY}`
        },
        body: JSON.stringify({
          model: KIMI_MODEL,
          messages: messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                return fullContent;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  fullContent += content;
                  if (onChunk) {
                    onChunk(content, fullContent);
                  }
                }
              } catch (parseError) {
                // 忽略解析错误，继续处理下一行
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return fullContent;
    } catch (error) {
      console.error('Kimi API调用失败:', error);
      throw error;
    }
  },

  // 发送聊天消息（原有的后端API）
  sendChatMessage: async (message, context = {}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}${CHAT_ENDPOINT}`, {
        message,
        userProfile: context.userProfile || null,
        conversationStage: context.conversationStage || 'initial',
        messageHistory: context.messageHistory || [],
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000 // 30秒超时
      });
      return response.data;
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    }
  },

  // 获取匹配推荐
  getMatches: async (userProfile) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/matches`, {
        userProfile
      });
      return response.data;
    } catch (error) {
      console.error('获取匹配失败:', error);
      throw error;
    }
  },

  // 检查API状态
  checkApiStatus: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200 ? 'online' : 'offline';
    } catch (error) {
      return 'offline';
    }
  }
};