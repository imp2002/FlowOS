# 配置说明文档

## 目录结构

```
config/
├── .env               # 环境变量文件（不提交到版本控制）
├── .env.example       # 环境变量示例文件
├── model.yaml         # 模型配置文件
├── rag.yaml           # RAG（检索增强生成）配置文件
├── assistant.yaml     # 助手配置文件
└── config_manager.py  # 配置管理器
```

## 环境变量配置

项目使用 `.env` 文件存储敏感配置信息。请复制 `.env.example` 文件并重命名为 `.env`，然后填入相应的 API 密钥，加载yaml文件时，会自动注入这些变量。