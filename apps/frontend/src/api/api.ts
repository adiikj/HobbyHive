import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
const HOBBIES_URL = BASE_URL.replace(/\/users$/, "/hobbies");
const POSTS_URL = BASE_URL.replace(/\/users$/, "/posts");
const FEED_URL = BASE_URL.replace(/\/users$/, "/feed");
const NOTIFICATIONS_URL = BASE_URL.replace(/\/users$/, "/notifications");
const SEARCH_URL = BASE_URL.replace(/\/users$/, "/search");
const CONVERSATIONS_URL = BASE_URL.replace(/\/users$/, "/conversations");

interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface Hobby {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  membersCount?: number;
  postsCount?: number;
}

export interface TrendingHobby {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  postCount: number;
}

export interface HobbyDetail {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  membersCount: number;
  postsCount: number;
  isMember: boolean;
}

export interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  hobby: Hobby;
  author: { id: string; name: string; username: string; avatarUrl: string | null };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; username: string; avatarUrl: string | null };
}

export interface LikeResult {
  isLiked: boolean;
  likesCount: number;
}

export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
}

export interface Profile {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  hobbies: Hobby[];
  followersCount: number;
  followingCount: number;
}

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

export type FollowRelationship = "NONE" | "REQUESTED" | "FOLLOWING" | "INCOMING_REQUEST" | "SELF";

export interface FollowUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

export interface FollowRequest {
  id: string;
  createdAt: string;
  follower: FollowUser;
}

export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW" | "NEW_POST";

export interface Notification {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actor: FollowUser | null;
  post: { id: string; content: string; hobby: Hobby } | null;
}

export interface NotificationPage {
  notifications: Notification[];
  nextCursor: string | null;
}

export interface SearchResults {
  users: FollowUser[];
  hobbies: Hobby[];
  posts: Post[];
}

export interface DirectMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: FollowUser;
}

export interface MessagePage {
  messages: DirectMessage[];
  nextCursor: string | null;
}

export interface ConversationSummary {
  id: string;
  otherUser: FollowUser | null;
  lastMessage: DirectMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export const loginUser = async (emailOrUsername: string, password: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/login`,
      { emailOrUsername, password },
      { withCredentials: true }
    );

    return response.data;
  } catch (error) {
    const message = getErrorMessage(error, "An unexpected error occurred while logging in");
    throw new Error(message);
  }
};

export const registerUser = async ({ name, username, email, password }: RegisterPayload) => {
  try {
    const response = await axios.post(`${BASE_URL}/register`, { name, username, email, password });
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error, "Error registering user.");
    throw new Error(message);
  }
};

export const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/verify-otp`,
      { email, otp },
      { withCredentials: true }
    );

    return response.data;
  } catch (error) {
    const message = getErrorMessage(error, "Error verifying OTP");
    throw new Error(message);
  }
};

export const logoutUser = async (token: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    const message = getErrorMessage(error, "Error logging out");
    throw new Error(message);
  }
};

export const getUserProfile = async (): Promise<Profile> => {
  try {
    const token = localStorage.getItem("authToken");

    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_URL}/profile`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch user profile");
    throw new Error(message);
  }
};

export const getPublicProfile = async (username: string): Promise<Profile> => {
  try {
    const response = await axios.get(`${BASE_URL}/${username}`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch profile");
    throw new Error(message);
  }
};

export const updateProfile = async (username: string, payload: UpdateProfilePayload): Promise<Profile> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.patch(`${BASE_URL}/${username}`, payload, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to update profile");
    throw new Error(message);
  }
};

export const getHobbies = async (): Promise<Hobby[]> => {
  try {
    const response = await axios.get(HOBBIES_URL);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch hobbies");
    throw new Error(message);
  }
};

export const getMyHobbies = async (): Promise<Hobby[]> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${BASE_URL}/me/hobbies`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch your hobbies");
    throw new Error(message);
  }
};

export const setMyHobbies = async (hobbyIds: string[]): Promise<Hobby[]> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      `${BASE_URL}/me/hobbies`,
      { hobbyIds },
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to save your hobbies");
    throw new Error(message);
  }
};

export const addMyHobby = async (hobbyId: string): Promise<Hobby> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      `${BASE_URL}/me/hobbies/${hobbyId}`,
      {},
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to join hobby");
    throw new Error(message);
  }
};

