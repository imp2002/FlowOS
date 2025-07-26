## 简介
FlowOS 是一个通过AI智能引擎快速精准找到符合您需求的人才的平台  
Demo: [FLowOS](https://advx.up.railway.app)
## 如何运行
1. 安装依赖
安装 uv
```bash
pip install uv
```
安装依赖
```bash
uv sync
```

2. 运行
在config下按照 .env.example 的格式创建 .env 文件

测试 RAG，往知识库中录数据和检索
```bash
uv run rag/rag_manager.py
```
测试 chat，使用 RAG 模式
```bash
uv run chat/assistant.py
```
