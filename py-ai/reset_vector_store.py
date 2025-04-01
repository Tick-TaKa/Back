import chromadb

PERSIST_DIR = "chroma_data"
chroma_client = chromadb.PersistentClient(path=PERSIST_DIR)
print(chroma_client.heartbeat())
chroma_client.get_or_create_collection("page_ui_chunks")
print("✅ 빈 컬렉션 재생성 완료!")