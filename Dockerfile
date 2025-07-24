FROM python:3.10-slim

# 安装 uv（如果没有则用 pip 安装依赖）
RUN pip install --no-cache-dir uv

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY pyproject.toml uv.lock ./

# 安装依赖
RUN uv sync

# 复制项目代码
COPY . .

# 设置环境变量（可选）
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 8000

# 启动 FastAPI 服务
CMD ["/bin/bash", "-c", "source .venv/bin/activate && uvicorn api:app --host 0.0.0.0 --port 8000"] 