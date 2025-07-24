import os
import base64
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv

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


@app.get("/")
def read_root():
    return {"message": "欢迎使用 Kimi Vision API Wrapper. 请访问 /docs 查看API文档。"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

