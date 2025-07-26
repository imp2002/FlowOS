import os
import base64
import json
import re
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv
from chat.assistant import Assistant
from typing import Optional, List, Any
from rag.rag_manager import RAGManager
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from config.database import get_db
from models.chat_record import ChatRecord
from langchain_core.documents import Document


# 从 .env 文件加载环境变量
load_dotenv()

# --- Pydantic 模型定义 ---
# 定义客户端发送过来的请求体结构
class ImageQuery(BaseModel):
    # 使用Field来增加描述，这会在自动生成的API文档中显示
    image_base64: str = Field(..., description="图片的 Base64 编码字符串 (不包含'data:image/jpeg;base64,')")
    prompt: str = Field("请描述图片的内容。", description="希望Kimi执行的任务指令")
    image_format: str = Field("png", description="图片格式，例如 png, jpeg, gif等")

# 定义返回给客户端的响应体结构
class DescriptionResponse(BaseModel):
    description: str

class AssistantChatRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="可选，会话ID，复用则记忆上下文")
    messages: List[str] = Field(..., description="消息历史，最后一条为当前用户输入")

class AssistantChatResponse(BaseModel):
    data: Any

class DocumentUploadResponse(BaseModel):
    success: bool
    message: str

class ChatRecordResponse(BaseModel):
    id: int
    session_id: Optional[str]
    messages: str
    created_at: str


app = FastAPI(
    title="Kimi Vision API Wrapper",
    description="一个将Kimi视觉能力包装为HTTP接口的服务，供移动端调用。",
    version="1.0.0",
)


api_key = os.environ.get("MOONSHOT_API_KEY")
if not api_key:
    raise RuntimeError("MOONSHOT_API_KEY 环境变量未设置, 请在 .env 文件中添加。")

client = OpenAI(
    api_key=api_key,
    base_url="https://api.moonshot.cn/v1",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # 允许任何域
    allow_credentials=True,     # 可以带 cookie 等凭证（设成 True 时才需要）
    allow_methods=["*"],        # 允许任何 HTTP 方法
    allow_headers=["*"],        # 允许任何请求头
)



@app.post("/describe-image", response_model=DescriptionResponse)
async def describe_image(query: ImageQuery):
    """
    接收一张图片的Base64编码和指令，返回Kimi对图片的描述。
    """
    try:
        # 构造符合 Kimi API 要求的 image_url
        # 格式: "data:image/{格式};base64,{base64编码的字符串}"
        image_url = f"data:image/{query.image_format};base64,{query.image_base64}"
        
        # 调用 Kimi API
        completion = client.chat.completions.create(
            model="moonshot-v1-8k-vision-preview",
            messages=[
                {"role": "system", "content": "你是 Kimi，一个擅长理解和描述图片的AI助手。"},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url,
                            },
                        },
                        {
                            "type": "text",
                            "text": query.prompt,
                        },
                    ],
                },
            ],
            # 可以根据需要调整其他参数
            temperature=0.3,
        )
        
        # 提取并返回结果
        description_text = completion.choices[0].message.content
        return DescriptionResponse(description=description_text)

    except Exception as e:
        # 如果调用Kimi API出错，则返回一个 HTTP 500 错误
        print(f"调用Kimi API时发生错误: {e}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")


@app.post("/chat-assistant", response_model=AssistantChatResponse)
async def chat_assistant(query: AssistantChatRequest, db: Session = Depends(get_db)):
    """
    使用 Assistant 聊天能力。
    assistant_type: 助手类型，如 'general'。
    session_id: 可选，会话ID。
    messages: 聊天消息历史。
    """
    try:        
        # 记录请求到数据库
        try:
            
            # 确保messages是字符串格式
            messages_json = json.dumps(query.messages, ensure_ascii=False)
            
            chat_record = ChatRecord(
                session_id=query.session_id,
                messages=messages_json
            )
            
            db.add(chat_record)            
            db.commit()
            
        except Exception as db_error:
            import traceback
            # 数据库错误不应该影响聊天功能，所以继续执行
            db.rollback()
        

        doc = Document(
            page_content=query.messages[-1],
            metadata={
                "source": query.session_id,
                "name": "chat_record",
                "knowledge_base": "default"
            }
        )
        

        assistant = Assistant("general", query.session_id)
        response = assistant.chat(query.messages)

        rag_manager = RAGManager()
        rag_manager.vector_db.add_documents(documents=[doc])
        # print(rag_manager.vector_db.similarity_search(query.messages[-1], k=1))
        try:
            # 使用正则表达式提取json数组
            match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
            if match:
                json_str = match.group(1)
                parsed = json.loads(json_str.strip())
                return AssistantChatResponse(data=parsed)
            else:
                # 没有匹配到json数组，尝试直接解析
                parsed = json.loads(response)
                return AssistantChatResponse(data=parsed)
        except Exception:
            # 不是标准JSON，原样返回
            return AssistantChatResponse(data=response)
    except Exception as e:
        print(f"调用Assistant时发生错误: {e}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")


@app.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(..., description="支持的文件类型: .txt, .pdf, .docx, .md, .xlsx, .csv"),
    doc_id: str = "default",
    knowledge_base: str = "default"
):
    """
    上传文档（Word、Excel、PDF、TXT、Markdown、CSV），并添加到RAG知识库。
    - 支持的文件类型: .txt, .pdf, .docx, .md, .xlsx, .csv
    - 参数: doc_id（文档ID，可选），knowledge_base（知识库名，可选）
    """
    rag_manager = RAGManager()
    # 保存上传的文件到临时路径
    try:
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in [".txt", ".pdf", ".docx", ".md", ".xlsx", ".csv"]:
            return DocumentUploadResponse(success=False, message=f"不支持的文件类型: {file_ext}")
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        rag_manager.add_document(temp_path, doc_id=doc_id, knowledge_base=knowledge_base)
        os.remove(temp_path)
        return DocumentUploadResponse(success=True, message="文档上传并添加成功")
    except Exception as e:
        return DocumentUploadResponse(success=False, message=f"上传失败: {str(e)}")


# 挂载静态文件到根路径
app.mount("/", StaticFiles(directory="web/build", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

