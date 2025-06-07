import os
import chromadb
from openai import OpenAI
from dotenv import load_dotenv
from enum import Enum
from typing import Union

# 환경 변수 로드
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 디스크 기반 저장소 경로 설정
PERSIST_DIR = "chroma_data"

# Chroma 클라이언트: persist 모드로 설정
chroma_client = chromadb.PersistentClient(path=PERSIST_DIR)

# 문서 저장용 컬렉션
collection = chroma_client.get_or_create_collection(name="page_ui_chunks")

# 저장 함수에 persist 추가
def add_document_to_vector_store(doc_id: str, text: str, metadata: dict):
    embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=[text]
    ).data[0].embedding

    # 메타데이터 강화
    enriched_metadata = {
        "doc_id": doc_id,
        "location": metadata.get("location"),
        "purpose": metadata.get("purpose", ""),
        "pageTitle": metadata.get("pageTitle", ""),
        "tagCount": metadata.get("tagCount", 0)
    }

    collection.add(
        ids=[doc_id],
        documents=[text],
        embeddings=[embedding],
        metadatas=[enriched_metadata]
    )

# 벡터 DB에서 관련 문서를 찾는 핵심 동작
def query_by_location_and_purpose(query: str, location: str, purpose: Union[str, Enum], top_k: int = 3):
    # Step 1. query 임베딩 생성
    embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=[query]
    ).data[0].embedding

    # Step 2. location 기준으로만 필터링
    filters = {
        "location": {"$eq": location}
    }

    raw_results = collection.query(
        query_embeddings=[embedding],
        n_results=top_k * 3,  # 충분히 많이 받아서 후처리
        where=filters
    )

    # Step 3. purpose 기준으로 후처리
    target_purpose = purpose.value if isinstance(purpose, Enum) else purpose

    filtered_results = {
        "documents": [],
        "metadatas": [],
        "ids": []
    }

    for doc_list, meta_list, id_list in zip(raw_results["documents"], raw_results["metadatas"], raw_results["ids"]):
        for doc, meta, doc_id in zip(doc_list, meta_list, id_list):
            if meta.get("purpose") == target_purpose:
                filtered_results["documents"].append(doc)
                filtered_results["metadatas"].append(meta)
                filtered_results["ids"].append(doc_id)


    # Step 4. top_k로 자르기
    for key in filtered_results:
        filtered_results[key] = filtered_results[key][:top_k]

    return filtered_results

def query_by_purpose_only(purpose: str, query: str, top_k: int = 3):
    embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=[query]
    ).data[0].embedding

    filters = {
        "purpose": {"$eq": purpose.value if isinstance(purpose, Enum) else purpose}
    }

    results = collection.query(
        query_embeddings=[embedding],
        n_results=top_k,
        where=filters
    )

    return results