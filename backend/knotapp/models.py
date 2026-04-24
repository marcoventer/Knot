from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Post(models.Model):
    # Option D: Predefined categories
    CATEGORY_CHOICES = [
        ("TECH", "Tech"),
        ("GENERAL", "General"),
        ("QA", "Q&A"),
        ("NEWS", "News"),
        ("NATURE", "Nature"),
    ]

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()

    # AI-generated field
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, blank=True)

    # Moderator-controlled field
    is_misleading = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post by {self.author.username} - {self.category}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author.username} on Post {self.post.id}"


class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="post_likes")
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        # Requirement: Each user can only like a post once
        unique_together = ("post", "user")

    def clean(self):
        # Requirement: Users cannot like their own post
        # Note: This clean() method should be called in your Serializer or View
        if self.user == self.post.author:
            raise ValidationError("You cannot like your own post.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
