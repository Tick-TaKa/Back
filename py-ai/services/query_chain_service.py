# # DB와 결합된 체인
# def query_with_db(input_text: str):
#     db_data = get_data_from_db()  # db/queries.py
#     result = chain.invoke({"input": f"{db_data} 기반으로 {input_text}"})
#     return result
# # services/query_chain_service.py

# from chains.chain import create_simple_chain
# # DB와 결합된 체인
# def query_with_db(input_text: str):
#     # NestJS API 엔드포인트 URL (예시, 실제 URL은 팀의 설정에 따라 달라짐)
#     nest_api_url = "http://localhost:3000/api/db-data"
#     try:
#         response = requests.get(nest_api_url)
#         response.raise_for_status()
#         db_data = response.json().get("data", "기본 데이터")
#     except Exception as e:
#         print(f"NestJS API 호출 오류: {e}")
#         db_data = "기본 데이터"
    
#     chain = create_simple_chain()
#     result = chain.run(question=f"{db_data} 기반으로 {input_text}")
#     return result


# def query_chain(question: str) -> str:
#     chain = create_simple_chain()
#     answer = chain.run(question=question)
#     return answer

# from py_ai.chains.chain import load_prompt_data, call_openai_for_current_action
from chains.chain import load_prompt_data, call_openai_for_current_action

def run_current_action_chain():
    data = load_prompt_data("py-ai/json/current_action_prompt.json")
    response = call_openai_for_current_action(data)
    return response
