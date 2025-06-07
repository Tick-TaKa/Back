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
    1. 현재 페이지(예: SelectSeat)에서 **사용자가 할 수 있는 행동만** 설명해. 
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
        messages=[
            {"role": "system", "content": system_prompt.strip()},
            {"role": "user", "content": user_prompt.strip()}
        ]
    )

    return response.choices[0].message.content


# 남은 단계 추출
def run_remaining_steps_chain(
    location: str,
    purpose: str,
    current_session: CurrentSessionDBRequest,
    completed_session: CompletedSessionDBRequest
) -> str:
    steps = get_remaining_steps(location, purpose)
    if not steps:
        return "현재 위치를 기준으로 남은 단계를 찾을 수 없습니다."

    step_text = "\n".join([f"- {step}" for step in steps])

    # 현재 사용자 로그 요약
    current_logs_text = "\n".join(
        f"- {log.page} / {log.event} / {log.text or log.target_id}" for log in current_session.logs
    ) or "현재 사용자의 로그가 없습니다."

    # 성공 사용자 로그 요약 (최대 3명)
    completed_logs_summaries = []
    for i, user_logs in enumerate(completed_session.logs[:3]):
        summary = "\n".join(
            f"  - {log.page} / {log.event} / {log.text or log.target_id}" for log in user_logs
        )
        completed_logs_summaries.append(f"[사용자{i+1}]\n{summary}")

    completed_logs_text = "\n\n".join(completed_logs_summaries) if completed_logs_summaries else "성공한 사용자의 로그가 없습니다."

    system_prompt = """
    너는 기차표 예매 서비스에서 사용자에게 앞으로 어떤 단계를 진행해야 하는지 안내하는 도우미야.

    지금 사용자는 예매 흐름 중 특정 페이지에 있으며, 이 페이지에서 일부 조작을 완료한 상태야.
    이제 **앞으로 어떤 단계를 진행해야 하는지** 친절하고 구체적으로 안내해줘.

    [반드시 지켜야 하는 설명 규칙]

    1. **페이지 이름은 말하지 마.**
    - 사용자는 페이지명을 모르기 때문에 "Payment 페이지" 같은 표현은 절대 사용하지 마.
    - 대신, "결제를 진행하는 페이지입니다."처럼 **페이지 목적**을 자연스럽게 설명해.

    2. **현재 사용자가 이미 한 행동은 생략해.**
    - 사용자의 로그를 보고 어떤 조작은 이미 완료했는지 판단해.
    - 예: 개인정보 동의를 이미 했으면 "개인정보 동의를 하세요"라는 말은 하지 마.

    3. **앞으로 해야 할 일만 구체적으로 설명해.**
    - 어떤 버튼을 눌러야 하는지, 어떤 선택을 해야 하는지까지 명확하게 말해.
    - 예: "‘결제하기’ 버튼을 눌러주세요", "결제 수단 중 하나를 선택하세요"

    4. **단계 안내는 '첫째', '둘째', '셋째' 같은 한국어 순서 표현을 사용해.**

    5. **성공한 사용자들의 로그도 참고해, 일반적으로 어떤 흐름으로 진행하는지 알려줘.**
    - 만약 현재 사용자가 비정상적인 경로로 접근했거나, 빠뜨린 단계가 있다면 부드럽게 유도해줘.

    6. **말투는 무조건 존댓말.**
    - 설명은 항상 **명확한 평서문**으로 끝내고,
    - 마지막에는 "감사합니다", "이용해주셔서 감사합니다"처럼 **중립적이고 공손한 인사말**로 마무리해.

    너의 목적은 **사용자가 지금 어디쯤 와 있는지 이해하고, 다음 단계로 정확히 안내해주는 것**이야.

    """

    user_prompt = f"""
    [현재 페이지 이후 남은 단계들]
    {step_text}

    [현재 사용자의 행동 로그]
    {current_logs_text}

    [과거 성공 사용자들의 행동 로그 요약]
    {completed_logs_text}
    """

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        temperature=0,
        messages=[
            {"role": "system", "content": system_prompt.strip()},
            {"role": "user", "content": user_prompt.strip()}
        ]
    )

    return response.choices[0].message.content



