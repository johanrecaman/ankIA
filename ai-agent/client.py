from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from dotenv import load_dotenv
from typing import Annotated, List, BinaryIO
from typing_extensions import TypedDict

from io import BytesIO

from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.tools import tool
from langchain.chat_models import init_chat_model

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.prebuilt import create_react_agent

import PyPDF2

from datetime import datetime
import requests

load_dotenv()

def pdf_extract(pdf: BinaryIO) -> str:
    complete_text = ""

    reader = PyPDF2.PdfReader(pdf)
    for page in reader.pages:
        text = page.extract_text()
        if text:
            complete_text += text + "\n"
    return complete_text



@tool
def add_flash_card(title, question, answer):
    """cria título, pergunta e resposta para um flashcard e depois o adiciona no banco de dados"""
    url = "http://backend:3001/flashcards"
    data= {"title": title, "question": question, "answer": answer}
    try:
        response = requests.post(url, json=data, timeout=5)
        response.raise_for_status()
        return "Flashcard successfully created!"
    except requests.exceptions.RequestException as e:
        return f"Error creating flashcard: {str(e)}"

class State(TypedDict):
    messages: Annotated[list, add_messages]

llm = init_chat_model("google_genai:gemini-2.0-flash")
tools = [add_flash_card]

prompt = """
Você é um especialista em educação que cria flashcards de alta qualidade para estudo e memorização.

**Sua missão:**
1. Analise cuidadosamente o texto acadêmico fornecido
2. Identifique os conceitos, definições, fatos e relações mais importantes
3. Crie entre 5-15 flashcards (dependendo da densidade do conteúdo)
4. Para cada flashcard, use a ferramenta add_flash_card com:
   - title: "Flashcard [número] - [tópico principal]"
   - question: Pergunta clara e específica que teste o conhecimento
   - answer: Resposta completa mas concisa, incluindo contexto quando necessário

**Diretrizes para flashcards de qualidade:**
- Perguntas devem ser claras e sem ambiguidade
- Respostas devem ser precisas e completas
- Foque em conceitos fundamentais, não detalhes triviais
- Varie o tipo de pergunta (definições, exemplos, relações, aplicações)
- Mantenha consistência no nível de dificuldade

**Tipos de pergunta recomendados:**
- Definições: "O que é...?" / "Defina..."
- Exemplos: "Dê um exemplo de..." / "Cite casos onde..."
- Relações: "Qual a diferença entre X e Y?" / "Como X se relaciona com Y?"
- Aplicações: "Como aplicar...?" / "Quando usar...?"
- Causas/Efeitos: "Por que...?" / "Qual o resultado de...?"

**Processo:**
1. Leia todo o texto para entender o contexto geral
2. Identifique os tópicos principais e subtópicos
3. Para cada conceito importante, crie um flashcard
4. Use add_flash_card uma vez para cada flashcard
5. Conte quantos flashcards foram criados com sucesso
6. Forneça um resumo final: "Criados X flashcards com sucesso sobre [tópicos principais]"

**Importante:** 
- Processe TODOS os flashcards identificados
- NÃO pule nenhum flashcard
- Mantenha controle de sucessos e falhas
- Seja consistente na numeração dos flashcards

Comece sua análise agora!
"""

card_creator_agent = create_react_agent(
    model = llm,
    tools = tools,
    prompt = prompt
)

workflow = StateGraph(State)

workflow.add_node("card_creator_agent", card_creator_agent)

workflow.add_edge(START, "card_creator_agent")
workflow.add_edge("card_creator_agent", END)

graph = workflow.compile()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        content = await file.read()
        buffer = BytesIO(content)

        text = pdf_extract(buffer)

        message = f"""
        Texto acadêmico para análise e criação de flashcards:

        --- INÍCIO DO CONTEÚDO ---
        {text}
        --- FIM DO CONTEÚDO ---

        Instrução: Analise este conteúdo e crie flashcards educacionais de alta qualidade seguindo todas as diretrizes estabelecidas.
        """

        messages = [HumanMessage(content=message)]

        result = graph.invoke({"messages": messages})
        response = result["messages"][-1].content

        return{
            "success": True,
            "response": response,
            "filename": file.filename
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )
