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


class State(TypedDict):
    messages: Annotated[list, add_messages]

llm = init_chat_model("google_genai:gemini-2.0-flash")
analyzer_tools = []
card_generator_tools = []


analyzer_agent = create_react_agent(
    model = llm,
    tools = analyzer_tools,
    prompt = "Você é um agente que analiza pdfs e extrai ideias chaves"
)

card_generator_agent = create_react_agent(
    model = llm,
    tools = card_generator_tools,
    prompt = "Você é um agente que cria flashcards estilo anki com base em pontos chave"
)

workflow = StateGraph(State)

workflow.add_node("analyzer_agent", analyzer_agent)
workflow.add_node("card_generator_agent", card_generator_agent)

workflow.add_edge(START, "analyzer_agent")
workflow.add_edge("analyzer_agent", "card_generator_agent")

graph = workflow.compile()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    content = await file.read()
    buffer = BytesIO(content)

    text = pdf_extract(buffer)
    return text


