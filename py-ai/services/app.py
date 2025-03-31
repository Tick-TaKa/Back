# py-ai 위치에서 .\venv\Scripts\activate 후 python -m services.app 실행
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .query_chain_service import run_current_action_chain  # ✅ 상대 경로 그대로 OK
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    question: str
    log: dict

def format_log_for_prompt(log: dict) -> str:
    lines = [f"[{entry['timestamp']}] {entry['page']} - {entry['action']} : {entry['value']}" for entry in log.get("entries", [])]
    return "\n".join(lines)

@app.post("/ask")
def ask_question(request: AskRequest):
    question = request.question
    log = request.log
    log_text = format_log_for_prompt(log)
    log_type = log.get("name")

    if log_type == "reservation":
        prompt = f"""[기차 예매 과정 중인 사용자입니다]

사용자 질문: {question}

이전 사용자 행동:
{log_text}

이 정보를 바탕으로 답변해줘.
"""
    else:
        prompt = f"""사용자 질문: {question}

사용자 활동 로그:
{log_text}

이 정보를 바탕으로 답변해줘."""

    answer = run_current_action_chain()
    return {"question": question, "answer": answer}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.app:app", host="0.0.0.0", port=8000, reload=True)
