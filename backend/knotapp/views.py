from django.shortcuts import render
from django.contrib.auth.models import User
from .models import Post
from rest_framework.decorators import api_view
from rest_framework.response import Response


def home(request):
    return render(request, "home.html")


@api_view(["GET"])
def users_list(request):
    users = User.objects.values("id", "username", "email", "first_name", "last_name")
    return Response(list(users))


@api_view(["GET"])
def posts_list(request):
    posts = Post.objects.values(
        "id",
        "author_id",
        "author__username",
        "content",
        "category",
        "is_misleading",
        "created_at",
    )
    return Response(list(posts))
