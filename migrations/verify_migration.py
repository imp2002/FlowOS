#!/usr/bin/env python3
"""
验证数据库迁移是否成功的脚本
"""

from sqlalchemy import text
from config.database import engine

def verify_migration():
    """验证新字段是否已经添加到数据库中"""
    try:
        with engine.connect() as connection:
            # 检查表结构
            result = connection.execute(text("""
                DESCRIBE chat_records
            """))
            
            columns = [row[0] for row in result.fetchall()]
            print("当前 chat_records 表的字段:")
            for column in columns:
                print(f"  - {column}")
            
            # 检查新字段是否存在
            if 'is_judged' in columns and 'is_used' in columns:
                print("\n✅ 迁移成功！新字段已添加:")
                print("  - is_judged: 是否已经被判断过")
                print("  - is_used: 是否被使用")
                
                # 检查现有数据的默认值
                result = connection.execute(text("""
                    SELECT COUNT(*) as total,
                           SUM(CASE WHEN is_judged IS NULL THEN 1 ELSE 0 END) as null_judged,
                           SUM(CASE WHEN is_used IS NULL THEN 1 ELSE 0 END) as null_used
                    FROM chat_records
                """))
                
                row = result.fetchone()
                print(f"\n📊 数据统计:")
                print(f"  总记录数: {row[0]}")
                print(f"  is_judged 为 NULL 的记录: {row[1]}")
                print(f"  is_used 为 NULL 的记录: {row[2]}")
                
            else:
                print("\n❌ 迁移失败！新字段未找到")
                missing_fields = []
                if 'is_judged' not in columns:
                    missing_fields.append('is_judged')
                if 'is_used' not in columns:
                    missing_fields.append('is_used')
                print(f"  缺失字段: {', '.join(missing_fields)}")
                
    except Exception as e:
        print(f"❌ 验证过程中出现错误: {e}")

if __name__ == "__main__":
    verify_migration() 