/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageCircle,
  Flag,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  Share2,
} from "lucide-react";
import { Post, User as UserType } from "../types";

interface PostCardProps {
  post: Post;
  currentUser: UserType | null;
  isGuest?: boolean;
  onLike: (postId: string) => void;
  onFlag: (postId: string) => void;
  onUnflag: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  isGuest = false,
  onLike,
  onFlag,
  onUnflag,
  onComment,
}) => {
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const isOwnPost =
    !!currentUser &&
    currentUser.username.toLowerCase() === post.author.toLowerCase();

  const handleLike = () => {
    if (isOwnPost) return;
    onLike(post.id);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onComment(post.id, newComment);
    setNewComment("");
  };

  const getTagColor = (category: string) => {
    const colors: Record<string, string> = {
      Tech: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      "Q&A": "text-amber-400 bg-amber-400/10 border-amber-400/20",
      News: "text-pink-400 bg-pink-400/10 border-pink-400/20",
      Nature: "text-lime-400 bg-lime-400/10 border-lime-400/20",
      General: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    };
    return colors[category] || colors.General;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 overflow-hidden relative transition-all duration-200 ${
        post.is_misleading ? "misleading-glow" : ""
      }`}
    >
      {post.is_misleading && (
        <div className="absolute top-0 right-0 bg-red-500/80 backdrop-blur-sm px-3 py-1 z-20">
          <p className="text-[9px] uppercase tracking-tighter font-black text-white">
            Misleading Information
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-white/10 shrink-0">
              <User size={16} className="text-slate-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white truncate">
                  {post.author}
                </h3>
                <span className="text-[10px] text-slate-500">
                  • {post.timestamp}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`px-1.5 py-0 rounded text-[8px] font-bold uppercase tracking-wider border ${getTagColor(post.category)}`}
                >
                  {post.category}
                </span>
                <div className="text-[10px] text-slate-400">
                  Knot ID: #{post.id.padStart(4, "0")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-sm text-slate-300 leading-snug">
          {post.content}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              disabled={isOwnPost || isGuest}
              title={
                isGuest
                  ? "Sign in to like posts"
                  : isOwnPost
                    ? "You cannot like your own post"
                    : undefined
              }
              className={`flex items-center gap-1.5 transition-all text-xs ${
                post.liked_by_user
                  ? "text-rose-400 hover:text-slate-400"
                  : "text-slate-400 hover:text-rose-400"
              } ${isOwnPost || isGuest ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Heart
                size={14}
                fill={post.liked_by_user ? "currentColor" : "none"}
              />
              <span className="font-bold">{post.likes} Likes</span>
            </button>

            <button
              onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
              className={`text-xs font-semibold transition-colors ${
                isCommentsExpanded
                  ? "text-indigo-300"
                  : "text-slate-400 hover:text-indigo-300"
              }`}
            >
              {isCommentsExpanded
                ? "Hide Comments"
                : `View Comments (${post.comments.length})`}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {currentUser?.isStaff &&
              (post.is_misleading ? (
                <button
                  onClick={() => onUnflag(post.id)}
                  className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-400/20 px-2 py-0.5 rounded hover:bg-emerald-400/5 transition-colors"
                >
                  Unflag
                </button>
              ) : (
                <button
                  onClick={() => onFlag(post.id)}
                  className="text-[9px] font-bold text-red-400 uppercase tracking-widest border border-red-400/20 px-2 py-0.5 rounded hover:bg-red-400/5 transition-colors"
                >
                  Flag
                </button>
              ))}
          </div>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {isCommentsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex flex-col gap-3 pl-4 border-l border-white/10">
                {currentUser && !isGuest && (
                  <form
                    onSubmit={handleCommentSubmit}
                    className="flex gap-2 mb-2"
                  >
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Post
                    </button>
                  </form>
                )}
                {isGuest && (
                  <p className="text-[10px] text-slate-500 italic">
                    Sign in to leave a comment.
                  </p>
                )}

                {post.comments.map((comment) => (
                  <div key={comment.id} className="text-xs text-slate-400">
                    <span className="font-bold text-slate-300">
                      {comment.author}:
                    </span>{" "}
                    {comment.content}
                  </div>
                ))}
                {post.comments.length === 0 && (
                  <p className="text-[10px] text-slate-500 italic">
                    No connections tied here yet.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PostCard;
