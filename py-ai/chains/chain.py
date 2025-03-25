from langchain.chat_models import ChatOpenAI
from langchain.schema.output_parser import StrOutputParser

llm = ChatOpenAI(temperature=0)
chain = llm.with_output_parser(StrOutputParser())