import { Comment, Post, PostCategory, User } from "./types";

type ApiUser = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
};

type ApiComment = {
  id: number;
  author_id: number;
  author_username: string;
  content: string;
  created_at: string;
};

type ApiPost = {
  id: number;
  author_id: number;
  author_username: string;
  content: string;
  category: string;
  is_misleading: boolean;
  created_at: string;
  likes: number;
  comments: ApiComment[];
};

export type ForumStats = {
  users: number;
  posts: number;
  likes: number;
  comments: number;
};

const API_BASE = "/api";

const CATEGORY_MAP: Record<string, PostCategory> = {
  Tech: "Tech",
  General: "General",
  "Q&A": "Q&A",
  News: "News",
  Nature: "Nature",
};

const CATEGORY_TO_BACKEND: Record<PostCategory, string> = {
  Tech: "Tech",
  General: "General",
  "Q&A": "Q&A",
  News: "News",
  Nature: "Nature",
};

function formatTimestamp(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString();
}

function mapUser(user: ApiUser): User {
  return {
    id: user.id,
    username: user.username,
    isStaff: user.is_staff,
  };
}

function mapComment(comment: ApiComment): Comment {
  return {
    id: String(comment.id),
    author: comment.author_username,
    content: comment.content,
    timestamp: formatTimestamp(comment.created_at),
  };
}

function mapPost(post: ApiPost): Post {
  return {
    id: String(post.id),
    author: post.author_username,
    content: post.content,
    timestamp: formatTimestamp(post.created_at),
    category: CATEGORY_MAP[post.category] ?? "General",
    likes: post.likes,
    is_misleading: post.is_misleading,
    comments: post.comments.map(mapComment),
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchCurrentUser() {
  const response = await requestJson<{ user: ApiUser | null }>("/auth/me/");
  return response.user ? mapUser(response.user) : null;
}

export async function registerUser(input: {
  username: string;
  password: string;
  isStaff: boolean;
}) {
  const response = await requestJson<{ user: ApiUser }>("/auth/register/", {
    method: "POST",
    body: JSON.stringify({
      username: input.username,
      password: input.password,
      is_staff: input.isStaff,
    }),
  });

  return mapUser(response.user);
}

export async function loginUser(input: { username: string; password: string }) {
  const response = await requestJson<{ user: ApiUser }>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({
      username: input.username,
      password: input.password,
    }),
  });

  return mapUser(response.user);
}

export async function logoutUser() {
  await requestJson<void>("/auth/logout/", {
    method: "POST",
  });
}

export async function fetchPosts() {
  const posts = await requestJson<ApiPost[]>("/posts/");
  return posts.map(mapPost);
}

export async function fetchForumStats() {
  return requestJson<ForumStats>("/stats/");
}

export async function createPost(
  authorId: number,
  content: string,
  category: PostCategory,
) {
  const post = await requestJson<ApiPost>("/posts/create/", {
    method: "POST",
    body: JSON.stringify({
      author_id: authorId,
      content,
      category: CATEGORY_TO_BACKEND[category],
    }),
  });

  return mapPost(post);
}

export async function addComment(
  postId: string,
  authorId: number,
  content: string,
) {
  await requestJson<ApiComment>(`/posts/${postId}/comments/`, {
    method: "POST",
    body: JSON.stringify({ author_id: authorId, content }),
  });
}

export async function likePost(postId: string, authorId: number) {
  const post = await requestJson<ApiPost>(`/posts/${postId}/like/`, {
    method: "POST",
    body: JSON.stringify({ author_id: authorId }),
  });

  return mapPost(post);
}

export async function setPostMisleading(postId: string, isMisleading: boolean) {
  const post = await requestJson<ApiPost>(`/posts/${postId}/misleading/`, {
    method: "POST",
    body: JSON.stringify({ is_misleading: isMisleading }),
  });

  return mapPost(post);
}
