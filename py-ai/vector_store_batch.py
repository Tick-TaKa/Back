import os
from utils.vector_store import add_document_to_vector_store, chroma_client

PARSED_DIR = "parsed_docs"

def extract_metadata_from_file_content(text: str, filename: str):
    # [페이지: ...] 줄에서 page 추출
    page = filename.replace(".txt", "")

    # [목적: ...] 줄에서 purpose 추출
    purpose_line = next((line for line in text.splitlines() if line.startswith("[목적:")), None)
    if purpose_line:
        purpose = purpose_line.replace("[목적:", "").replace("]", "").strip()
    else:
        purpose = "reservation"  # 기본값
    return page, purpose

def batch_store_all_parsed_docs():
    for filename in os.listdir(PARSED_DIR):
        if filename.endswith(".txt"):
            file_path = os.path.join(PARSED_DIR, filename)
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()

            page, purpose = extract_metadata_from_file_content(text, filename)
            doc_id = f"{page}__{purpose.replace(', ', '_')}"

            add_document_to_vector_store(
                doc_id=doc_id,
                text=text,
                metadata={"page": page, "purpose": purpose}
            )

            print(f"✅ 저장 완료: {doc_id} ({purpose})")

if __name__ == "__main__":
    batch_store_all_parsed_docs()
