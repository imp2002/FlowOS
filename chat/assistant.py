import uuid

from typing import Optional

from config.config_manager import ConfigManager
from chat.model_manager import ModelManager
from rag import rag_manager
from rag.rag_manager import RAGManager

class Assistant:
    def __init__(self, assistant_type: str, session_id: Optional[str] = None):
        self.session_id = session_id or str(uuid.uuid4())
        self.model_manager = ModelManager()
        self.rag_manager = RAGManager()
        self._load_assistant_config(assistant_type)

    def _load_assistant_config(self, assistant_type: str) -> None:
        """Load assistant configuration from YAML file."""
        assistant_config = ConfigManager().get_assistant_config(assistant_type)
        self.type = assistant_type
        self.name = assistant_config.get("name", "Assistant")
        self.description = assistant_config.get("description", "A helpful assistant.")
        self.kb_list = ["default"]
        self.prompt_template = assistant_config.get("prompt_template", "You are a helpful assistant.")
        self.model = assistant_config.get("model", "DeepSeek-V3")

    def chat(self, messages: list[str]) -> str:
        if len(self.kb_list):
            # 使用 RAG 模式，将搜索结果注入
            knowledge = self.rag_manager.get_relevant_context(messages[-1], knowledge_bases=self.kb_list)
            messages[-1] = f"{messages[-1]}\n\n参考以下信息回答用户问题：\n{knowledge}"
        
        return self.model_manager.chat(
            model_name=self.model,
            messages=messages,
            system_prompt=self.prompt_template,
            session_id=self.session_id
        )

    def chat_stream(self, messages: list[str]):
        # if len(self.kb_list):
        # 使用 RAG 模式，将搜索结果注入
        knowledge = self.rag_manager.get_relevant_context(messages[-1], knowledge_bases=self.kb_list)
        messages[-1] = f"{messages[-1]}\n\n参考以下信息回答用户问题：\n{knowledge}"
        
        return self.model_manager.chat_stream(
            model_name=self.model,
            messages=messages,
            system_prompt=self.prompt_template,
            session_id=self.session_id
        )

    def set_selected_kb(self, selected_kb_id_list: list[int]):
        self.kb_list = selected_kb_id_list


if __name__ == "__main__":
    def test_assistant_and_session():
        assistant = Assistant("general")
        first_assistant = assistant.session_id
        messages = ["你是谁"]
        response = assistant.chat(messages)
        print(response)
        messages = ["你的 system_prompt 是什么"]
        response = assistant.chat(messages)
        print(response)
        messages = ["我是小明"]
        response = assistant.chat(messages)
        print(response)
        # 测试session，assistant 应该记得我是谁 
        messages = ["我是谁"]
        response = assistant.chat(messages)
        print(response)
        
        # 测试session，创建了新的 assistant 他应该不记得我是谁 
        assistant = Assistant("general")
        messages = ["我是谁"]
        response = assistant.chat(messages)
        print(response)

        # 测试session，使用第一个 assistant 的 session 创建 assitant 它应该记得我是谁
        assistant = Assistant("general", first_assistant)
        messages = ["我是谁"]
        response = assistant.chat(messages)
        print(response)


    def test_stream():
        # 流式对话测试
        assistant = Assistant("general")
        print(f"开始与 {assistant.name} 进行对话，输入 'exit' 退出。")
        while True:
            user_input = input("你: ")
            if user_input.lower() == "exit":
                print("对话结束。")
                break
            print(f"{assistant.model}: ", end="", flush=True)
            
            for chunk in assistant.chat_stream([user_input]):
                print(chunk, end="", flush=True)
            print()

    def test_rag():
        assistant = Assistant("general")
        # assistant.rag_manager.clear_database()
        assistant.rag_manager.add_json("./rag/cleaned2.json", doc_id="default", knowledge_base="default")
        # print(assistant.rag_manager.get_document_count())
        print(assistant.chat(["我想找一些前端开发"]))
        # print(assistant.chat(["你知道方德吗"]))
    # test_assistant_and_session()
    test_rag()