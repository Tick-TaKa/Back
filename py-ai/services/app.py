from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from services.query_chain_service import query_current_action_chain
from services.query_chain_service import query_remaining_steps_chain
from services.query_chain_service import query_flow_summary_chain
import os

# py-ai 폴더에서
# .\venv\Scripts\activate
# python -m services.app

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

# 이 페이지에서는 무엇을 해야 해?
@app.post("/current_action")
def current_action_question(request: AskRequest):
    question = request.question
    location = request.log.get("location")  # 프론트 로그 데이터에서 page 추출
    purpose = request.log.get("purpose")  # 프론트 로그 데이터에서 purpose 추출

    answer = query_current_action_chain(question, location, purpose)
    return {"question": question, "answer": answer}

# 앞으로 어떤 단계가 남아있어?
@app.post("/remaining_steps")
def remaining_steps_route(request: AskRequest):
    location = request.log.get("location")
    purpose = request.log.get("purpose")
    answer = query_remaining_steps_chain(location, purpose)
    return {"question": request.question, "answer": answer}

# 전체 과정을 설명해줘
@app.post("/flow_summary")
def flow_summary_question(request: AskRequest):
    purpose = request.log.get("purpose")
    question = request.question

    answer = query_flow_summary_chain(question, purpose)
    return {"question": question, "answer": answer}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.app:app", host="0.0.0.0", port=8000, reload=True)

