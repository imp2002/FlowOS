# 如何运行

1. 安装依赖

```bash
# 安装 uv
pip install uv
# 安装依赖
uv sync
```

2. 运行

```bash
# 在config下按照 .env.example 的格式创建 .env 文件
# 测试 RAG，往知识库中录数据和检索
python rag/rag_manager.py
# 测试 chat，使用 RAG 模式
python chat/assistant.py
```