export const leaveHobby = async (hobbyId: string): Promise<void> => {
  try {
    const token = localStorage.getItem("authToken");
    await axios.delete(`${BASE_URL}/me/hobbies/${hobbyId}`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch (error) {
    const message = getErrorMessage(error, "Failed to leave hobby");
    throw new Error(message);
  }
};

export const getHobbyBySlug = async (slug: string): Promise<HobbyDetail> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${HOBBIES_URL}/${slug}`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load hobby");
    throw new Error(message);
  }
};

export const getHobbyPosts = async (slug: string, cursor?: string | null): Promise<FeedPage> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${HOBBIES_URL}/${slug}/posts`, {
      params: cursor ? { cursor } : undefined,
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load hobby posts");
    throw new Error(message);
  }
};

export const getTrendingHobbies = async (): Promise<TrendingHobby[]> => {
  try {
    const response = await axios.get(`${HOBBIES_URL}/trending`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load trending hobbies");
    throw new Error(message);
  }
};

export const search = async (q: string): Promise<SearchResults> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(SEARCH_URL, {
      params: { q },
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Search failed");
    throw new Error(message);
  }
};

export const getFeed = async (cursor?: string | null): Promise<FeedPage> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(FEED_URL, {
      params: cursor ? { cursor } : undefined,
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load your feed");
    throw new Error(message);
  }
};

export const getFollowingFeed = async (cursor?: string | null): Promise<FeedPage> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${FEED_URL}/following`, {
      params: cursor ? { cursor } : undefined,
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load your following feed");
    throw new Error(message);
  }
};

export const createPost = async (content: string, hobbyId: string): Promise<Post> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      POSTS_URL,
      { content, hobbyId },
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to create post");
    throw new Error(message);
  }
};

export const likePost = async (postId: string): Promise<LikeResult> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      `${POSTS_URL}/${postId}/like`,
      {},
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to like post");
    throw new Error(message);
  }
};

export const unlikePost = async (postId: string): Promise<LikeResult> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.delete(`${POSTS_URL}/${postId}/like`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to unlike post");
    throw new Error(message);
  }
};

export const getComments = async (postId: string): Promise<Comment[]> => {
  try {
    const response = await axios.get(`${POSTS_URL}/${postId}/comments`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load comments");
    throw new Error(message);
  }
};

export const addComment = async (postId: string, content: string): Promise<Comment> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      `${POSTS_URL}/${postId}/comments`,
      { content },
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to add comment");
    throw new Error(message);
  }
};

export const getFollowStatus = async (username: string): Promise<FollowRelationship> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${BASE_URL}/${username}/follow-status`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data.status;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch follow status");
    throw new Error(message);
  }
};

export const followUser = async (username: string): Promise<FollowRelationship> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      `${BASE_URL}/${username}/follow`,
      {},
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return response.data.data.status === "ACCEPTED" ? "FOLLOWING" : "REQUESTED";
  } catch (error) {
    const message = getErrorMessage(error, "Failed to follow user");
    throw new Error(message);
  }
};

export const unfollowUser = async (username: string): Promise<void> => {
  try {
    const token = localStorage.getItem("authToken");
    await axios.delete(`${BASE_URL}/${username}/follow`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch (error) {
    const message = getErrorMessage(error, "Failed to unfollow user");
    throw new Error(message);
  }
};

export const acceptFollowRequest = async (username: string): Promise<void> => {
  try {
    const token = localStorage.getItem("authToken");
    await axios.post(
      `${BASE_URL}/${username}/follow/accept`,
      {},
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
  } catch (error) {
    const message = getErrorMessage(error, "Failed to accept follow request");
    throw new Error(message);
  }
};

export const rejectFollowRequest = async (username: string): Promise<void> => {
  try {
    const token = localStorage.getItem("authToken");
    await axios.post(
      `${BASE_URL}/${username}/follow/reject`,
      {},
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
  } catch (error) {
    const message = getErrorMessage(error, "Failed to reject follow request");
    throw new Error(message);
  }
};

export const getMyFollowRequests = async (): Promise<FollowRequest[]> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${BASE_URL}/me/follow-requests`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load follow requests");
    throw new Error(message);
  }
};

export const getFollowers = async (username: string): Promise<FollowUser[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/${username}/followers`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load followers");
    throw new Error(message);
  }
};

export const getFollowingUsers = async (username: string): Promise<FollowUser[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/${username}/following`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load following");
    throw new Error(message);
  }
};

export const getNotifications = async (cursor?: string | null): Promise<NotificationPage> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(NOTIFICATIONS_URL, {
      params: cursor ? { cursor } : undefined,
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load notifications");
    throw new Error(message);
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${NOTIFICATIONS_URL}/unread-count`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data.count;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load unread notification count");
    throw new Error(message);
  }
};

export const markAllNotificationsRead = async (): Promise<void> => {
  try {
    const token = localStorage.getItem("authToken");
    await axios.post(
      `${NOTIFICATIONS_URL}/read-all`,
      {},
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
  } catch (error) {
    const message = getErrorMessage(error, "Failed to mark notifications as read");
    throw new Error(message);
  }
};

export const getOrCreateConversation = async (username: string): Promise<{ id: string }> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      CONVERSATIONS_URL,
      { username },
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to start conversation");
    throw new Error(message);
  }
};

export const listConversations = async (): Promise<ConversationSummary[]> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(CONVERSATIONS_URL, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load conversations");
    throw new Error(message);
  }
};

export const getMessages = async (conversationId: string, cursor?: string | null): Promise<MessagePage> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${CONVERSATIONS_URL}/${conversationId}/messages`, {
      params: cursor ? { cursor } : undefined,
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load messages");
    throw new Error(message);
  }
};

export const sendMessage = async (conversationId: string, content: string): Promise<DirectMessage> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      `${CONVERSATIONS_URL}/${conversationId}/messages`,
      { content },
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to send message");
    throw new Error(message);
  }
};

export const markConversationRead = async (conversationId: string): Promise<void> => {
  try {
    const token = localStorage.getItem("authToken");
    await axios.post(
      `${CONVERSATIONS_URL}/${conversationId}/read`,
      {},
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
  } catch (error) {
    const message = getErrorMessage(error, "Failed to mark conversation as read");
    throw new Error(message);
  }
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
