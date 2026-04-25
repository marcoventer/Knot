from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("api/auth/me/", views.auth_me, name="auth_me"),
    path("api/auth/register/", views.auth_register, name="auth_register"),
    path("api/auth/login/", views.auth_login, name="auth_login"),
    path("api/auth/logout/", views.auth_logout, name="auth_logout"),
    path("api/stats/", views.forum_stats, name="forum_stats"),
    path("api/users/", views.users_list, name="users_list"),
    path("api/users/create/", views.users_create, name="users_create"),
    path("api/posts/", views.posts_list, name="posts_list"),
    path("api/posts/create/", views.posts_create, name="posts_create"),
    path(
        "api/posts/<int:post_id>/comments/", views.post_comments, name="post_comments"
    ),
    path("api/posts/<int:post_id>/like/", views.post_like, name="post_like"),
    path(
        "api/posts/<int:post_id>/misleading/",
        views.post_misleading,
        name="post_misleading",
    ),
]
