Booking Platform 專案說明文件專案概述這是一個輕量的預約平台，旨在提供商家管理、預約服務與後台管理功能。本倉庫包含核心代碼片段，主要展示 Django REST Framework（主後端）、FastAPI（推薦引擎）與 Vue.js（前端）結合的技術實現。資料庫使用 MySQL，搭配 Redis 進行快取與訊息佇列處理。監控方面預設使用 Prometheus 與 Grafana。此專案提供必要的配置與結構，以利快速啟動與開發。設計上以簡潔實用為主，適合學習或作為快速原型開發的參考。系統架構以下是系統架構圖，展示模組間關係：graph TD
    subgraph 前端層
        A[客戶端瀏覽器] -->|HTTP/HTTPS| B(Nginx)
        B -->|靜態檔案| E[Vue.js 前端]
    end
    subgraph 後端層
        B -->|反向代理| C[Django 後端]
        B -->|反向代理| D[FastAPI 推薦引擎]
        C -->|內部 API 呼叫| D
    end
    subgraph 資料層
        C -->|SQL 查詢| F[MySQL 資料庫]
        C -->|快取/佇列| G[Redis]
        D -->|快取| G
    end
    subgraph 監控層
        H[Prometheus] -->|收集指標| C
        H -->|收集指標| D
        H -->|收集指標| I[MySQL 匯出器]
        J[Grafana] -->|查詢| H
    end
