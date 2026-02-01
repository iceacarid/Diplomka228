"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('', RedirectView.as_view(url='/api/test/', permanent=False)),
    path('admin/', admin.site.urls),
    path('api/', include('logistics.urls')),
]
