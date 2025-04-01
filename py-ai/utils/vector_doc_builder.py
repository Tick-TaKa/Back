def build_text_chunk_from_ui_doc(doc: dict) -> str:
    page = doc.get("page", "UnknownPage")
    purpose = doc.get("purpose", "unknown")
    elements = doc.get("elements", [])

    # 이런 식으로 LLM이 이해할 수 있는 형태로 바꿔줘야,
    # 나중에 RAG context로 넣어줄 수 있음

    lines = [
        f"[페이지: {page}]",
        f"[목적: {purpose}]",
        "",
        f"이 페이지는 '{purpose}' 과정 중 '{page}' 화면입니다.",
        "",
        "다음과 같은 UI 요소들이 있습니다:"
    ]

    for el in elements:
        el_type = el["type"]
        text = el.get("text", "").strip() or "(텍스트 없음)"
        el_id = el.get("id", "")
        el_class = " ".join(el.get("class", [])) if el.get("class") else ""
        lines.append(f"- {el_type}: '{text}' (id: {el_id}, class: {el_class})")

    return "\n".join(lines)