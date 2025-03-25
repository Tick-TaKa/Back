# FastAPI or LangServe 진입점
from fastapi import FastAPI
from langserve import add_routes
from chains.chain import chain  # 위에서 만든 체인

app = FastAPI()
add_routes(app, chain, path="/ai")  # /ai/invoke 로 호출 가능

#uvicorn app:app --port 8001 --reload(bash에서 실행)