def run_flow_summary_chain(
    question: str,
    purpose: str,
    current_session: CurrentSessionDBRequest,
    completed_session: CompletedSessionDBRequest
) -> str:
    # 벡터 검색 (문서 context)
    query = f"{purpose} 전체 흐름 설명"
    results = query_by_purpose_only(purpose, query)
    context = "\n".join(results["documents"][0]) if results["documents"] else "관련 문서를 찾을 수 없습니다."

    # 흐름 단계 목록
    steps = FLOW_STEPS.get(purpose, [])
    step_text = "\n".join([f"- {step}" for step in steps])

    # 로그 및 문서 내 페이지명 전처리 함수
    def clean_page_names(text: str) -> str:
        replacements = {
            "AddCard_PAGE": "카드를 등록하는 단계",
            "BookingDetail_PAGE": "예매 상세 정보를 확인하는 단계",
            "End_PAGE": "예매를 마무리하는 단계",
            "History_PAGE": "예매 내역을 확인하는 단계",
            "HistoryNone_PAGE": "예매 내역이 없는 것을 안내하는 단계",
            "HistoryTicket_PAGE": "예매된 기차표를 확인하는 단계",
            "Payment_PAGE": "결제를 진행하는 단계",
            "PhoneNumber_PAGE": "전화번호를 입력하는 단계",
            "RefundSuccess_PAGE": "환불 완료를 안내받는 단계",
            "Reservation_PAGE": "출발역, 도착역, 날짜, 인원을 설정하는 단계",
            "SelectSeat_PAGE": "좌석을 선택하는 단계",
            "Start_PAGE": "예매하기 또는 조회하기를 선택해 서비스 사용을 시작하는 단계",
            "StationSelector_PAGE": "기차역을 선택하는 단계",
            "TrainList_PAGE": "기차를 선택하는 단계"
        }

        for k, v in replacements.items():
            text = text.replace(k, v)
        return text

    # 로그 텍스트 구성
    current_logs_text = "\n".join(
        f"- {log.page} / {log.event} / {log.text or log.target_id}" for log in current_session.logs
    ) or "현재 사용자의 로그가 없습니다."

    completed_logs_summaries = []
    for i, user_logs in enumerate(completed_session.logs[:3]):
        summary = "\n".join(
            f"  - {log.page} / {log.event} / {log.text or log.target_id}" for log in user_logs
        )
        completed_logs_summaries.append(f"[사용자{i+1}]\n{summary}")

    completed_logs_text = "\n\n".join(completed_logs_summaries) if completed_logs_summaries else "성공한 사용자의 로그가 없습니다."

    # 전처리 적용
    context = clean_page_names(context)
    current_logs_text = clean_page_names(current_logs_text)
    completed_logs_text = clean_page_names(completed_logs_text)

    # 시스템 프롬프트
    system_prompt = """
너는 기차표 예매 서비스에서 사용자의 목적에 맞춰 전체 과정을 자연스럽게 설명하는 친절한 도우미야.

사용자는 다음 중 하나의 목적을 가지고 있어:
- 예매 (reservation)
- 조회 (history)
- 환불 (refund)

이 목적에 따라 처음부터 끝까지 어떤 단계를 거치는지 설명해줘.
같은 정보를 반복하지 말고, 자연스럽게 이어서 말해줘.

[설명 규칙]

1. 절대 페이지 이름을 말하지 마.
- "History 페이지", "Payment 단계" 같은 표현은 단 한 번도 사용하면 안 돼.
- 참고 문서에 있는 "History_PAGE" 등의 표현도 절대 그대로 쓰지 마.
- "페이지"라는 단어 자체도 피하고, “예매 내역을 확인하는 단계입니다”처럼 기능 중심으로 말해.

2. 각 단계를 자연스럽게 이어줘.
- ‘먼저’, ‘그 다음’, ‘그리고’, ‘마지막으로’ 같은 연결어를 사용해.

3. 사용자가 하는 구체적인 행동 중심으로 말해.
- 버튼 클릭, 정보 입력, 항목 선택 같은 실제 동작을 설명해줘.

4. 설명은 목적에 따라 다르게 구성해.
- reservation: 예매 시작부터 결제 완료까지
- history/refund: 예매 내역 조회 → 상세 확인 → 환불까지

5. 성공 사용자 로그와 문서를 참고하되, 단어를 그대로 쓰지 말고 자연스럽게 풀어서 설명해.
- 필요한 부분은 요약해.
- 예시: "전화번호를 입력하기 위해 0, 01, 010과 같이 순차적으로 클릭하여 전화번호를 입력합니다."말고 대신, "전화번호를 입력합니다."와 같이 요약할 것


6. 무조건 존댓말을 사용하고, 마지막 문장은 반드시 평서문으로 끝내.

7. 마지막엔 공손한 인사말로 마무리해.
- 설명은 항상 **명확한 평서문**으로 끝내고,
- 마지막에는 "감사합니다", "이용해주셔서 감사합니다"처럼 **중립적이고 공손한 인사말**로 마무리해.

""".strip()

    # 유저 프롬프트
    user_prompt = f"""
[사용자 질문]
{question}

[현재 사용자 목적]
{purpose}

[참고 문서]
{context}

[흐름 단계 목록]
{step_text}

[현재 사용자 로그]
{current_logs_text}

[성공 사용자 로그 요약]
{completed_logs_text}
""".strip()

    # LLM 호출
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        temperature=0.5,
        max_tokens=400,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )

    return response.choices[0].message.content
