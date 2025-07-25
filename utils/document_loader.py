import logging

from typing import List
from pathlib import Path
from langchain_community.document_loaders import (
    TextLoader, 
    PyPDFLoader, 
    UnstructuredMarkdownLoader,
    UnstructuredExcelLoader,
    UnstructuredWordDocumentLoader,
    UnstructuredCSVLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema.document import Document

class DocumentProcessor:
    def __init__(self, chunk_size: int, chunk_overlap: int):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def get_loader_for_file(self, file_path: str):
        """Get the appropriate document loader based on file extension"""
        file_extension = Path(file_path).suffix.lower()
        # TODO: 效果优化和支持更多类型
        if file_extension == '.txt':
            return TextLoader(file_path, encoding = 'UTF-8')
        elif file_extension == '.pdf':
            return PyPDFLoader(file_path)
        elif file_extension == '.docx':
            return UnstructuredWordDocumentLoader(file_path)
        elif file_extension == '.md':
            return UnstructuredMarkdownLoader(file_path)
        elif file_extension == '.xlsx':
            return UnstructuredExcelLoader(file_path)
        elif file_extension == '.csv':
            return UnstructuredCSVLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")

    def load_document(self, file_path: str) -> List[Document]:
        """Load a document using the appropriate loader"""
        loader = self.get_loader_for_file(file_path)
        logging.debug(f"Loading document from {file_path} using {loader.__class__.__name__} loader")
        documents = loader.load()
        
        # Extract metadata from file
        file_name = Path(file_path).name
        for doc in documents:
            doc.metadata['source'] = file_name
        return documents

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into chunks for better embedding and retrieval"""
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )
        return text_splitter.split_documents(documents)

    def is_supported_file_type(self, file_path: str, supported_extensions: List[str]) -> bool:
        """Check if the file type is supported"""
        file_extension = Path(file_path).suffix.lower()
        return file_extension in supported_extensions


if __name__ == "__main__":
    document_processor = DocumentProcessor(chunk_size=10, chunk_overlap=2)
    # documents = document_processor.load_document("test.txt")
    # documents = document_processor.load_document("test.docx")
    documents = document_processor.load_document("test.csv")

    print(documents)
    chunked_documents = document_processor.chunk_documents(documents)
    # print(chunked_documents)

