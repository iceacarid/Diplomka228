"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from logistics.views import (
    index_view, login_view, register_view, dashboard_view, forgot_password_view,
    robots_txt_view, sitemap_xml_view,
)

urlpatterns = [
    path('robots.txt', robots_txt_view, name='robots_txt'),
    path('sitemap.xml', sitemap_xml_view, name='sitemap_xml'),
    path('', index_view, name='index'),
    path('login', login_view, name='login'),
    path('register', register_view, name='register'),
    path('forgot-password', forgot_password_view, name='forgot_password'),
    path('dashboard', dashboard_view, name='dashboard'),
    path('client/dashboard', dashboard_view, name='client_dashboard'),
    path('client/orders', dashboard_view, name='client_orders'),
    path('client/profile', dashboard_view, name='client_profile'),
    path('admin-panel', dashboard_view, name='admin_panel'),
    path('manager/dashboard', dashboard_view, name='manager_dashboard'),
    path('manager/orders', dashboard_view, name='manager_orders'),
    path('admin/', admin.site.urls),
    path('api/', include('logistics.urls')),
]

# Раздача медиа (аватарки и загрузки) — и в DEBUG, и на хосте
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
