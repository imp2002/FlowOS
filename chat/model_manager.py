from typing import Dict, Any, List, Generator
from langchain_community.chat_models import ChatTongyi, ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from langchain_deepseek import ChatDeepSeek
from config.config_manager import ConfigManager
from langchain_ollama import ChatOllama
from langchain_core.chat_history import (
    BaseChatMessageHistory,
    InMemoryChatMessageHistory,
)
from langchain_core.runnables.history import RunnableWithMessageHistory
from utils.decorators import singleton
from langchain.chat_models.base import BaseChatModel


@singleton
class ModelManager:
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.memory: Dict[str, BaseChatMessageHistory] = {}
        self.config_manager = ConfigManager()
        self.load_model_config()

    def load_model_config(self):
        """Initialize different LLM models based on configuration"""
        config = self.config_manager.model_config
        for model_name, model_config in config.items():
            model_type = model_config['type']
            
            if model_type == "aliyun":
                self.models[model_name] = ChatTongyi(
                    model=model_config['model_name'],
                    streaming=True,
                    api_key=model_config.get('api_key'),
                    temperature=model_config.get('temperature')
                )
            elif model_type == "deepseek":
                self.models[model_name] = ChatDeepSeek(
                    model=model_config['model_name'],
                    streaming=True,
                    api_key=model_config.get('api_key'),
                    temperature=model_config.get('temperature')
                )
            elif model_type == "ollama":
                self.models[model_name] = ChatOllama(
                    model=model_config['model_name'],
                    streaming=True,
                    api_key=model_config.get('api_key'),
                    base_url=model_config.get('api_base'),
                    temperature=model_config.get('temperature')
                )
            elif model_type in ["xunfei"]:
                self.models[model_name] = ChatOpenAI(
                    model=model_config['model_name'],
                    streaming=True,
                    api_key=model_config.get('api_key'),
                    base_url=model_config.get('api_base'),
                    temperature=model_config.get('temperature')
                )
    
    def get_model_config(self, model_name: str = None) -> Dict[str, Any]:
        """Get configuration for a specific model or all models"""
        return self.config_manager.get_config(model_name)

    def get_model(self, model_name: str) -> BaseChatModel: 
        """Get a specific model by name"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")
        return self.models[model_name]

    def get_session_history(self, session_id: str) -> BaseChatMessageHistory:
        """Get or create chat history for a session"""
        if session_id not in self.memory:
            self.memory[session_id] = InMemoryChatMessageHistory()
        return self.memory[session_id]
    
    def _prepare_messages(self, messages: List[str], system_prompt: str = None, session_id: str = 'default') -> List:
        """Convert string messages to LangChain message objects
        
        Args:
            messages: List of message strings to convert
            session_id: Session identifier to check if system prompt is needed
            system_prompt: Optional system prompt to use
        """
        result = []

        # Add system message if needed
        if self.memory.get(session_id) is None and system_prompt:
            # Whether the memory corresponding to session_id has been initialized determines 
            # whether the system prompt word needs to be added
            result.append(SystemMessage(content=system_prompt))
        
        # Add user messages
        for message in messages:
            result.append(HumanMessage(content=message))
            
        return result
    
    def _get_chat_stream(self, model_name: str, messages: List[str], system_prompt: str = None, session_id: str = 'default'):
        """Common method to set up model, prepare messages and get response stream
        
        Args:
            model_name: Name of the model to use
            messages: List of message strings
            session_id: Identifier for the conversation session
            system_prompt: Optional system prompt to add at the beginning
            
        Returns:
            Response stream from the model
        """
        model = self.get_model(model_name)
        prepared_messages = self._prepare_messages(messages, system_prompt, session_id)
        
        conversation = RunnableWithMessageHistory(
            model, 
            lambda: self.get_session_history(session_id)
        )
        
        return conversation.stream(
            prepared_messages, 
            config={"configurable": {"session_id": session_id}}
        )
    
    def chat(self, model_name: str, messages: List[str], system_prompt: str = None, session_id: str = 'default') -> str:
        """Generate response using specified model
        
        Args:
            model_name: Name of the model to use
            messages: List of message strings
            session_id: Identifier for the conversation session
            system_prompt: Optional system prompt to add at the beginning
            
        Returns:
            String response from the model
        """
        response_stream = self._get_chat_stream(model_name, messages, system_prompt, session_id)
        
        response_text = ""
        for chunk in response_stream:
            response_text += chunk.content
            
        return response_text
    
    def chat_stream(self, model_name: str, messages: List[str], system_prompt: str = None, session_id: str = 'default', ) -> Generator[str, None, None]:
        """Generate streaming response using specified model
        
        Args:
            model_name: Name of the model to use
            messages: List of message strings
            session_id: Identifier for the conversation session
            system_prompt: Optional system prompt to add at the beginning
            
        Yields:
            Chunks of the response as they are generated
        """
        response_stream = self._get_chat_stream(model_name, messages, system_prompt, session_id)
        
        # Build the full response as we stream (for history)
        full_response = ""
        
        for chunk in response_stream:
            chunk_text = chunk.content
            full_response += chunk_text
            yield chunk_text


if __name__ == "__main__":
    model_manager = ModelManager()
    # print(f"test DeepSeek-V3: {model_manager.chat('DeepSeek-V3', ['你是谁', '我刚才和你说了什么'])}")
    # print(f"test DeepSeek-R1: {model_manager.chat('DeepSeek-R1', ['你是谁'])}")
    print(f"test Qwen-Max: {model_manager.chat('Qwen-Max', ['你是谁', '我刚才和你说了什么'])}")
    # print(f"test Ollama-Qwen-0.5B: {model_manager.chat('Ollama-Qwen-0.5B', ['你是谁', '我刚才和你说了什么'])}")

    model_manager = ModelManager()
    model_name = "Qwen-Max"

    print(f"开始与 {model_name} 进行对话，输入 'exit' 退出。")
    while True:
        user_input = input("你: ")
        if user_input.lower() == "exit":
            print("对话结束。")
            break
        print(f"{model_name}: ", end="", flush=True)
        
        for chunk in model_manager.chat_stream(model_name, [user_input], session_id="test"):
            print(chunk, end="", flush=True)
        print()

