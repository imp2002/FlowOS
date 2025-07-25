import logging
import pandas as pd
from typing import Dict, Any, List, Optional
import os
from pathlib import Path
from langchain_chroma import Chroma
from langchain_community.embeddings import DashScopeEmbeddings
from utils.document_loader import DocumentProcessor
from utils.decorators import singleton
from config.config_manager import ConfigManager
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

@singleton
class RAGManager:
    def __init__(self):
        self.config_manager = ConfigManager()
        self.config = self.config_manager.get_rag_config()
        self.vector_db = None
        self.embedding = None
        self.document_processor = DocumentProcessor(
            chunk_size=self.config['chunk_size'],
            chunk_overlap=self.config['chunk_overlap']
        )
        self._initialize_embedding()
        self._initialize_vector_db()

        self.self_rag_flag = self.config['self_rag']
        self.llm = None
        if self.self_rag_flag:
            self._initialize_llm()
            # 定义优化搜索结果的提示模板
            self._define_verification_prompts()
        
    def _initialize_embedding(self):
        """Initialize the embedding model"""
        try:
            self.embedding = DashScopeEmbeddings(
                model=self.config['embeddings']['model'],
                dashscope_api_key=self.config['embeddings']['api_key'],
            )
        except Exception as e:
            print(f"Error initializing embeddings: {str(e)}")
            raise
    
    def _initialize_llm(self):
        """Initialize the embedding model"""
        try:
            self.llm = ChatOpenAI(
                api_key=self.config['feedback']['api_key'],
                model=self.config['feedback']['model_name'],
                temperature=self.config['feedback']['temperature'],
                base_url=self.config['feedback']["api_base"],
                max_tokens=self.config['feedback']["max_tokens"],
            )
        except Exception as e:
            print(f"Error initializing llm: {str(e)}")
            raise
    
    def _initialize_vector_db(self):
        """Initialize the vector database"""
        try:
            persist_directory = self.config['vector_db']['persist_directory']
            collection_name = self.config['vector_db']['collection_name']
            
            # Create directory if it doesn't exist
            chromadb_dir = os.path.expanduser(persist_directory)
            if not os.path.exists(chromadb_dir):
                os.makedirs(chromadb_dir)
                
            # Initialize Chroma
            self.vector_db = Chroma(
                persist_directory=chromadb_dir,
                embedding_function=self.embedding,
                collection_name=collection_name
            )
        except Exception as e:
            print(f"Error initializing vector database: {str(e)}")
            raise

    # TODO
    def add_document(self, file_path: str, doc_id: str, knowledge_base: str = "default") -> bool:
        """Process and add a document to the vector database with knowledge base metadata"""
        try:    
            # Check if file type is supported
            if not self.document_processor.is_supported_file_type(file_path, self.config['supported_file_types']):
                raise ValueError(f"Unsupported file type: {Path(file_path).suffix.lower()}")
            
            # Load document using the utility function
            documents = self.document_processor.load_document(file_path)
            
            # Chunk documents using the utility function
            chunked_documents = self.document_processor.chunk_documents(documents)
            
            # Add knowledge base info to metadata of each document
            for doc in chunked_documents:
                doc.metadata["knowledge_base"] = knowledge_base
            
            # Add to vector store
            self.vector_db.add_documents(documents=chunked_documents, ids=[doc_id * len(chunked_documents)])
            
            return True
        except Exception as e:
            print(f"Error adding document: {str(e)}")
            return False
    
    def delete_document(self, doc_ids: list[str]) -> bool:
        """Delete a document from the vector database by its ID"""
        try:
            self.vector_db.delete(ids=doc_ids)
            return True
        except Exception as e:
            print(f"Error deleting document: {str(e)}")
            return False
    
    def base_search(self, query: str, k: int = 3, knowledge_bases: Optional[List[str]] = "default") -> List[Dict[str, Any]]:
        """Search for relevant documents based on a query with optional knowledge base filtering"""
        try:
            # Set up where filter if knowledge_bases are specified
            where_filter = {"knowledge_base": {"$in": knowledge_bases}}
            results = self.vector_db.similarity_search_with_score(
                query=query,
                k=k,
                # filter=where_filter
            )
            
            # Format results
            formatted_results = []
            for doc, score in results:
                logging.debug(f"Document: {doc.page_content}, Score: {score}")
                formatted_results.append({
                    'content': doc.page_content,
                    'metadata': doc.metadata,
                    'score': score
                })
            
            return formatted_results
        except Exception as e:
            print(f"Error searching: {str(e)}")
            return []
    
    def get_relevant_context(self, query: str, k: int = 5, knowledge_bases: Optional[List[str]] = None) -> str:
        """Get relevant context as a concatenated string for use in prompts"""
        results = self.search(query, k, knowledge_bases)
        
        if not results:
            return "No relevant information found."
        
        context_pieces = []
        for i, result in enumerate(results):
            source = result.get('metadata', {}).get('source', 'Unknown')
            context_pieces.append(f"[Document {i+1}] (Source: {source})\n{result['content']}\n")
        
        return "\n\n".join(context_pieces)

    def clear_database(self) -> bool:
        """Clear all documents from the vector database"""
        try:
            self.vector_db.delete_collection()
            self._initialize_vector_db()
            return True
        except Exception as e:
            print(f"Error clearing database: {str(e)}")
            return False

    def get_chunk_count(self, knowledge_base: Optional[str] = None) -> int:
        """Get the total number of documents, optionally filtered by knowledge base"""
        try:
            if knowledge_base:
                results = self.vector_db._collection.get(
                    include=[],  # Don't need document content
                    where={"knowledge_base": knowledge_base}
                )
                return len(results['ids'])
            else:
                return self.vector_db._collection.count()
        except Exception as e:
            print(f"Error getting document count: {str(e)}")
            return 0

    def get_collection_name(self) -> str:
        """Get the current collection name"""
        return self.config['vector_db']['collection_name']

    def _define_verification_prompts(self):
        """定义用于优化搜索结果的验证提示"""
        # 文档相关性验证提示
        self.relevance_verification_prompt = PromptTemplate(
            input_variables=["query", "document_content"],
            template="""请判断以下文档内容是否与问题相关且信息准确。相关且准确回答Y，否则N。
            问题：{query}
            文档内容：{document_content}
            回答（Y/N）："""
        )

    def search(self, query: str, k: int = 3, knowledge_bases: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """搜索并优化结果（如果启用Self-RAG）"""
        # 获取原始搜索结果
        raw_results = self.base_search(query, k*2, knowledge_bases)  # 获取双倍结果用于后续过滤
        
        # 如果启用Self-RAG优化
        if self.self_rag_flag:
            return self._optimize_results(query, raw_results, k)
        return raw_results[:k]


    def _optimize_results(self, query: str, raw_results: List[Dict], final_k: int) -> List[Dict]:
        """使用Self-RAG机制优化搜索结果"""
        verified_results = []
        
        # 验证每个结果的相关性
        for result in raw_results:
            if self._verify_relevance(query, result['content']):
                print(f"验证通过: {result['content']}")
                verified_results.append(result)
            else:
                print(f"验证不通过: {result['content']}")
            # 如果已收集足够结果则提前停止
            if len(verified_results) >= final_k:
                break
        
        # 如果通过率不足，补充未验证结果
        if len(verified_results) < final_k:
            verified_results += [r for r in raw_results if r not in verified_results][:final_k-len(verified_results)]
        
        # 重新计算排序（可根据需要添加更复杂的排序逻辑）
        return sorted(
            verified_results[:final_k],
            key=lambda x: x['score'],
            reverse=True
        )

    def _verify_relevance(self, query: str, content: str) -> bool:
        chain = self.relevance_verification_prompt | self.llm
        try:
            response = chain.invoke({
                "query": query,
                "document_content": content
            }).content.strip().upper()
            return "Y" in response
        except Exception as e:
            print(f"验证失败: {str(e)}")
            return False  # 默认返回不相关

    def add_excel(self, file_path: str, doc_id: str, knowledge_base: str = "default") -> bool:
        """
        Efficiently parse a large Excel file by reading one sheet at a time and processing in row batches.
        This avoids using unstructured and works with openpyxl.
        """
        import pandas as pd
        from langchain_core.documents import Document
        try:
            xls = pd.ExcelFile(file_path)
            chunk_size = 1000  # 可根据内存调整
            all_documents = []
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet_name, engine='openpyxl', dtype=str)
                df = df.fillna('')
                n_rows = len(df)
                for start in range(0, n_rows, chunk_size):
                    end = min(start + chunk_size, n_rows)
                    chunk = df.iloc[start:end]
                    for idx, row in chunk.iterrows():
                        page_content = '\t'.join(map(str, row.values))
                        row_number = idx + 2  # header + 0-based
                        doc = Document(
                            page_content=page_content,
                            metadata={
                                'source': f"{Path(file_path).name}:{sheet_name}",
                                'sheet_name': sheet_name,
                                'row_number': row_number,
                                'knowledge_base': knowledge_base
                            }
                        )
                        all_documents.append(doc)
            if not all_documents:
                print("No documents found in the Excel file.")
                return True
            chunked_documents = self.document_processor.chunk_documents(all_documents)
            for doc in chunked_documents:
                if "knowledge_base" not in doc.metadata:
                    doc.metadata["knowledge_base"] = knowledge_base
            doc_ids = [f"{doc_id}-{idx}" for idx in range(len(chunked_documents))]
            self.vector_db.add_documents(documents=chunked_documents, ids=doc_ids)
            print(f"Successfully added {len(chunked_documents)} chunks from {file_path} to knowledge base '{knowledge_base}'.")
            return True
        except Exception as e:
            print(f"Error adding Excel document: {str(e)}")
            return False
    
    def add_json(self, file_path: str, doc_id: str, knowledge_base: str = "default") -> bool:
        import json
        from langchain_core.documents import Document
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            all_documents = []
            for idx, item in enumerate(data):
                # 你可以根据实际 JSON 结构自定义 page_content 和 metadata
                page_content = item.get("msg", "")
                name = item.get("name", "Unknown")
                page_content = f"{name}: {page_content}"
                doc = Document(
                    page_content=page_content,
                    metadata={
                        "source": f"{Path(file_path).name}:{name}",
                        "name": name,
                        "knowledge_base": knowledge_base
                    }
                )
                all_documents.append(doc)
            if not all_documents:
                print("No documents found in the JSON file.")
                return True
            chunked_documents = self.document_processor.chunk_documents(all_documents)
            for doc in chunked_documents:
                if "knowledge_base" not in doc.metadata:
                    doc.metadata["knowledge_base"] = knowledge_base
            doc_ids = [f"{doc_id}-{idx}" for idx in range(len(chunked_documents))]
            self.vector_db.add_documents(documents=all_documents, ids=doc_ids)
            print(f"Successfully added {len(chunked_documents)} chunks from {file_path} to knowledge base '{knowledge_base}'.")
            return True
        except Exception as e:
            print(f"Error adding JSON document: {str(e)}")
            return False

if __name__ == "__main__":
    rag_manager = RAGManager()
    rag_manager.clear_database()
    # 在 kb1 中添加文档
    rag_manager.add_document("C:\\Users\\imp\\Desktop\\er\\rag\\report.docx", doc_id="default", knowledge_base="default")
    print(f"测试在kb1中检索: {rag_manager.get_relevant_context('吉林大学', k=3, knowledge_bases=['default'])}")
    print(f"测试在kb2中检索应该输出无检索结果: {rag_manager.get_relevant_context('吉林大学', k=3, knowledge_bases=['kb2'])}")
