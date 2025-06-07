import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from utils.vector_store import query_by_location_and_purpose
from utils.vector_store import query_by_purpose_only
from utils.flow_steps import FLOW_STEPS
from services.models import CurrentSessionDBRequest, CompletedSessionDBRequest

# .env 파일 로드
load_dotenv()

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# 현재 위치에서 해야 할 일 안내
def run_current_action_chain(
    query: str,
    location: str,
    purpose: str,
    current_session: CurrentSessionDBRequest,
    completed_session: CompletedSessionDBRequest
) -> str:
    enriched_query = f"[{purpose} 흐름] {query}"

    # 벡터 DB 문서 검색
    results = query_by_location_and_purpose(enriched_query, location, purpose)
    ui_context = "\n".join(results["documents"][0]) if results["documents"] else "관련 문서를 찾을 수 없습니다."

    # 현재 사용자 로그 요약
    current_logs_text = "\n".join(
        f"- {log.page} / {log.event} / {log.text or log.target_id}" for log in current_session.logs
    ) or "현재 사용자의 로그가 없습니다."

    # 성공 사용자 로그 요약 (최대 3개까지만 샘플링)
    completed_logs_summaries = []
    for i, user_logs in enumerate(completed_session.logs[:3]):
        summary = "\n".join(
            f"  - {log.page} / {log.event} / {log.text or log.target_id}" for log in user_logs
        )
        completed_logs_summaries.append(f"[사용자{i+1}]\n{summary}")

    completed_logs_text = "\n\n".join(completed_logs_summaries) if completed_logs_summaries else "성공한 사용자의 로그가 없습니다."

    # 프롬프트 구성
    system_prompt = """
    너는 기차표 예매 서비스에서 사용자가 지금 위치한 페이지에 맞춰 안내를 해주는 도우미야.

    [반드시 지켜야하는 규칙]
    1. 현재 페이지(예: SelectSeat)에서 **사용자가 해야 할 행동만** 설명해. 
    - 그 이후에 해야 할 일(예: 결제, 개인정보 입력 등)은 말하지 마.
    2. 설명은 다음처럼 구성해:
    - 첫 문장은 "현재 페이지는 ~하는 페이지입니다."처럼 **페이지 목적만 한국어로** 설명해.
    - 최대한 **구체적으로**, **단계별로**, **쉬운 표현**으로.
    - 단계별 안내는 **'첫째', '둘째', '셋째'**처럼 한국어 순서를 써.
    3. 참고 문서를 직접 언급하지 마.
    4. 무조건 존댓말로 말하고, 마지막 문장은 질문이 아닌 평서문으로 끝나야 해.

    먼저, 사용자가 어떤 페이지에 있는지 확인하고,
    그 페이지에서 어떤 UI 요소를 조작해야 하는지를 파악해.

    그 다음, 사용자가 해야 할 일을 **단계별**로 서술해.
    중요하거나 실수할 수 있는 부분은 **친절하게 강조**해 줘.
    """

    user_prompt = f"""
    [사용자 질문]
    {query}

    [현재 페이지의 UI 구조 정보]
    {ui_context}

    [현재 사용자의 행동 흐름 로그]
    {current_logs_text}

    [같은 목적을 가진 성공 사용자들의 행동 흐름 로그 요약]
    {completed_logs_text}
    """

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        temperature=0,
        max_tokens=150,
        messages=[
            {"role": "system", "content": system_prompt.strip()},
            {"role": "user", "content": user_prompt.strip()}
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