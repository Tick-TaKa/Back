# chains/chain.py

from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.llms import OpenAI

# 간단한 체인 예시
def create_simple_chain():
    prompt = PromptTemplate(
        input_variables=["question"],
        template="Q: {question}\nA:"
    )
    
    llm = OpenAI(
        temperature=0,
        # 아래 파라미터는 openai.api_key를 직접 주거나,
        # 환경변수로 관리 가능 (기본적으로 openai 라이브러리가 OPENAI_API_KEY를 읽음)
    )
    
    chain = LLMChain(llm=llm, prompt=prompt)
    return chain