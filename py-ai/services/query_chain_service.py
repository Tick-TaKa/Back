# DB와 결합된 체인
def query_with_db(input_text: str):
    db_data = get_data_from_db()  # db/queries.py
    result = chain.invoke({"input": f"{db_data} 기반으로 {input_text}"})
    return result
