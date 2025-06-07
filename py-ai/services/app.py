from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
from services.query_chain_service import query_current_action_chain
from services.query_chain_service import query_remaining_steps_chain
from services.query_chain_service import query_flow_summary_chain
from services.tts_service import text_to_speech
from services.models import CurrentSessionDBRequest, CompletedSessionDBRequest

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

# FastAPI에 static 폴더 마운트
from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="static"), name="static")

# Pydantic 모델
class CurrentRequest(BaseModel):
    question: str
    current_session: CurrentSessionDBRequest # 이미 선언된 Pydantic 모델
    completed_session: CompletedSessionDBRequest # 이미 선언된 Pydantic 모델

# 이 페이지에서는 무엇을 해야 해?
@app.post("/current_action")
def current_action_question(request: CurrentRequest):
    question = request.question
    location = request.current_session.location
    purpose = request.current_session.purpose
    current_session = request.current_session
    completed_session = request.completed_session

    answer = query_current_action_chain(
        question, 
        location, 
        purpose,
        current_session,
        completed_session
    )
    audio_url = text_to_speech(answer)  # Clova Voice 호출
    return {"question": question, "answer": answer, "audio_url": audio_url}

# 앞으로 어떤 단계가 남아있어?
@app.post("/remaining_steps")
def remaining_steps_route(request: CurrentRequest):
    question = request.question
    location = request.current_session.location
    purpose = request.current_session.purpose
    current_session = request.current_session
    completed_session = request.completed_session

    answer = query_remaining_steps_chain(
        question,
        location,
        purpose,
        current_session,
        completed_session
    )

    audio_url = text_to_speech(answer)  # Clova Voice 호출
    return {"question": request.question, "answer": answer, "audio_url": audio_url}

# 전체 과정을 설명해줘
@app.post("/flow_summary")
def flow_summary_question(request: CurrentRequest):
    question = request.question
    purpose = request.current_session.purpose
    current_session = request.current_session
    completed_session = request.completed_session

    answer = query_flow_summary_chain(
        question,
        purpose,
        current_session,
        completed_session
    )
    audio_url = text_to_speech(answer)  # Clova Voice 호출
    return {"question": question, "answer": answer, "audio_url": audio_url}

# 오류 발생
@app.post("/default")
def default(request: CurrentRequest):
    question = request.question
    answer = "시스템 오류가 발생했습니다."
    audio_url = text_to_speech(answer)
    return {"question": question, "answer": answer, "audio_url": audio_url}

# 자진프 마감 기준 요청(이건 뭐지)
# @app.post("/ask_taka")
# def ask_taka_agent(request: CurrentRequest, db_results: DBRequest):
#     return

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.app:app", host="0.0.0.0", port=8000, reload=True)
