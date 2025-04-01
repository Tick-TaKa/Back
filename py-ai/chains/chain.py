import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def load_prompt_data(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def call_openai_for_current_action(data):  # data는 JSON 형식
    system_prompt = (
        "당신은 기차표 예매 과정을 도와주는 스마트한 안내 도우미입니다.\n"
        "사용자가 현재 위치한 페이지의 UI 구조와 이벤트 로그를 기반으로 "
        "무엇을 해야 하는지 친절하고 구체적으로 안내해 주세요. "
        "가능하다면 클릭해야 할 버튼을 알려주고, 하이라이트 함수를 사용할 수도 있습니다."
    )

    ui_elements = data.get("ui_elements", [])
    ui_description = "\n".join([
        f"- {el['type'].capitalize()}: '{el['text']}' (`#{el['id']}`)"
        for el in ui_elements
    ])

    user_prompt = (
        f"사용자는 현재 '{data['current_page']}'에 있으며,\n"
        f"이전 페이지는 {', '.join(data['previous_pages'])}입니다.\n\n"
        f"이 페이지의 UI 요소는 다음과 같습니다:\n{ui_description}\n\n"
        f"무엇을 해야 할지 안내해주세요."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4-0613",
            temperature=0.5,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            functions=[
                {
                    "name": "highlightElement",
                    "description": "특정 HTML 요소를 강조해서 사용자에게 보여줍니다.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "selector": {
                                "type": "string",
                                "description": "강조할 요소의 CSS 선택자 (예: '#next-btn')"
                            }
                        },
                        "required": ["selector"]
                    }
                }
            ],
            function_call="auto"
        )

        return response

    except Exception as e:
        return {"error": str(e)}
