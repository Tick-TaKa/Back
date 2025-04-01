import re
import json
from bs4 import BeautifulSoup
from pathlib import Path

def parse_tsx_file(tsx_path: str, page_name: str, purpose: str) -> dict:
    # 파일 읽기
    tsx_code = Path(tsx_path).read_text(encoding="utf-8")

    # JSX 부분 추출: return (...) 내부만 파싱
    jsx_match = re.search(r"return\s*\(([\s\S]*?)\);", tsx_code)
    if not jsx_match:
        raise ValueError("JSX return block not found.")

    jsx_code = jsx_match.group(1)

    # JSX 문법을 HTML처럼 바꾸기 (단순한 전처리)
    jsx_code = jsx_code.replace("className=", "class=")

    # HTML parser에 넣기
    soup = BeautifulSoup(jsx_code, "html.parser")

    # 관심 있는 태그 추출
    tags_to_extract = ["button", "input", "img", "h1", "h2", "h3", "h4", "p", "div", "span"]

    elements = []
    for tag in soup.find_all(tags_to_extract):
        text = tag.get_text(strip=True)
        if not text and tag.name == "img":
            text = tag.get("alt", "")  # 이미지의 alt 텍스트도 중요

        elements.append({
            "type": tag.name,
            "text": text,
            "id": tag.get("id", ""),
            "class": tag.get("class", [])
        })

    for line in tsx_code.splitlines():
        # 둘 중 하나의 형식을 인식
        if "[LLM]" in line:
            match = re.search(r"\[LLM\](.*?)(\*/|$)", line)
            if match:
                comment = match.group(1).strip()
                elements.append({
                    "type": "comment-hint",
                    "text": comment,
                    "id": "",
                    "class": []
                })
    return {
        "page": page_name,
        "purpose": purpose,
        "elements": elements
    }