架構說明前端（Vue.js）：負責使用者介面，包含商家列表、預約流程等，搭配 Pinia 管理狀態，透過 Axios 與後端 API 互動。主後端（Django REST Framework）：實現核心業務邏輯，如使用者認證（JWT）、商家管理、預約管理，連線 MySQL 儲存數據。推薦引擎（FastAPI）：提供個人化商家推薦，與 Django 共享 JWT 認證，透過 Redis 快取資料。資料庫（MySQL）：儲存結構化數據，如使用者、商家、預約等。Redis：用於快取與訊息佇列，支援高效能與 A/B 測試。Nginx：作為反向代理，處理前端靜態檔案與後端請求分發。監控（Prometheus + Grafana）：監控系統效能，提供基礎指標追蹤。環境需求Docker & Docker Compose（建議版本 20.10 或以上）Node.js（前端開發，建議版本 18.x）Python 3.10（本地開發用）npm（前端套件管理）安裝與部署注意：本倉庫已包含 docker-compose.yml、環境變數檔案（.env_backend、.env_fastapi）及其他必要的配置。以下為參考指引，實際部署需根據你的環境調整。1. 複製專案git clone https://github.com/BpsEason/booking-platform-django-fastapi.git
cd booking-platform-django-fastapi
2. 啟動服務在專案根目錄執行：docker-compose up --build -d
注意：首次啟動需下載映像並編譯，可能較慢。確認以下埠未被佔用：80（Nginx）8000（Django）8001（FastAPI）3306（MySQL）6379（Redis）9090（Prometheus）3000（Grafana）3. 安裝前端依賴進入前端目錄並安裝：cd frontend
npm install
開發模式：npm run dev
部署前編譯：npm run build
4. 初始化資料庫本專案的 MySQL 資料庫初始結構，是透過 mysql_init_scripts/init_database_schema.sql 檔案在 MySQL 容器首次啟動時自動建立的。如果您是首次運行或需要重置資料庫，請執行以下步驟：確保 mysql_init_scripts/init_database_schema.sql 檔案存在，並且您的 Django 模型（backend/apps/*/models.py）與該 SQL 結構一致。（如果之前有運行過且想清除舊數據）停止並移除舊的 Docker 容器和數據卷：docker-compose down -v
這會清除所有服務的舊數據，包含 MySQL 資料。重新啟動服務：docker-compose up --build -d
MySQL 容器會自動執行 init_database_schema.sql 來建立資料庫結構。執行 Django 資料庫遷移，並處理假遷移：在 MySQL 結構已由 SQL 腳本建立後，您需要讓 Django 的遷移系統同步其狀態。# 確保生成最新的遷移文件（如果還沒有）
docker exec -it booking-platform-django-fastapi_django_backend python manage.py makemigrations

# 執行遷移，如果表已存在，Django 會跳過或需要 --fake-initial
# 對於自定義的 apps，如果已由 SQL 建立，可以考慮假遷移：
docker exec -it booking-platform-django-fastapi_django_backend python manage.py migrate --fake-initial
# 或者針對每個自定義 app 單獨進行假遷移，例如：
# docker exec -it booking-platform-django-fastapi_django_backend python manage.py migrate users --fake-initial
# docker exec -it booking-platform-django-fastapi_django_backend python manage.py migrate merchants --fake-initial
# docker exec -it booking-platform-django-fastapi_django_backend python manage.py migrate appointments --fake-initial
# docker exec -it booking-platform-django-fastapi_django_backend python manage.py migrate common --fake-initial
建立 Django 超級使用者 (用於管理員面板訪問)：docker exec -it booking-platform-django-fastapi_django_backend python manage.py createsuperuser
按照提示輸入用戶名、電子郵件和密碼。5. 存取服務前端：http://localhostDjango Admin：http://localhost/adminFastAPI 文件：http://localhost:8001/docsGrafana：http://localhost:3000（預設帳號/密碼：admin/admin）使用方式使用者功能註冊/登入：透過 /register 或 /login 建立帳號，支援顧客與商家管理員角色。瀏覽商家：在 /merchants 查看商家列表，點擊查看詳情並預約。預約服務：選擇商家、服務、日期與時間完成預約。個人檔案：在 /profile 更新資料或更改密碼。我的預約：在 /my-bookings 管理預約記錄。商家管理員功能管理商家：在 /merchant-admin 新增或編輯商家資訊。管理服務：為商家新增服務，設定價格與時長。預約管理：確認、取消或標記預約為已完成。推薦引擎透過 FastAPI 的 /api/recommend/get-recommendations/ 取得推薦，支援 A/B 測試（調整 .env_fastapi 的 AB_TEST_STRATEGY_VARIANTS）。關鍵代碼片段（含註解）Django 設定 (backend/core_project/settings.py)# 定義專案根目錄
BASE_DIR = Path(__file__).resolve().parent.parent

# 從環境變數取得密鑰，確保安全性
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'default-django-secret-key-for-dev')
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

# 允許的域名，需在正式環境加入實際域名
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]', os.environ.get('HOST_IP', '')]

# 安裝的應用程式，包含內建與自訂應用
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'apps.users',
    'apps.merchants',
    'apps.appointments',
    'apps.common',
]

# 中間件設定，包含 CORS 與安全相關功能
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 資料庫設定，使用 MySQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DATABASE_NAME'),
        'USER': os.environ.get('DATABASE_USER'),
        'PASSWORD': os.environ.get('DATABASE_PASSWORD'),
        'HOST': os.environ.get('DATABASE_HOST'),
        'PORT': os.environ.get('DATABASE_PORT'),
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'"
        }
    }
}

# JWT 認證設定
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10
}

# JWT Token 過期時間設定
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.environ.get('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 60))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.environ.get('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.environ.get('JWT_SIGNING_KEY'),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
}

# CORS 設定，允許前端跨域請求
CORS_ALLOWED_ORIGINS = [
    os.environ.get('FRONTEND_URL', 'http://localhost:5173'),
]
CORS_ALLOW_CREDENTIALS = True
FastAPI 推薦引擎 (recommendation_engine/main.py)from fastapi import FastAPI, Depends, HTTPException, status
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

# 環境變數設定
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

# 初始化 Redis 連線
try:
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, decode_responses=True)
    r.ping()
    print("Connected to Redis successfully!")
except redis.exceptions.ConnectionError as e:
    print(f"Could not connect to Redis: {e}")
    # 根據您的設定，您可能需要在此處退出或更優雅地處理此問題
    # 目前，我們讓它通過，但 `r` 上的操作將會失敗。
    r = None # 將其設定為 None，以便後續呼叫會明確失敗

# OAuth2 用於令牌驗證
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token") # 指向 Django 的令牌端點

# Pydantic 模型
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

# 依賴項，從 JWT 令牌獲取當前用戶
async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="無法驗證憑證",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SIGNING_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        username: str = payload.get("username")
        email: str = payload.get("email")
        user_type: str = payload.get("user_type") # 假設 user_type 在 JWT 中
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id, username=username, email=email, user_type=user_type)
    except JWTError:
        raise credentials_exception
    return token_data

# 簡單的 A/B 測試策略
def get_ab_test_variant(user_id: int) -> str:
    if not AB_TEST_STRATEGY_VARIANTS:
        return "default" # 未配置 A/B 測試

    variants = list(AB_TEST_STRATEGY_VARIANTS.keys())
    weights = list(AB_TEST_STRATEGY_VARIANTS.values())

    # 簡單的雜湊用於一致的分配（如果需要，請替換為更穩健的方法）
    random.seed(user_id)
    return random.choices(variants, weights=weights, k=1)[0]


# --- 健康檢查 ---
@app.get("/health/", status_code=status.HTTP_200_OK, summary="健康檢查")
async def health_check():
    """檢查 FastAPI 服務及其依賴項的健康狀況。"""
    status_details = {"status": "ok", "timestamp": datetime.now().isoformat()}
    # 檢查 Redis 連線
    if r:
        try:
            r.ping()
            status_details["redis_status"] = "ok"
        except Exception as e:
            status_details["redis_status"] = f"錯誤: {e}"
            status_details["status"] = "降級"
    else:
        status_details["redis_status"] = "未配置或初始化失敗"
        status_details["status"] = "降級"

    return status_details

# --- 推薦端點 ---
@app.get("/get-recommendations/", response_model=List[Dict], summary="獲取個性化商家推薦")
async def get_recommendations(current_user: TokenData = Depends(get_current_user)):
    """
    為當前經過驗證的使用者檢索推薦商家列表。
    推薦邏輯可能因 A/B 測試變體或使用者行為而異。
    """
    user_id = current_user.user_id
    user_type = current_user.user_type
    
    # 範例：如果使用者是 merchant_admin，則在此上下文中不向他們推薦商家。
    if user_type == 'merchant_admin':
        return JSONResponse(content=[], status_code=status.HTTP_200_OK)

    # 範例 A/B 測試：根據使用者 ID 提供不同的推薦
    ab_variant = get_ab_test_variant(user_id)
    print(f"使用者 {user_id} 位於 A/B 測試變體：{ab_variant}") # 用於記錄/調試

    # --- 虛擬推薦邏輯（替換為實際的 ML 模型整合）---
    # 在真實情況下，這將涉及查詢模型、資料庫或專用推薦服務。
    # 為了演示，我們將從 Redis 獲取一些虛擬數據或即時生成。

    recommended_merchants_data = []
    
    if r:
        # 嘗試從 Redis 獲取一些預定義的推薦商家
        # 在真實系統中，這些將會動態生成和更新。
        dummy_merchants_json = r.get("dummy_recommended_merchants")
        if dummy_merchants_json:
            recommended_merchants_data = json.loads(dummy_merchants_json)
        else:
            # 如果 Redis 數據不存在（或用於初始設定），則進行回退
            # 您將使用從 Django 獲取的實際數據或模擬數據替換此處
            print("在 Redis 中找不到虛擬商家。正在生成預設推薦。")
            recommended_merchants_data = [
                {"id": 1, "name": "Cozy Coffee Shop", "address": "123 Main St", "description": "Great coffee and ambiance.", "image": "http://example.com/coffee.jpg"},
                {"id": 2, "name": "Zen Spa", "address": "456 Oak Ave", "description": "Relaxing massage and wellness services.", "image": "http://example.com/spa.jpg"},
                {"id": 3, "name": "Quick Bites Diner", "address": "789 Pine Ln", "description": "Classic American comfort food.", "image": "http://example.com/diner.jpg"}
            ]
            # （可選）在 Redis 中儲存以供將來的請求
            try:
                r.set("dummy_recommended_merchants", json.dumps(recommended_merchants_data), ex=3600) # 快取 1 小時
            except Exception as e:
                print(f"無法在 Redis 中設定虛擬商家: {e}")
    else:
        # 如果 Redis 不可用，則返回靜態列表
        print("Redis 不可用。正在返回靜態預設推薦。")
        recommended_merchants_data = [
            {"id": 1, "name": "Cozy Coffee Shop", "address": "123 Main St", "description": "Great coffee and ambiance.", "image": "http://example.com/coffee.jpg"},
            {"id": 2, "name": "Zen Spa", "address": "456 Oak Ave", "description": "Relaxing massage and wellness services.", "image": "http://example.com/spa.jpg"},
            {"id": 3, "name": "Quick Bites Diner", "address": "789 Pine Ln", "description": "Classic American comfort food.", "image": "http://example.com/diner.jpg"}
        ]

    # 記錄推薦事件（非同步，不阻塞響應）
    # 這可能會將數據發送到 Django 後端用於分析目的
    log_recommendation_event(user_id, recommended_merchants_data, ab_variant)

    return recommended_merchants_data

def log_recommendation_event(user_id: int, recommended_merchants: List[Dict], algorithm: str):
    """將推薦事件發送到 Django 後端進行記錄。"""
    if not DJANGO_BACKEND_URL:
        print("未設定 DJANGO_BACKEND_URL，跳過推薦記錄。")
        return

    try:
        # 範例：發送到 Django API 端點，例如 /api/recommendations/log/
        log_data = {
            "user_id": user_id,
            "recommended_merchant_ids": [m["id"] for m in recommended_merchants],
            "algorithm": algorithm,
            "timestamp": datetime.now().isoformat()
        }
        # 如果可能，使用非阻塞請求，或發送到訊息佇列
        requests.post(f"{DJANGO_BACKEND_URL}/api/recommendation-logs/", json=log_data, timeout=1)
        print(f"已記錄使用者 {user_id} 的推薦（演算法：{algorithm}）")
    except requests.exceptions.RequestException as e:
        print(f"無法將推薦事件記錄到 Django 後端: {e}")
    except Exception as e:
        print(f"在推薦記錄期間發生意外錯誤: {e}")

# 註冊 Prometheus 儀表器（如果使用 prometheus-fastapi-instrumentator，請取消註釋）
# @app.on_event("startup")
# async def startup_event():
#     Instrumentator().instrument(app).expose(app)
Vue.js 前端 - 首頁 (frontend/src/views/HomeView.vue)<script setup>
import { onMounted, ref } from 'vue';
import RecommendationService from '@/services/recommendation.service';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; // 引入 Pinia store

const recommendedMerchants = ref([]);
const isLoading = ref(true);
const error = ref(null);
const router = useRouter();
const authStore = useAuthStore(); // 實例化 authStore

const fetchRecommendedMerchants = async () => {
  isLoading.value = true;
  error.value = null;
  // 只有在用戶登入後才嘗試獲取推薦
  if (!authStore.isAuthenticated) {
    isLoading.value = false;
    recommendedMerchants.value = []; // 清空推薦列表
    return;
  }

  try {
    const data = await RecommendationService.getRecommendedMerchants();
    recommendedMerchants.value = data;
  } catch (err) {
    console.error("Error fetching recommended merchants:", err);
    error.value = "載入推薦失敗，請稍後再試。";
  } finally {
    isLoading.value = false;
  }
};

const viewMerchantDetail = (merchantId) => {
  router.push({ name: 'merchant-detail', params: { id: merchantId } });
};

onMounted(fetchRecommendedMerchants);
</script>

<template>
  <div class="home-view">
    <div class="jumbotron text-center bg-light p-5 rounded shadow-sm mb-5">
      <h1 class="display-4">歡迎來到我們的預約平台！</h1>
      <p class="lead">輕鬆探索並預約本地商家提供的服務。</p>
      <hr class="my-4">
      <p>尋找最適合您需求的服務，從沙龍到工作坊應有盡有。</p>
      <router-link to="/merchants" class="btn btn-primary btn-lg mt-3">探索商家</router-link>
    </div>

    <h2 class="text-center mb-4">為您推薦</h2>
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
      <p class="mt-2">正在載入推薦...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    <div v-else-if="!authStore.isAuthenticated" class="alert alert-info text-center">
      登入以查看為您量身打造的推薦！
    </div>
    <div v-else-if="recommendedMerchants.length > 0" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      <div class="col" v-for="merchant in recommendedMerchants" :key="merchant.id">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ merchant.name }}</h5>
            <p class="card-text text-muted">{{ merchant.address }}</p>
            <p class="card-text">{{ merchant.description?.substring(0, 100) }}...</p>
            <button @click="viewMerchantDetail(merchant.id)" class="btn btn-outline-primary mt-auto">查看詳情</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="alert alert-info text-center">
      目前無推薦商家，立即探索所有商家！
    </div>
  </div>
</template>

<style scoped>
.jumbotron {
  background-color: #f8f9fa;
  padding: 3rem;
}
</style>

注意事項安全性：正式環境需更新 .env_backend 與 .env_fastapi 的密碼與密鑰。MySQL 與 Grafana 預設密碼（root_password、admin/admin）需立即更改。設定 DJANGO_DEBUG=False 避免暴露敏感資訊。監控設定：Prometheus 與 Grafana 需自行配置 prometheus.yml 與儀表板。建議在 Django 與 FastAPI 啟用 django-prometheus 與 prometheus-fastapi-instrumentator。前端部署：部署前執行 npm run build，確保 Nginx 指向 frontend/dist。確認 CORS_ALLOWED_ORIGINS 包含正確前端域名。資料庫初始化：本專案的資料庫初始結構由 mysql_init_scripts/init_database_schema.sql 建立。自訂模型需在 backend/apps/*/models.py 定義並確保與 SQL 結構一致，隨後執行 Django 遷移。可在 mysql_init_scripts/ 加入初始資料（如有需要）。推薦引擎：目前為模擬邏輯，實際應用需整合機器學習或資料庫查詢。A/B 測試配置可透過 .env_fastapi 的 AB_TEST_STRATEGY_VARIANTS 調整。下一步補充 Django 應用中的模型與 API（apps/users、apps/merchants、apps/appointments），使其與 init_database_schema.sql 的結構完全匹配。為 FastAPI 整合真實推薦演算法，使其從資料庫獲取數據而非模擬數據。配置 Grafana 儀表板，新增更多監控指標。測試跨瀏覽器相容性，確保前端正常運作。如需進一步協助，請提供更多專案細節，祝開發順利！
