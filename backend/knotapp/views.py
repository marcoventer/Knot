from django.contrib.auth.models import User
from django.contrib.auth import (
    authenticate,
    login as django_login,
    logout as django_logout,
)
from django.db import IntegrityError
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from google import genai
import os
from django.conf import settings

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


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return


def categorize_post(post_title: str, post_content: str) -> str:
    allowed_categories = {"Tech", "General", "Q&A", "News", "Nature"}

    prompt = f"""Choose the best fitting category for this forum post: Tech, General, Q&A, News, or Nature.

    Return ONLY the exact category name. No markdown, no punctuation, no extra words.

    Title: {post_title}
    Content: {post_content}"""

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=prompt,
        )
        category = response.text.strip()
        return category if category in allowed_categories else "General"
    except Exception:
        return "General"


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


def serialize_post(post, viewer_user_id=None):
    comments = post.comments.select_related("author").order_by("created_at")
    liked_by_user = (
        any(like.user_id == viewer_user_id for like in post.post_likes.all())
        if viewer_user_id is not None
        else False
    )
    return {
        "id": post.id,
        "author_id": post.author_id,
        "author_username": post.author.username,
        "content": post.content,
        "category": BACKEND_TO_FRONTEND_CATEGORY.get(post.category, "General"),
        "is_misleading": post.is_misleading,
        "created_at": post.created_at.isoformat(),
        "likes": post.post_likes.count(),
        "liked_by_user": liked_by_user,
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
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def users_create(request):
    if not request.user.is_staff:
        return Response({"detail": "moderator access required"}, status=403)

    username = (request.data.get("username") or "").strip()
    if not username:
        return Response({"detail": "username is required"}, status=400)

    is_staff = bool(request.data.get("is_staff", False))
    user, _ = User.objects.get_or_create(username=username)
    user.is_staff = is_staff
    user.save(update_fields=["is_staff"])
    return Response(serialize_user(user), status=201)


@api_view(["GET"])
@permission_classes([AllowAny])
def posts_list(request):
    posts = (
        Post.objects.select_related("author")
        .prefetch_related("comments__author", "post_likes")
        .order_by("-created_at")
    )
    viewer_id = request.user.id if request.user.is_authenticated else None
    return Response([serialize_post(post, viewer_id) for post in posts])


@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def posts_create(request):
    content = (request.data.get("content") or "").strip()
    post_title = (request.data.get("title") or "").strip()

    if not content:
        return Response({"detail": "content is required"}, status=400)

    category_label = categorize_post(post_title=post_title, post_content=content)
    category_code = FRONTEND_TO_BACKEND_CATEGORY.get(category_label, "GENERAL")

    post = Post.objects.create(
        author=request.user,
        content=content,
        category=category_code,
    )
    return Response(serialize_post(post, request.user.id), status=201)


@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def post_comments(request, post_id):
    post = get_object_or_404(Post, pk=post_id)
    content = (request.data.get("content") or "").strip()

    if not content:
        return Response({"detail": "content is required"}, status=400)

    comment = Comment.objects.create(post=post, author=request.user, content=content)
    return Response(serialize_comment(comment), status=201)


@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def post_like(request, post_id):
    post = get_object_or_404(Post, pk=post_id)
    user = request.user
    existing = Like.objects.filter(post=post, user=user).first()
    if existing:
        existing.delete()
    else:
        Like.objects.create(post=post, user=user)
    return Response(serialize_post(post, request.user.id))


@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def post_misleading(request, post_id):
    if not request.user.is_staff:
        return Response({"detail": "moderator access required"}, status=403)

    post = get_object_or_404(Post, pk=post_id)
    is_misleading = bool(request.data.get("is_misleading", False))
    post.is_misleading = is_misleading
    post.save(update_fields=["is_misleading"])
    return Response(serialize_post(post, request.user.id))
