"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import { Bell, MessageCircle, Plus, Users, LogOut, Home, User, Settings, HelpCircle } from "lucide-react";
import { logout } from "@/redux/authSlice";
import {
  getFeed,
  getFollowingFeed,
  getHobbies,
  getMyHobbies,
  createPost,
  getUserProfile,
  type Post,
  type Hobby,
  type Profile,
} from "@/api/api";
import PostCard from "./PostCard";
import NotificationBell from "./NotificationBell";

type FeedTab = "hobbies" | "following";

function Dashboard() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [me, setMe] = useState<Profile | null>(null);

  const [feedTab, setFeedTab] = useState<FeedTab>("hobbies");
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState("");

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [myHobbies, setMyHobbies] = useState<Hobby[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostHobbyId, setNewPostHobbyId] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    setIsLoadingFeed(true);
    setFeedError("");

    const fetchPage = feedTab === "hobbies" ? getFeed() : getFollowingFeed();

    fetchPage
      .then((page) => {
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      })
      .catch((err) => setFeedError(err instanceof Error ? err.message : "Failed to load your feed"))
      .finally(() => setIsLoadingFeed(false));
  }, [feedTab]);

  useEffect(() => {
    getHobbies().then(setHobbies).catch(() => undefined);
    getMyHobbies().then(setMyHobbies).catch(() => undefined);
    getUserProfile().then(setMe).catch(() => undefined);
  }, []);

  const goToMyProfile = () => {
    if (me) router.push(`/profile/${me.username}`);
  };

  const handleLogout = () => {
    Cookies.remove("accessToken");
    dispatch(logout());
    window.location.href = "/";
  };

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const page = feedTab === "hobbies" ? await getFeed(nextCursor) : await getFollowingFeed(nextCursor);
      setPosts((prev) => [...prev, ...page.posts]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : "Failed to load more posts");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !newPostHobbyId) return;

    setPostError("");
    setIsPosting(true);
    try {
      const post = await createPost(newPostContent, newPostHobbyId);
      if (feedTab === "hobbies") {
        setPosts((prev) => [post, ...prev]);
      }
      setNewPostContent("");
      setNewPostHobbyId("");
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const stories = [
    { id: 1, img: "/images/1.png", name: "John Doe" },
    { id: 2, img: "/images/2.png", name: "Jane Smith" },
    { id: 3, img: "/images/3.png", name: "Alex Carter" },
    { id: 4, img: "/images/4.png", name: "Emily Johnson" },
  ];

  const trendingTopics = [
    "Photography Tips ",
    "Top Gaming Strategies ",
    "Healthy Recipes ",
    "Coding Challenges ",
    "Best Travel Destinations ",
  ];

  const hobbiesEmptyMessage =
    myHobbies.length === 1
      ? `Be the first to post about ${myHobbies[0].name}.`
      : myHobbies.length > 1
      ? `Be the first to post in ${myHobbies.map((h) => h.name).join(", ")}.`
      : "Pick a hobby to start seeing posts here.";

  const emptyStateMessage =
    feedTab === "hobbies" ? hobbiesEmptyMessage : "Follow people to see their posts here.";

  return (
    <div className="min-h-screen lg:flex bg-gradient-to-r from-somig to-beige font-pop">
      {/* Left Sidebar: desktop only, collapses to a bottom nav bar on mobile */}
      <aside className="hidden lg:flex w-60 p-6 flex-col justify-between bg-white rounded-lg shadow-md fixed top-0 left-0 h-full">
        <div>
          <h1 className="text-pink-600 font-bnt font-bold text-5xl mb-6">HOBBYHIVE</h1>
          <nav className="space-y-3">
            <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full">
              <Home size={22} /> Home
            </button>
            <button
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full"
              onClick={() => setFeedTab("following")}
            >
              <Users size={22} /> Friends
            </button>
            <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full">
              <Bell size={22} /> Notifications
            </button>
            <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full">
              <MessageCircle size={22} /> Messages
            </button>
            <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full" onClick={goToMyProfile}>
              <User size={22} /> Profile
            </button>
            <button
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full"
              onClick={() => router.push("/settings/hobbies")}
            >
              <Settings size={22} /> Settings
            </button>
            <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full">
              <HelpCircle size={22} /> Help
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-lg bg-red-600 hover:bg-red-700 w-full text-white mt-6"
        >
          <LogOut size={22} /> Logout
        </button>
      </aside>

      {/* Center Section */}
      <div className="relative flex-1 p-4 sm:p-6 pt-6 lg:pt-24 pb-24 lg:pb-6 overflow-y-auto lg:ml-64 xl:mr-80">
        <header className="w-full flex justify-between items-center p-4 bg-white rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold">{me ? `Welcome, ${me.name}!` : "Welcome!"}</h2>
          <div className="flex items-center gap-4">
            <NotificationBell />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={me?.avatarUrl || "/images/5.png"}
              alt="User"
              onClick={goToMyProfile}
              className="w-10 h-10 rounded-full border border-gray-400 cursor-pointer object-cover"
            />
          </div>
        </header>

        {/* Stories Section */}
        <div className="mt-6 flex gap-4 overflow-x-auto overflow-y-hidden">
          <div className="w-20 h-20 flex flex-col items-center cursor-pointer">
            <div className="w-16 h-16 rounded-full border-4 border-gray-300 flex items-center justify-center">
              <Plus size={32} />
            </div>
            <p className="text-xs mt-1">Your Story</p>
          </div>
          {stories.map((story) => (
            <motion.div
              key={story.id}
              className="w-20 h-20 flex flex-col items-center cursor-pointer"
              whileHover={{ scale: 1.1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.img} alt={story.name} className="w-16 h-16 rounded-full border-4 border-pink-500" />
              <p className="text-xs mt-1">{story.name}</p>
            </motion.div>
          ))}
        </div>

        {/* Create Post Section */}
        <div className="p-4 sm:p-5 mt-6 bg-white rounded-xl shadow-md">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={me?.avatarUrl || "/images/5.png"} alt="User" className="w-10 h-10 rounded-full shrink-0 object-cover" />
            <input
              type="text"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share something interesting..."
              className="flex-1 min-w-0 p-3 rounded-full outline-none border border-gray-300"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <select
              value={newPostHobbyId}
              onChange={(e) => setNewPostHobbyId(e.target.value)}
              className="p-2 rounded-lg border border-gray-300 text-sm bg-white"
            >
              <option value="">Choose a hobby</option>
              {hobbies.map((hobby) => (
                <option key={hobby.id} value={hobby.id}>
                  {hobby.icon ?? ""} {hobby.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreatePost}
              disabled={isPosting || !newPostContent.trim() || !newPostHobbyId}
              className="bg-pink-500 px-5 sm:px-12 py-2 rounded-full text-white shrink-0 disabled:opacity-50"
            >
              {isPosting ? "Posting..." : "Post"}
            </button>
          </div>
          {postError && <p className="text-red-600 text-sm mt-2">{postError}</p>}
        </div>

        {/* Feed Tabs: hobby-scoped feed stays separate from the following feed, never merged */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setFeedTab("hobbies")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              feedTab === "hobbies" ? "bg-pink-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            My Hobbies
          </button>
          <button
            onClick={() => setFeedTab("following")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              feedTab === "following" ? "bg-pink-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Following
          </button>
        </div>

        {/* Feed Section */}
        <div className="space-y-6 mt-6">
          {isLoadingFeed ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-t-2 border-pink-600 rounded-full animate-spin" />
            </div>
          ) : feedError ? (
            <p className="text-center text-red-600 bg-white rounded-xl shadow-md p-5">{feedError}</p>
          ) : posts.length === 0 ? (
            <div className="text-center bg-white rounded-xl shadow-md p-8">
              <p className="font-semibold text-lg">Your feed is quiet right now.</p>
              <p className="text-gray-600 mt-1">{emptyStateMessage}</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {nextCursor && (
                <div className="flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2 rounded-full bg-white shadow-md text-pink-600 font-semibold disabled:opacity-50"
                  >
                    {isLoadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Trending Topics: inline on mobile/tablet, moves into the fixed right sidebar at xl */}
        <div className="xl:hidden mt-6 p-5 rounded-xl bg-white shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-pink-600">Trending Topics</h3>
          <ul className="space-y-3">
            {trendingTopics.map((topic, index) => (
              <li
                key={index}
                className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all duration-200 ease-in-out border border-transparent hover:border-gray-300"
              >
                <span className="text-sm font-medium text-gray-700">{topic}</span>
                <button className="text-xs text-pink-500 hover:text-pink-700">Explore</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Sidebar (Trending): xl and up only */}
      <div className="hidden xl:block w-80 p-6 ml-6 rounded-xl bg-white shadow-xl pt-20 fixed top-0 right-0 h-full overflow-y-auto">
        <h3 className="text-2xl font-semibold mb-6 text-pink-600 text-center border-b-2 pb-4">Trending Topics</h3>
        <ul className="space-y-6">
          {trendingTopics.map((topic, index) => (
            <li
              key={index}
              className="flex justify-between items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all duration-200 ease-in-out border border-transparent hover:border-gray-300"
            >
              <span className="text-sm font-medium text-gray-700">{topic}</span>
              <button className="text-xs text-pink-500 hover:text-pink-700">Explore</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile bottom nav: replaces the left sidebar below lg */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white border-t border-gray-200 px-2 py-3">
        <button aria-label="Home" className="text-pink-600">
          <Home size={22} />
        </button>
        <button aria-label="Friends" className="text-gray-500 hover:text-black" onClick={() => setFeedTab("following")}>
          <Users size={22} />
        </button>
        <NotificationBell size={22} iconClassName="text-gray-500 hover:text-black" />
        <button aria-label="Messages" className="text-gray-500 hover:text-black">
          <MessageCircle size={22} />
        </button>
        <button aria-label="Profile" className="text-gray-500 hover:text-black" onClick={goToMyProfile}>
          <User size={22} />
        </button>
        <button aria-label="Logout" className="text-red-600" onClick={handleLogout}>
          <LogOut size={22} />
        </button>
      </nav>
    </div>
  );
}

export default Dashboard;
