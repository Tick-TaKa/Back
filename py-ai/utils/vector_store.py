import os
import chromadb
from openai import OpenAI
from dotenv import load_dotenv

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

    collection.add(
        ids=[doc_id],
        documents=[text],
        embeddings=[embedding],
        metadatas=[metadata]
    )

# 벡터 DB에서 관련 문서를 찾는 핵심 동작
def query_by_location_and_purpose(query: str, location: str, top_k: int = 3):
    embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=[query]
    ).data[0].embedding

    # 필터는 location 하나만!
    filters = {
        "location": location
    }

    results = collection.query(
        query_embeddings=[embedding],
        n_results=top_k,
        where=filters
    )

    return results


def query_by_purpose_only(purpose: str, query: str, top_k: int = 3):
    embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=[query]
    ).data[0].embedding

    results = collection.query(
        query_embeddings=[embedding],
        n_results=top_k,
        where={
            "purpose": {
                "$in": [purpose]
            }
        }
    )

    return results