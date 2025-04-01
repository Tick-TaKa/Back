from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os

def load_prompt(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
    return "\n".join([
        f"[{entry['timestamp']}] {entry['page']} - {entry['action']} : {entry['value']}"
        for entry in log.get("entries", [])
    ])

def create_prompt(question: str, log: dict) -> str:
    log_text = format_log_for_prompt(log)
    log_type = log.get("name")

    if log_type == "reservation":
        prompt_template = load_prompt("prompts/system/reservation.txt")
        return prompt_template.format(question=question, log_text=log_text)
    else:
        return f"""사용자 질문: {question}

사용자 활동 로그:
{log_text}

이 정보를 바탕으로 답변해줘."""

@app.post("/current_action")
def ask_question(request: AskRequest):
    system_prompt = load_prompt("prompts/system/reservation.txt")
    prompt = create_prompt(request.question, request.log)

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
    )

    answer = response.choices[0].message.content
    return {"question": request.question, "answer": answer}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.app:app", host="0.0.0.0", port=8000, reload=True)
