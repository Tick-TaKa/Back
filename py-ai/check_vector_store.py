import chromadb

# ✅ 동일한 디스크 경로를 명시
PERSIST_DIR = "chroma_data"

# chroma_client = chromadb.Client(
#     chromadb.config.Settings(persist_directory=PERSIST_DIR)
# )
chroma_client = chromadb.PersistentClient(path=PERSIST_DIR)

collection = chroma_client.get_or_create_collection(name="page_ui_chunks")

def check_stored_documents():
    docs = collection.peek(limit=100)  # ✅ 기본 peek 수 제한 해제
    print(f"✅ 저장된 문서 수: {len(docs['documents'])}")
    for i, (doc, meta) in enumerate(zip(docs['documents'], docs['metadatas'])):
        print(f"{i+1}. {meta['page']} ({meta['purpose']})")

check_stored_documents()
