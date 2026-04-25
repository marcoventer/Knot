/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User as UserIcon,
  Link,
  LogOut,
  Plus,
  Search,
  Compass,
  X,
} from "lucide-react";
import Background from "./components/Background";
import PostCard from "./components/PostCard";
import Login from "./components/Login";
import Register from "./components/Register";
import { Post, User, PostCategory } from "./types";
import {
  addComment,
  createPost,
  fetchForumStats,
  fetchCurrentUser,
  fetchPosts,
  likePost,
  loginUser,
  logoutUser,
  setPostMisleading,
  registerUser,
} from "./api";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeView, setActiveView] = useState<"feed" | "my-knots">("feed");
  const [selectedCategory, setSelectedCategory] = useState<
    PostCategory | "All"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewKnotModalOpen, setIsNewKnotModalOpen] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newKnotContent, setNewKnotContent] = useState("");
  const [forumStats, setForumStats] = useState({
    users: 0,
    posts: 0,
    likes: 0,
    comments: 0,
  });

  const refreshForumStats = async () => {
    try {
      const stats = await fetchForumStats();
      setForumStats(stats);
    } catch {
      setForumStats({ users: 0, posts: 0, likes: 0, comments: 0 });
    }
  };

  useEffect(() => {
    const init = async () => {
      let userId: number | undefined;
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
        userId = user?.id;
      } catch {
        setCurrentUser(null);
      }
      try {
        const apiPosts = await fetchPosts(userId);
        setPosts(apiPosts);
      } catch {
        setPosts([]);
      }
    };

    void init();
    void refreshForumStats();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    const backendUser = await loginUser({ username, password });
    setCurrentUser(backendUser);
    try {
      const apiPosts = await fetchPosts(backendUser.id);
      setPosts(apiPosts);
    } catch {}
  };

  const handleRegister = async (
    username: string,
    password: string,
    isStaff: boolean,
  ) => {
    const backendUser = await registerUser({ username, password, isStaff });
    setCurrentUser(backendUser);
    void refreshForumStats();
    try {
      const apiPosts = await fetchPosts(backendUser.id);
      setPosts(apiPosts);
    } catch {}
  };

  // Filter posts based on active view, category, and search query
  const filteredPosts = posts.filter((post) => {
    const matchesView =
      activeView === "my-knots" ? post.author === currentUser?.username : true;
    const matchesCategory =
      selectedCategory === "All" ? true : post.category === selectedCategory;
    const matchesSearch =
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesView && matchesCategory && matchesSearch;
  });

  const handleLike = async (postId: string) => {
    if (!currentUser?.id) return;

    const targetPost = posts.find((post) => post.id === postId);
    if (
      targetPost &&
      targetPost.author.toLowerCase() === currentUser.username.toLowerCase()
    ) {
      return;
    }

    try {
      const updatedPost = await likePost(postId, currentUser.id);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? updatedPost : post)),
      );
      void refreshForumStats();
    } catch {
      // Ignore transient API errors and keep the UI responsive.
    }
  };

  const handleFlag = async (postId: string) => {
    try {
      const updatedPost = await setPostMisleading(postId, true);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...updatedPost, liked_by_user: post.liked_by_user }
            : post,
        ),
      );
      void refreshForumStats();
    } catch {
      // Ignore transient API errors and keep the UI responsive.
    }
  };

  const handleUnflag = async (postId: string) => {
    try {
      const updatedPost = await setPostMisleading(postId, false);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...updatedPost, liked_by_user: post.liked_by_user }
            : post,
        ),
      );
      void refreshForumStats();
    } catch {
      // Ignore transient API errors and keep the UI responsive.
    }
  };

  const handleComment = async (postId: string, content: string) => {
    if (!currentUser?.id) return;

    try {
      await addComment(postId, currentUser.id, content);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [
                  {
                    id: `pending-${Date.now()}`,
                    author: currentUser.username,
                    content,
                    timestamp: "Just now",
                  },
                  ...post.comments,
                ],
              }
            : post,
        ),
      );
      void refreshForumStats();
    } catch {
      // Ignore transient API errors and keep the UI responsive.
    }
  };

  const handleCreatePost = async () => {
    if (!newKnotContent.trim() || !currentUser?.id || isCreatingPost) return;

    setIsCreatingPost(true);

    try {
      const createdPost = await createPost(currentUser.id, newKnotContent);
      setPosts((prev) => [createdPost, ...prev]);
      void refreshForumStats();
      setNewKnotContent("");
      setIsNewKnotModalOpen(false);
    } catch {
      // Ignore transient API errors and keep the UI responsive.
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleLogout = () => {
    void logoutUser();
    setCurrentUser(null);
  };

  const formatCompactCount = (value: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);

  if (!currentUser) {
    return (
      <>
        <Background />
        {authView === "login" ? (
          <Login
            onLogin={handleLogin}
            onShowRegister={() => setAuthView("register")}
          />
        ) : (
          <Register
            onRegister={handleRegister}
            onBackToLogin={() => setAuthView("login")}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen relative font-sans text-[#E2E8F0] overflow-hidden flex flex-col lg:flex-row">
      <Background />

      <div className="flex flex-col lg:flex-row w-full max-w-[1400px] mx-auto lg:p-6 gap-6 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/20 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-2">
            <Link className="text-indigo-400 rotate-45" size={24} />
            <h1 className="text-xl font-black tracking-tight text-white italic uppercase">
              Knot
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border border-white/20">
              <span className="text-xs font-bold text-white">
                {currentUser.username.charAt(0)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full border border-white/10"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Left Sidebar: Navigation & Brand (Desktop Only) */}
        <aside className="hidden lg:flex w-64 flex-col gap-8 z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Link className="text-indigo-400 rotate-45" size={32} />
              <h1 className="text-4xl font-black tracking-tight text-white italic uppercase">
                Knot
              </h1>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-slate-500">
              Tying things together
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveView("feed")}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all group ${
                activeView === "feed"
                  ? "bg-white/10 text-white font-medium"
                  : "hover:bg-white/5 text-slate-400"
              }`}
            >
              <Compass
                className={`w-5 h-5 ${activeView === "feed" ? "text-indigo-400" : ""}`}
              />
              Feed
            </button>
            <button
              onClick={() => setActiveView("my-knots")}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all group ${
                activeView === "my-knots"
                  ? "bg-white/10 text-white font-medium"
                  : "hover:bg-white/5 text-slate-400"
              }`}
            >
              <UserIcon
                className={`w-5 h-5 ${activeView === "my-knots" ? "text-indigo-400" : ""}`}
              />
              My Knots
            </button>
            <button
              onClick={() => setIsNewKnotModalOpen(true)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all"
            >
              <Plus className="w-5 h-5" />
              New Knot
            </button>
          </nav>

          <div className="mt-auto">
            <div className="glass p-4 rounded-xl flex items-center gap-3 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 -z-10" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border border-white/20">
                <span className="text-sm font-bold text-white">
                  {currentUser.username.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-white">
                  {currentUser.username}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                  {currentUser.isStaff ? "Moderator" : "Community Member"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>

        {/* Center Main Feed */}
        <main className="flex-1 flex flex-col z-10 px-4 lg:px-2 overflow-hidden">
          {/* Header Area with Search Bar */}
          <div className="pt-2 lg:pt-4 pb-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20 text-indigo-400 group-focus-within:text-indigo-300 transition-colors">
                <Search size={16} strokeWidth={2.5} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knots, users..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all shadow-inner backdrop-blur-md relative z-10"
              />
            </div>
          </div>

          {/* Mobile Category Horizontal Scroll */}
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 shrink-0">
            {(["All", "Tech", "General", "Nature", "News", "Q&A"] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border shrink-0 ${
                    selectedCategory === cat
                      ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                      : "bg-white/5 text-slate-400 border-white/10"
                  }`}
                >
                  {cat}
                </button>
              ),
            )}
          </div>

          {/* Scrollable Feed Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-24 lg:pb-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {activeView === "feed" ? "Community Feed" : "My Knots"}
                {selectedCategory !== "All" && (
                  <span className="ml-2 text-sm font-normal text-indigo-400">
                    / {selectedCategory}
                  </span>
                )}
              </h2>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredPosts.length > 0 ? (
                  [...filteredPosts]
                    .sort((a, b) =>
                      b.is_misleading === a.is_misleading
                        ? 0
                        : b.is_misleading
                          ? -1
                          : 1,
                    )
                    .map((post: Post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onLike={handleLike}
                        onFlag={handleFlag}
                        onUnflag={handleUnflag}
                        onComment={handleComment}
                      />
                    ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center py-20 text-center px-4"
                  >
                    <h3 className="text-lg font-bold text-white mb-1 italic">
                      No Knots Found
                    </h3>
                    <p className="text-xs text-slate-500 mb-6 max-w-[240px] leading-relaxed uppercase tracking-widest font-medium">
                      {activeView === "my-knots"
                        ? "You haven't tied any knots yet. Start your first conversation!"
                        : "The feed is currently empty."}
                    </p>
                    {activeView === "my-knots" && (
                      <button
                        onClick={() => setIsNewKnotModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                      >
                        <Plus size={14} />
                        Create First Knot
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Trends & Stats (Desktop Only) */}
        <aside className="hidden lg:flex w-56 flex-col gap-6 z-10">
          <div className="glass p-5 rounded-2xl flex flex-col gap-4 text-xs">
            <div className="flex justify-between items-center mb-1">
              <p className="uppercase font-black tracking-widest text-slate-500 text-[10px]">
                Categories
              </p>
              {selectedCategory !== "All" && (
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-tighter transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {(["Tech", "General", "Nature", "News", "Q&A"] as const).map(
              (cat) => (
                <div
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? "All" : cat)
                  }
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <span
                    className={`font-bold transition-colors ${
                      selectedCategory === cat
                        ? "text-indigo-400"
                        : "text-slate-300 group-hover:text-indigo-200"
                    }`}
                  >
                    {cat}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                      selectedCategory === cat
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {posts.filter((p) => p.category === cat).length} posts
                  </span>
                </div>
              ),
            )}
          </div>

          <div className="p-5 border border-indigo-500/30 rounded-2xl bg-indigo-500/5 backdrop-blur-sm flex flex-col gap-4">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              Forum Stats
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                  Users
                </span>
                <span className="text-xl font-black text-white italic">
                  {formatCompactCount(forumStats.users)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                  Knots
                </span>
                <span className="text-xl font-black text-white italic">
                  {formatCompactCount(forumStats.posts)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                  Likes
                </span>
                <span className="text-xl font-black text-white italic">
                  {formatCompactCount(forumStats.likes)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                  Comments
                </span>
                <span className="text-xl font-black text-white italic">
                  {formatCompactCount(forumStats.comments)}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm glass rounded-3xl px-2 py-2 border border-white/10 z-40 flex items-center shadow-2xl">
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setActiveView("feed")}
              className={`flex flex-col items-center gap-1 transition-all py-1 ${
                activeView === "feed" ? "text-indigo-400" : "text-slate-500"
              }`}
            >
              <Compass size={20} />
              <span className="text-[8px] font-black uppercase tracking-widest">
                Feed
              </span>
            </button>
          </div>

          <div className="flex-shrink-0 -mt-12">
            <button
              onClick={() => setIsNewKnotModalOpen(true)}
              className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white border-4 border-[#0F172A] shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-90 transition-all"
            >
              <Plus size={28} />
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setActiveView("my-knots")}
              className={`flex flex-col items-center gap-1 transition-all py-1 ${
                activeView === "my-knots" ? "text-indigo-400" : "text-slate-500"
              }`}
            >
              <UserIcon size={20} />
              <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                My knots
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* New Knot Modal */}
      <AnimatePresence>
        {isNewKnotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isCreatingPost) {
                  setIsNewKnotModalOpen(false);
                }
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">
                    Create New Knot
                  </h3>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    Share your thoughts with the community
                  </p>
                </div>
                <button
                  onClick={() => setIsNewKnotModalOpen(false)}
                  disabled={isCreatingPost}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-black mb-2">
                    Content
                  </label>
                  <textarea
                    value={newKnotContent}
                    onChange={(e) => setNewKnotContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all h-32 resize-none"
                  />
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-2">
                    Category is assigned automatically by AI.
                  </p>
                </div>

                <button
                  onClick={handleCreatePost}
                  disabled={!newKnotContent.trim() || isCreatingPost}
                  className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  {isCreatingPost ? "Thinking..." : "Post Knot"}
                </button>
                {isCreatingPost && (
                  <p className="text-center text-[10px] uppercase tracking-widest text-indigo-300 animate-pulse">
                    Thinking... categorizing your post
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
