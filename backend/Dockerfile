FROM python:3.14-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY app/ app/

EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]