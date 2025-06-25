# Use a Python base image suitable for Django
FROM python:3.10-slim-buster

# Set working directory inside the container
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED 1

# Install system dependencies required for MySQL client (e.g., mysqlclient)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . /app/

# Expose port (Django's default)
EXPOSE 8000

# Command to run Django development server
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
# Using gunicorn for production-like environment
CMD ["gunicorn", "core_project.wsgi:application", "--bind", "0.0.0.0:8000"]
