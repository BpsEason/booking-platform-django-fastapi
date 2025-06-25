"""
URL configuration for core_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # JWT Authentication Endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Django REST Framework browsable API login/logout
    path('api-auth/', include('rest_framework.urls')),
    # Health check endpoint for Docker/monitoring
    path('api/health/', include('apps.common.urls')),

    # Custom App URLs
    path('api/users/', include('apps.users.urls')),
    path('api/merchants/', include('apps.merchants.urls')),
    path('api/appointments/', include('apps.appointments.urls')),

    # Prometheus metrics (uncomment if using django-prometheus)
    # path('metrics/', include('django_prometheus.urls')),
]
