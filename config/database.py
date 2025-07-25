import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# 数据库配置
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "er_chat")

# 构建数据库URL
DATABASE_URL = os.getenv("MYSQL_URL")
# DATABASE_URL = r"mysql+pymysql://root:XylfMjHOdWCwEIPoACeJKQAJyghcjAgo@switchyard.proxy.rlwy.net:53718/railway"

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    echo=False,  # 设置为True可以看到SQL语句
    pool_pre_ping=True,
    pool_recycle=3600,
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()

# 依赖函数，用于获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 