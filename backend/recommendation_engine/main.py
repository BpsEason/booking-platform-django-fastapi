from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import redis
import json
import os
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import random
import requests # For logging to Django backend
# from prometheus_fastapi_instrumentator import Instrumentator # Uncomment for Prometheus

# Environment variables
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", None)
JWT_SIGNING_KEY = os.environ.get("JWT_SIGNING_KEY", "your-secret-key") # Must match Django's
ALGORITHM = "HS256"
DJANGO_BACKEND_URL = os.environ.get("DJANGO_BACKEND_URL", "http://localhost:8000")
AB_TEST_STRATEGY_VARIANTS = json.loads(os.environ.get("AB_TEST_STRATEGY_VARIANTS", '{}')) # e.g., '{"control": 0.5, "variant_a": 0.5}'

app = FastAPI(
    title="Recommendation Engine API",
    description="FastAPI service for generating merchant recommendations.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Initialize Redis client
try:
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, decode_responses=True)
    r.ping()
    print("Connected to Redis successfully!")
except redis.exceptions.ConnectionError as e:
    print(f"Could not connect to Redis: {e}")
    # Depending on your setup, you might want to exit or handle this more gracefully
    # For now, we'll let it pass but operations on `r` will fail.
    r = None # Set to None so subsequent calls will fail explicitly

# OAuth2 for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token") # Points to Django's token endpoint

# Pydantic models
class TokenData(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[str] = None
    user_type: Optional[str] = None

class RecommendationLog(BaseModel):
    user_id: int
    recommended_merchant_id: int
    recommendation_algorithm: str
    timestamp: datetime = datetime.now()

# Dependency to get current user from JWT token
async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SIGNING_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        username: str = payload.get("username")
        email: str = payload.get("email")
        user_type: str = payload.get("user_type") # Assuming user_type is in JWT
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id, username=username, email=email, user_type=user_type)
    except JWTError:
        raise credentials_exception
    return token_data

# Simple A/B testing strategy
def get_ab_test_variant(user_id: int) -> str:
    if not AB_TEST_STRATEGY_VARIANTS:
        return "default" # No A/B testing configured

    variants = list(AB_TEST_STRATEGY_VARIANTS.keys())
    weights = list(AB_TEST_STRATEGY_VARIANTS.values())

    # Simple hashing for consistent assignment (replace with more robust method if needed)
    random.seed(user_id)
    return random.choices(variants, weights=weights, k=1)[0]


# --- Health Check ---
@app.get("/health/", status_code=status.HTTP_200_OK, summary="Health Check")
async def health_check():
    """Checks the health of the FastAPI service and its dependencies."""
    status_details = {"status": "ok", "timestamp": datetime.now().isoformat()}
    # Check Redis connection
    if r:
        try:
            r.ping()
            status_details["redis_status"] = "ok"
        except Exception as e:
            status_details["redis_status"] = f"error: {e}"
            status_details["status"] = "degraded"
    else:
        status_details["redis_status"] = "not_configured_or_failed_init"
        status_details["status"] = "degraded"

    return status_details

# --- Recommendation Endpoints ---
@app.get("/get-recommendations/", response_model=List[Dict], summary="Get Personalized Merchant Recommendations")
async def get_recommendations(current_user: TokenData = Depends(get_current_user)):
    """
    Retrieves a list of recommended merchants for the current authenticated user.
    The recommendation logic can vary based on A/B testing variants or user behavior.
    """
    user_id = current_user.user_id
    user_type = current_user.user_type
    
    # Example: If user is a merchant_admin, don't recommend merchants to them in this context.
    if user_type == 'merchant_admin':
        return JSONResponse(content=[], status_code=status.HTTP_200_OK)

    # Example A/B testing: Serve different recommendations based on user ID
    ab_variant = get_ab_test_variant(user_id)
    print(f"User {user_id} is in A/B test variant: {ab_variant}") # For logging/debugging

    # --- Dummy Recommendation Logic (Replace with actual ML model integration) ---
    # In a real scenario, this would involve querying a model, a database, or a dedicated recommendation service.
    # For demonstration, we'll fetch some dummy data from Redis or generate on the fly.

    recommended_merchants_data = []
    
    if r:
        # Try to fetch some pre-defined recommended merchants from Redis
        # In a real system, these would be dynamically generated and updated.
        dummy_merchants_json = r.get("dummy_recommended_merchants")
        if dummy_merchants_json:
            recommended_merchants_data = json.loads(dummy_merchants_json)
        else:
            # Fallback if Redis data is not present (or for initial setup)
            # You would replace this with actual data fetched from Django or a mock
            print("Dummy merchants not found in Redis. Generating default recommendations.")
            recommended_merchants_data = [
                {"id": 1, "name": "Cozy Coffee Shop", "address": "123 Main St", "description": "Great coffee and ambiance.", "image": "http://example.com/coffee.jpg"},
                {"id": 2, "name": "Zen Spa", "address": "456 Oak Ave", "description": "Relaxing massage and wellness services.", "image": "http://example.com/spa.jpg"},
                {"id": 3, "name": "Quick Bites Diner", "address": "789 Pine Ln", "description": "Classic American comfort food.", "image": "http://example.com/diner.jpg"}
            ]
            # Store in Redis for future requests (optional)
            try:
                r.set("dummy_recommended_merchants", json.dumps(recommended_merchants_data), ex=3600) # Cache for 1 hour
            except Exception as e:
                print(f"Failed to set dummy merchants in Redis: {e}")
    else:
        # If Redis is not available, return a static list
        print("Redis not available. Returning static default recommendations.")
        recommended_merchants_data = [
            {"id": 1, "name": "Cozy Coffee Shop", "address": "123 Main St", "description": "Great coffee and ambiance.", "image": "http://example.com/coffee.jpg"},
            {"id": 2, "name": "Zen Spa", "address": "456 Oak Ave", "description": "Relaxing massage and wellness services.", "image": "http://example.com/spa.jpg"},
            {"id": 3, "name": "Quick Bites Diner", "address": "789 Pine Ln", "description": "Classic American comfort food.", "image": "http://example.com/diner.jpg"}
        ]

    # Log the recommendation event (asynchronously, without blocking the response)
    # This might send data to Django backend for analytical purposes
    log_recommendation_event(user_id, recommended_merchants_data, ab_variant)

    return recommended_merchants_data

def log_recommendation_event(user_id: int, recommended_merchants: List[Dict], algorithm: str):
    """Sends a recommendation event to the Django backend for logging."""
    if not DJANGO_BACKEND_URL:
        print("DJANGO_BACKEND_URL not set, skipping recommendation logging.")
        return

    try:
        # Example: Send to a Django API endpoint like /api/recommendations/log/
        log_data = {
            "user_id": user_id,
            "recommended_merchant_ids": [m["id"] for m in recommended_merchants],
            "algorithm": algorithm,
            "timestamp": datetime.now().isoformat()
        }
        # Using a non-blocking request if possible, or send to a message queue
        requests.post(f"{DJANGO_BACKEND_URL}/api/recommendation-logs/", json=log_data, timeout=1)
        print(f"Logged recommendation for user {user_id} (Algorithm: {algorithm})")
    except requests.exceptions.RequestException as e:
        print(f"Failed to log recommendation event to Django backend: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during recommendation logging: {e}")

# Register Prometheus instrumentator (uncomment if using prometheus-fastapi-instrumentator)
# @app.on_event("startup")
# async def startup_event():
#     Instrumentator().instrument(app).expose(app)
