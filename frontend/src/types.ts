/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PostCategory = "Tech" | "General" | "Q&A" | "News" | "Nature";

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  category: PostCategory;
  likes: number;
  liked_by_user: boolean;
  is_misleading: boolean;
  comments: Comment[];
}

export interface User {
  id?: number;
  username: string;
  isStaff: boolean;
}
