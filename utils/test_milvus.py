#!/usr/bin/env python3
"""
测试Milvus连接和基本功能
"""

import os
from rag.rag_manager import RAGManager

def test_milvus_connection():
    """测试Milvus连接"""
    try:
        print("正在初始化RAGManager...")
        rag_manager = RAGManager()
        print("✅ RAGManager初始化成功")
        
        # 测试获取集合名称
        collection_name = rag_manager.get_collection_name()
        print(f"✅ 集合名称: {collection_name}")
        
        # 测试获取文档数量
        count = rag_manager.get_chunk_count()
        print(f"✅ 当前文档数量: {count}")
        
        return True
    except Exception as e:
        print(f"❌ 连接失败: {str(e)}")
        return False

def test_basic_operations():
    """测试基本操作"""
    try:
        rag_manager = RAGManager()
        
        # 测试清空数据库
        print("正在清空数据库...")
        success = rag_manager.clear_database()
        if success:
            print("✅ 数据库清空成功")
        else:
            print("❌ 数据库清空失败")
            return False
        
        # # 测试添加文档
        # print("正在测试添加文档...")
        # # 创建一个简单的测试文档
        # from langchain_core.documents import Document
        
        # test_doc = Document(
        #     page_content="这是一个测试文档，用于验证Milvus功能。",
        #     metadata={"source": "test.txt", "knowledge_base": "default"}
        # )
        
        # # 添加文档到向量存储
        # doc_ids = ["test-doc-1"]
        # rag_manager.vector_db.add_documents(documents=[test_doc], ids=doc_ids)
        # print("✅ 文档添加成功")
        
        # # 测试搜索
        # print("正在测试搜索功能...")
        # results = rag_manager.base_search("测试文档", k=1)
        # if results:
        #     print(f"✅ 搜索成功，找到 {len(results)} 个结果")
        #     print(f"搜索结果: {results[0]['content']}")
        # else:
        #     print("❌ 搜索失败")
        #     return False
        
        return True
    except Exception as e:
        print(f"❌ 基本操作测试失败: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== Milvus连接测试 ===")
    
    # 测试连接
    if test_milvus_connection():
        print("\n=== 基本功能测试 ===")
        if test_basic_operations():
            print("\n🎉 所有测试通过！Milvus配置成功。")
        else:
            print("\n❌ 基本功能测试失败。")
    else:
        print("\n❌ 连接测试失败，请检查配置。") 