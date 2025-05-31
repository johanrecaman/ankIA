from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from dotenv import load_dotenv
from typing import Annotated, BinaryIO
from typing_extensions import TypedDict

from io import BytesIO

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain.chat_models import init_chat_model

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import create_react_agent

import PyPDF2

import requests
import json

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
    data = {"title": title, "question": question, "answer": answer}
    try:
        response = requests.post(url, json=data, timeout=5)
        response.raise_for_status()
        return "Flashcard successfully created!"
    except requests.exceptions.RequestException as e:
        return f"Error creating flashcard: {str(e)}"

@tool
def get_flashcard(flashcard_id):
    """Usa o id para buscar um flashcard específico"""

    url = f"http://backend:3001/flashcards/{flashcard_id}"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        flashcard_data = response.json()
        return {
            "id": flashcard_data.get("id"),
            "title": flashcard_data.get("title"),
            "question": flashcard_data.get("question"),
            "answer": flashcard_data.get("answer")
        }
    except requests.exceptions.RequestException as e:
        return f"Error fetching flashcard: {str(e)}"

class State(TypedDict):
    messages: Annotated[list, add_messages]


llm = init_chat_model("google_genai:gemini-2.0-flash")
card_creator_tools = [add_flash_card]
check_tools = [get_flashcard]

card_creator_prompt = """
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

check_prompt = """
Você é um avaliador educacional de flashcards.

**PROCESSO:**
1. Use get_flashcard para buscar a pergunta e resposta oficial
2. Compare a resposta do usuário com a oficial
3. Retorne feedback em JSON

**AVALIAÇÃO:**
- **CORRETO**: Expressa a mesma ideia, aceita sinônimos, paráfrases e linguagem coloquial
- **PARCIAL**: Conceito básico correto mas incompleto ou impreciso  
- **INCORRETO**: Conceito errado, informação falsa ou resposta irrelevante

**EXEMPLO:**
Pergunta: "O que é fotossíntese?"
Oficial: "Processo onde plantas convertem luz solar em energia"
✅ Usuário: "Plantas usam luz do sol pra fazer energia" → CORRETO
🔶 Usuário: "Plantas fazem energia" → PARCIAL (faltou mencionar luz solar)
❌ Usuário: "É a respiração das plantas" → INCORRETO

**FORMATO JSON OBRIGATÓRIO:**
{
  "status": "correto"/"parcial"/"incorreto",
  "feedback": "mensagem encorajadora para o usuário",
  "official_answer": "resposta oficial para referência"
}

**FEEDBACK:**
- Correto: Elogie e reforce
- Parcial: Reconheça o acerto e oriente sobre o que falta
- Incorreto: Seja gentil, explique o erro e dê dicas

Sempre seja educativo e encorajador. Comece a avaliação!
"""

card_creator_agent = create_react_agent(
    model=llm, tools=card_creator_tools, prompt=card_creator_prompt
)

check_agent = create_react_agent(model=llm, tools=check_tools, prompt=check_prompt)

card_creator_workflow = StateGraph(State)
card_creator_workflow.add_node("card_creator_agent", card_creator_agent)

card_creator_workflow.add_edge(START, "card_creator_agent")
card_creator_workflow.add_edge("card_creator_agent", END)

card_creator_graph = card_creator_workflow.compile()


check_workflow = StateGraph(State)
check_workflow.add_node("check_agent", check_agent)

check_workflow.add_edge(START, "check_agent")
check_workflow.add_edge("check_agent", END)

check_graph = check_workflow.compile()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

        result = card_creator_graph.invoke({"messages": messages})
        response = result["messages"][-1].content

        return {"success": True, "response": response, "filename": file.filename}
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"success": False, "error": str(e)}
        )


@app.post("/check-answer")
async def check_answer(flashcard_id: int = Form(...), user_answer: str = Form(...)):
    try:
        message = f"""
        Avalie a resposta do usuário para o flashcard ID {flashcard_id}.

        Resposta do usuário: "{user_answer}"

        Retorne APENAS o JSON de avaliação conforme especificado no prompt.
        """

        messages = [HumanMessage(content=message)]

        result = check_graph.invoke({"messages": messages})
        response = result["messages"][-1].content.strip()

        try:
            check_result = json.loads(response)
            return check_result
        except json.JSONDecodeError as e:
            print(f"Erro ao fazer parse do JSON: {e}")
            print(f"Resposta recebida: {response}")

            return {
                "status": "erro",
                "feedback": "Erro interno ao processar avaliação. Tente novamente.",
                "official_answer": "Não disponível"
            }

    except Exception as e:
        print(f"Erro geral no endpoint: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "erro",
                "feedback": "Erro interno do servidor. Tente novamente.",
                "official_answer": "Não disponível"
            }
        )

