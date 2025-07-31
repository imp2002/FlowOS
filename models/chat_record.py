from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from config.database import Base


class ChatRecord(Base):
    """聊天记录模型"""
    __tablename__ = "chat_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(255), nullable=True, index=True, comment="会话ID")
    messages = Column(Text, nullable=False, comment="消息历史，JSON格式")
    is_judged = Column(Boolean, default=False, comment="是否已经被判断过")
    is_used = Column(Boolean, default=False, comment="是否被使用")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    def __repr__(self):
        return f"<ChatRecord(id={self.id}, session_id='{self.session_id}', is_judged={self.is_judged}, is_used={self.is_used}, created_at='{self.created_at}')>" 