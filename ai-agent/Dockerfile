FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -U "langgraph-cli[inmem]"

COPY . .

CMD ["uvicorn", "client:app", "--host", "0.0.0.0", "--port", "5050", "--reload"]
