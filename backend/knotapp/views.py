from django.contrib.auth.models import User
from django.contrib.auth import (
    authenticate,
    login as django_login,
    logout as django_logout,
)
from django.db import IntegrityError
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Comment, Like, Post


BACKEND_TO_FRONTEND_CATEGORY = {
    "TECH": "Tech",
    "GENERAL": "General",
    "QA": "Q&A",
    "NEWS": "News",
    "NATURE": "Nature",
}

FRONTEND_TO_BACKEND_CATEGORY = {
    label: code for code, label in BACKEND_TO_FRONTEND_CATEGORY.items()
}


def serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_staff": user.is_staff,
    }


def serialize_comment(comment):
    return {
        "id": comment.id,
        "author_id": comment.author_id,
        "author_username": comment.author.username,
        "content": comment.content,
        "created_at": comment.created_at.isoformat(),
    }


def serialize_post(post):
    comments = post.comments.select_related("author").order_by("created_at")
    return {
        "id": post.id,
        "author_id": post.author_id,
        "author_username": post.author.username,
        "content": post.content,
        "category": BACKEND_TO_FRONTEND_CATEGORY.get(post.category, "General"),
        "is_misleading": post.is_misleading,
        "created_at": post.created_at.isoformat(),
        "likes": post.post_likes.count(),
        "comments": [serialize_comment(comment) for comment in comments],
    }


def home(request):
    return render(request, "home.html")


@api_view(["GET"])
@permission_classes([AllowAny])
def auth_me(request):
    if not request.user.is_authenticated:
        return Response({"user": None})

    return Response({"user": serialize_user(request.user)})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@csrf_exempt
def auth_register(request):
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""
    is_staff = bool(request.data.get("is_staff", False))

    if not username:
        return Response({"detail": "username is required"}, status=400)
    if len(password) < 6:
        return Response(
            {"detail": "password must be at least 6 characters"}, status=400
        )

    try:
        user = User.objects.create_user(username=username, password=password)
    except IntegrityError:
        return Response({"detail": "username already exists"}, status=400)

    user.is_staff = is_staff
    user.save(update_fields=["is_staff"])
    django_login(request, user)
    return Response({"user": serialize_user(user)}, status=201)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@csrf_exempt
def auth_login(request):
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""

    if not username or not password:
        return Response({"detail": "username and password are required"}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({"detail": "invalid username or password"}, status=400)

    django_login(request, user)
    return Response({"user": serialize_user(user)})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@csrf_exempt
def auth_logout(request):
    django_logout(request)
    return Response(status=204)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def forum_stats(request):
    return Response(
        {
            "users": User.objects.count(),
            "posts": Post.objects.count(),
            "likes": Like.objects.count(),
            "comments": Comment.objects.count(),
        }
    )


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def users_list(request):
    users = User.objects.order_by("username")
    return Response([serialize_user(user) for user in users])


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def users_create(request):
    username = (request.data.get("username") or "").strip()
    if not username:
        return Response({"detail": "username is required"}, status=400)

    is_staff = bool(request.data.get("is_staff", False))
    user, _ = User.objects.get_or_create(username=username)
    user.is_staff = is_staff
    user.save(update_fields=["is_staff"])
    return Response(serialize_user(user), status=201)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def posts_list(request):
    posts = (
        Post.objects.select_related("author")
        .prefetch_related("comments__author", "post_likes")
        .order_by("-created_at")
    )
    return Response([serialize_post(post) for post in posts])


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def posts_create(request):
    author_id = request.data.get("author_id")
    content = (request.data.get("content") or "").strip()
    category = request.data.get("category") or "General"

    if not author_id:
        return Response({"detail": "author_id is required"}, status=400)
    if not content:
        return Response({"detail": "content is required"}, status=400)

    author = get_object_or_404(User, pk=author_id)
    post = Post.objects.create(
        author=author,
        content=content,
        category=FRONTEND_TO_BACKEND_CATEGORY.get(category, category),
    )
    return Response(serialize_post(post), status=201)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def post_comments(request, post_id):
    post = get_object_or_404(Post, pk=post_id)
    author_id = request.data.get("author_id")
    content = (request.data.get("content") or "").strip()

    if not author_id:
        return Response({"detail": "author_id is required"}, status=400)
    if not content:
        return Response({"detail": "content is required"}, status=400)

    author = get_object_or_404(User, pk=author_id)
    comment = Comment.objects.create(post=post, author=author, content=content)
    return Response(serialize_comment(comment), status=201)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def post_like(request, post_id):
    post = get_object_or_404(Post, pk=post_id)
    author_id = request.data.get("author_id")

    if not author_id:
        return Response({"detail": "author_id is required"}, status=400)

    user = get_object_or_404(User, pk=author_id)
    Like.objects.get_or_create(post=post, user=user)
    return Response(serialize_post(post))


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def post_misleading(request, post_id):
    post = get_object_or_404(Post, pk=post_id)
    is_misleading = bool(request.data.get("is_misleading", False))
    post.is_misleading = is_misleading
    post.save(update_fields=["is_misleading"])
    return Response(serialize_post(post))
