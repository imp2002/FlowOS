import json
from config.database import engine, Base
from models.chat_record import ChatRecord


def init_database():
    """初始化数据库，创建所有表"""
    try:
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        print("数据库表创建成功！")
    except Exception as e:
        print(f"数据库初始化失败: {e}")


if __name__ == "__main__":
    init_database() 