import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from utils.vector_store import query_by_location_and_purpose
from utils.vector_store import query_by_purpose_only
from utils.flow_steps import FLOW_STEPS

# .env 파일 로드
load_dotenv()

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def run_current_action_chain(query: str, location: str, purpose: str) -> str:
    query = f"[{purpose} 흐름] {query}"

    # ✅ 인자 순서 맞춰서 호출
    results = query_by_location_and_purpose(query, location)

    context = "\n".join(results["documents"][0]) if results["documents"] else "관련 문서를 찾을 수 없습니다."

    prompt = f"""
[사용자 질문]
{query}

[참고 문서]
{context}

위 문서를 참고하여 사용자 질문에 존댓말을 사용하여 친절히 답변해줘.
참고로 사용자는 참고 문서를 볼 수 없어. 사용자에게 참고 문서 이야기를 하면 더 혼란을 주기 때문에, 참고 문서에 대해서는 말하지마.
또한 사용자가 위치한 페이지에서 할 수 있는 것만 해야 해.
그리고 너는 사용자가 한 질문에 대해서만 대답할 수 있어.
추가 도움을 유도하면 안돼.
"""

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        temperature=0.5,
        messages=[
            {"role": "system", "content": "너는 기차표 예매를 도와주는 안내 도우미야."},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content

# 남은 단계 추출
def get_remaining_steps(location: str, purpose: str) -> list[str]:
    # 여러 purpose가 올 수 있는 상황도 고려
    if purpose not in FLOW_STEPS:
        return []

    steps = FLOW_STEPS[purpose]
    if location not in steps:
        return []

    current_index = steps.index(location)
    return steps[current_index + 1:]

# LLM 호출
def run_remaining_steps_chain(location: str, purpose: str) -> str:
    steps = get_remaining_steps(location, purpose)
    if not steps:
        return "현재 위치를 기준으로 남은 단계를 찾을 수 없습니다."

    step_description = "\n".join([f"{i+1}. {step}" for i, step in enumerate(steps)])

    prompt = f"""
당신은 기차 예매 흐름을 안내하는 도우미입니다.
사용자는 현재 [{purpose}] 흐름 중, '{location}' 페이지에 있습니다.

이후 진행해야 할 단계는 다음과 같습니다:

{step_description}
문장을 숫자로 구분하지 말고 구어체로 대답하세요.
SelectSeats와 같은 페이지 이름을 언급하지 마세요. 사용자는 페이지 이름을 모르니, 포함하여 대답하지 마세요.
카드 등록과 같은 결제 정보 추가는 결제를 위한 단계이며, 카드 등록은 필요할 때만 하면 되는 선택적 단계입니다.
앞으로 남은 단계가 무엇을 의미하는지 존댓말로 간단히 순서대로 설명해주세요.
"""

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        temperature=0.5,
        messages=[
            {"role": "system", "content": "너는 기차표 예매를 도와주는 안내 도우미야."},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content


def run_flow_summary_chain(question: str, purpose: str) -> str:
    query = f"{purpose} 전체 흐름 설명"

    # 벡터 검색
    results = query_by_purpose_only(purpose, query)
    context = "\n".join(results["documents"][0]) if results["documents"] else "관련 문서를 찾을 수 없습니다."

     # 흐름 단계 가져오기
    steps = FLOW_STEPS.get(purpose, [])
    step_text = "\n".join([f"- {step}" for step in steps])

    prompt = f"""
[사용자 질문]
{question}

[참고 문서]
{f"[참고 문서]\n{context}" if context else ""}

아래는 '{purpose}' 흐름에 포함된 주요 단계들입니다:
{step_text}

반드시 존댓말로 설명하세요.
문장을 숫자로 구분하지 말고 구어체로 대답하세요.
단계 이름은 그대로 노출하지 말고 자연스럽게 설명해주세요.
"""

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        temperature=0.5,
        messages=[
            {"role": "system", "content": "너는 기차표 예매 시스템을 잘 아는 도우미야."},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content