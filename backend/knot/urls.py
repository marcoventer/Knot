from django.contrib import admin
from django.urls import path
from knotapp.views import home, users_list, posts_list

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", home, name="home"),
    path("api/users/", users_list, name="users_list"),
    path("api/posts/", posts_list, name="posts_list"),
]
