FROM python:3.14-slim

WORKDIR /app

COPY requirements-deploy.txt .
RUN pip install -r requirements-deploy.txt --no-cache-dir

COPY app/ app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]