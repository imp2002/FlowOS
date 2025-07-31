# FlowOS 
>Whole Earth Flow! 🌍 连接真实的人，发现无限可能

### [Demo Site](https://advx.up.railway.app)


## 愿景
<table>
  <tr>
    <td align="center"><img src="images/flow1.png" alt="流程图1"></td>
        <td align="center"><img src="images/flow0.png" alt="流程图0"></td>
    <td align="center"><img src="images/flow2.png" alt="流程图2"></td>
  </tr>
</table>

>来自团队小伙伴的一流设计！Coding 是 vibe 的，设计是一流的！


我们相信一个人的价值不在于可以量化的外在标签——金钱、社会地位、奖项。**FlowOS** 致力于让人们更愿意展示自己真实的部分，建立基于真实连接的社交网络。

### 核心理念

- **真实连接**：超越表面的标签，发现人们内在的热情与价值
- **持续好奇**：热爱这个世界的人对世界永远保持好奇心
- **打破壁垒**：用先进的技术打破传统社交网络的封闭性
- **阶段匹配**：在不同人生阶段找到真正需要的人


### 使用的技术
- **LLM (大语言模型)**：深度理解用户需求与人才特征
- **RAG (检索增强生成)**：基于知识库的精准匹配与推荐
- **生成式推荐**：AI驱动的个性化人才推荐引擎
- **向量数据库**：高效的人才特征存储与检索

### 技术栈
- **后端**：Python + FastAPI
- **前端**：React + Vite + Tailwind CSS
- **向量数据库**：Milvus (Zilliz Cloud)
- **部署**：Docker + Railway

## 快速开始

### 环境要求
- Python 3.10
- Node.js 20


### 1. 安装依赖

安装 uv 包管理器：
```bash
pip install uv
uv sync
uv run api.py
```

### 2. 配置环境

#### Milvus 向量数据库配置

首先在 `config/` 目录下创建 `.env` 文件，参考 `.env.example` 格式：

```bash
cp config/.env.example config/.env
```

在 `config/rag.yaml` 中配置您的 Milvus API 密钥：
```yaml
vector_db:
  token: "your-actual-api-key-here"
```

#### 其他配置
- 在 `config/model.yaml` 中配置AI模型参数
- 在 `config/assistant.yaml` 中配置助手行为




#### 完整应用
```bash
uv run api.py
```

## 项目结构

```
FlowOS/
├── api.py                 # API 接口定义
├── main.py               # 应用入口
├── chat/                 # AI 聊天模块
│   ├── assistant.py      # 智能助手
│   └── model_manager.py  # 模型管理
├── rag/                  # RAG 检索模块
│   ├── rag_manager.py    # RAG 管理器
│   └── cleaned2.json     # 知识库数据
├── web/                  # 前端应用
│   ├── src/
│   │   ├── components/   # React 组件
│   │   ├── services/     # API 服务
│   │   └── utils/        # 工具函数
│   └── package.json
├── config/               # 配置文件
│   ├── rag.yaml         # RAG 配置
│   └── model.yaml       # 模型配置
├── models/               # 数据模型
├── utils/                # 工具模块
└── Dockerfile           # Docker 配置
```

### Docker 部署
```bash
# 构建 Docker 镜像
docker build -t flowos .

# 运行容器
docker run -p 8000:8000 flowos
```

>Vibe Coding, Vibe life!
