# services/app.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from io import BytesIO
from .query_chain_service import query_chain
import os
from dotenv import load_dotenv
load_dotenv()  # .env 파일에서 OPENAI_API_KEY 불러옴

app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시에는 프론트 도메인으로 제한할 것
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 간단한 메모리 캐시 (실제 운영 환경에서는 만료 처리 등 추가 고려 필요)
audio_cache = {}

class AskRequest(BaseModel):
    question: str
    log: dict  # log = { name, timestamp, entries }

def format_log_for_prompt(log: dict) -> str:
    lines = [f"[{entry['timestamp']}] {entry['page']} - {entry['action']} : {entry['value']}" for entry in log.get("entries", [])]
    return "\n".join(lines)

@app.post("/ask")
# def ask_question(q: str):
#     answer = query_chain(q)
#     return {"question": q, "answer": answer}
def ask_question(request: AskRequest):
    question = request.question
    log = request.log

    # 로그를 프롬프트에 포함해서 LLM에 넘기기
    log_text = format_log_for_prompt(log)
    log_type = log.get("name")

    if log_type == "reservation":
        prompt = f"""[기차 예매 과정 중인 사용자입니다]
    
    사용자 질문: {question}

    이전에 사용자가 했던 행동 기록:
    {log_text}

    이 정보를 바탕으로 답변해줘.
    """
    else:
        prompt = f"""사용자 질문: {question}

사용자 활동 로그:
{log_text}

이 정보를 바탕으로 답변해줘."""

    answer = query_chain(prompt)
    return {"question": question, "answer": answer}

# 로컬에서 실행할 경우
if __name__ == "__main__":
    # 8000번 포트: FastAPI 혹은 uvicorn server가 클라이언트의 http 요청을 수신하기 위해 열어둔 포트
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# py-ai 위치에서 python -m services.app 실행