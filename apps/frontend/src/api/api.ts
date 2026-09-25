import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
const HOBBIES_URL = BASE_URL.replace(/\/users$/, "/hobbies");
const POSTS_URL = BASE_URL.replace(/\/users$/, "/posts");
const FEED_URL = BASE_URL.replace(/\/users$/, "/feed");
const NOTIFICATIONS_URL = BASE_URL.replace(/\/users$/, "/notifications");
const SEARCH_URL = BASE_URL.replace(/\/users$/, "/search");
const CONVERSATIONS_URL = BASE_URL.replace(/\/users$/, "/conversations");
const EVENTS_URL = BASE_URL.replace(/\/users$/, "/events");

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
  /** Your role in this hive (only on your own hobbies). */
  role?: "MEMBER" | "MODERATOR";
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
  isModerator?: boolean;
  moderators?: FollowUser[];
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
  isSaved?: boolean;
  /** All photos (up to 4). `imageUrl` is the first one. */
  images?: string[];
  pinnedAt?: string | null;
  challenge?: { id: string; title: string; endsAt: string } | null;
  progressLog?: { id: string; title: string } | null;
  /** The viewer moderates this post's hive (can pin / remove it). */
  canModerate?: boolean;
  /** The viewer wrote this post. */
  isOwn?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  prompt: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  hobby: Hobby;
  creator: FollowUser;
  entryCount: number;
  isActive: boolean;
}

export interface HobbyChallenges {
  active: Challenge | null;
  past: Challenge[];
}

export interface ProgressLogSummary {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  hobby: Hobby;
  user: FollowUser;
  entryCount: number;
  lastEntryAt: string | null;
  coverImageUrl: string | null;
}

export interface ProgressLogDetail extends ProgressLogSummary {
  entries: Post[];
}

export interface CreatePostOptions {
  images?: string[];
  challengeId?: string | null;
  progressLogId?: string | null;
}

export interface SaveResult {
  isSaved: boolean;
  collectionId: string | null;
}

export interface SavedCollection {
  id: string;
  name: string;
  createdAt: string;
  count: number;
  coverImageUrl: string | null;
}

export interface SavedCollectionsSummary {
  totalSaved: number;
  collections: SavedCollection[];
}

export interface Comment {
  id: string;
  content: string;
  /** Set on replies — always the id of a top-level comment (threads are one level deep). */
  parentId?: string | null;
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

export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW" | "NEW_POST" | "MENTION" | "REPLY";

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

export interface HobbyRoomMessage {
  id: string;
  content: string;
  createdAt: string;
  author: FollowUser;
}

export interface HobbyRoomMessagePage {
  messages: HobbyRoomMessage[];
  nextCursor: string | null;
}

export interface HobbyEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  createdAt: string;
  creator: FollowUser;
  attendeeCount: number;
  isAttending: boolean;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
}

export interface RsvpResult {
  isAttending: boolean;
  attendeeCount: number;
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

export const getHobbyRoomMessages = async (
  slug: string,
  cursor?: string | null
): Promise<HobbyRoomMessagePage> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${HOBBIES_URL}/${slug}/room/messages`, {
      params: cursor ? { cursor } : undefined,
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load room messages");
    throw new Error(message);
  }
};

export const getHobbyEvents = async (slug: string): Promise<HobbyEvent[]> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${HOBBIES_URL}/${slug}/events`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load events");
    throw new Error(message);
  }
};

export const createEvent = async (slug: string, payload: CreateEventPayload): Promise<HobbyEvent> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(`${HOBBIES_URL}/${slug}/events`, payload, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to create event");
    throw new Error(message);
  }
};

export const rsvpToEvent = async (eventId: string): Promise<RsvpResult> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      `${EVENTS_URL}/${eventId}/rsvp`,
      {},
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to RSVP");
    throw new Error(message);
  }
};

export const cancelRsvp = async (eventId: string): Promise<RsvpResult> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.delete(`${EVENTS_URL}/${eventId}/rsvp`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to cancel RSVP");
    throw new Error(message);
  }
};

export const getEventAttendees = async (eventId: string): Promise<FollowUser[]> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${EVENTS_URL}/${eventId}/attendees`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load attendees");
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

export interface ExploreFeedOptions {
  cursor?: string | null;
  /** Narrow to one hobby by slug. */
  hobby?: string | null;
  /** Only posts with an image (the photo grid). */
  media?: boolean;
  limit?: number;
}

/** Posts from every hobby, newest first — discovery beyond the hives you've joined. */
export const getExploreFeed = async ({ cursor, hobby, media, limit }: ExploreFeedOptions = {}): Promise<FeedPage> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${FEED_URL}/explore`, {
      params: {
        ...(cursor ? { cursor } : {}),
        ...(hobby ? { hobby } : {}),
        ...(media ? { media: 1 } : {}),
        ...(limit ? { limit } : {}),
      },
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load posts");
    throw new Error(message);
  }
};

export const createPost = async (content: string, hobbyId: string, options: CreatePostOptions = {}): Promise<Post> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      POSTS_URL,
      { content, hobbyId, ...options },
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

export const uploadPostImage = async (file: File): Promise<{ url: string }> => {
  try {
    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("image", file);
    const response = await axios.post(`${POSTS_URL}/upload-image`, formData, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to upload image");
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

export const addComment = async (postId: string, content: string, parentId?: string | null): Promise<Comment> => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      `${POSTS_URL}/${postId}/comments`,
      { content, ...(parentId ? { parentId } : {}) },
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

const SAVED_URL = BASE_URL.replace(/\/users$/, "/saved");

function authConfig(params?: Record<string, unknown>) {
  const token = localStorage.getItem("authToken");
  return {
    params,
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };
}

async function request<T>(run: () => Promise<{ data: { data: T } }>, fallbackMessage: string): Promise<T> {
  try {
    return (await run()).data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, fallbackMessage));
  }
}

/** A single post — used for notification links and shared /posts/:id URLs. */
export const getPost = (postId: string) =>
  request<Post>(() => axios.get(`${POSTS_URL}/${postId}`, authConfig()), "Failed to load this post");

/** Everything a user has posted, newest first; `media` for just their photos. */
export const getUserPosts = (username: string, { cursor, media }: { cursor?: string | null; media?: boolean } = {}) =>
  request<FeedPage>(
    () =>
      axios.get(
        `${BASE_URL}/${encodeURIComponent(username)}/posts`,
        authConfig({ ...(cursor ? { cursor } : {}), ...(media ? { media: 1 } : {}), limit: media ? 21 : 10 })
      ),
    "Failed to load posts"
  );

/** Save a post, or move an already-saved post into another collection (null = no collection). */
export const savePost = (postId: string, collectionId: string | null = null) =>
  request<SaveResult>(() => axios.put(`${POSTS_URL}/${postId}/save`, { collectionId }, authConfig()), "Failed to save post");

export const unsavePost = (postId: string) =>
  request<SaveResult>(() => axios.delete(`${POSTS_URL}/${postId}/save`, authConfig()), "Failed to unsave post");

export const getSavedPosts = ({ cursor, collectionId }: { cursor?: string | null; collectionId?: string | null } = {}) =>
  request<FeedPage>(
    () => axios.get(SAVED_URL, authConfig({ ...(cursor ? { cursor } : {}), ...(collectionId ? { collection: collectionId } : {}) })),
    "Failed to load saved posts"
  );

export const getCollections = () =>
  request<SavedCollectionsSummary>(() => axios.get(`${SAVED_URL}/collections`, authConfig()), "Failed to load collections");

export const createCollection = (name: string) =>
  request<SavedCollection>(() => axios.post(`${SAVED_URL}/collections`, { name }, authConfig()), "Failed to create collection");

export const renameCollection = (collectionId: string, name: string) =>
  request<Pick<SavedCollection, "id" | "name">>(
    () => axios.patch(`${SAVED_URL}/collections/${collectionId}`, { name }, authConfig()),
    "Failed to rename collection"
  );

export const deleteCollection = (collectionId: string) =>
  request<Record<string, never>>(() => axios.delete(`${SAVED_URL}/collections/${collectionId}`, authConfig()), "Failed to delete collection");

const CHALLENGES_URL = BASE_URL.replace(/\/users$/, "/challenges");
const PROGRESS_URL = BASE_URL.replace(/\/users$/, "/progress");

export const deletePost = (postId: string) =>
  request<Record<string, never>>(() => axios.delete(`${POSTS_URL}/${postId}`, authConfig()), "Failed to delete post");

export const pinPost = (postId: string) =>
  request<{ isPinned: boolean }>(() => axios.post(`${POSTS_URL}/${postId}/pin`, {}, authConfig()), "Failed to pin post");

export const unpinPost = (postId: string) =>
  request<{ isPinned: boolean }>(() => axios.delete(`${POSTS_URL}/${postId}/pin`, authConfig()), "Failed to unpin post");

export const getHobbyPinnedPosts = (slug: string) =>
  request<Post[]>(() => axios.get(`${HOBBIES_URL}/${slug}/pinned`, authConfig()), "Failed to load pinned posts");

export const getHobbyChallenges = (slug: string) =>
  request<HobbyChallenges>(() => axios.get(`${HOBBIES_URL}/${slug}/challenges`, authConfig()), "Failed to load challenges");

export const createChallenge = (slug: string, payload: { title: string; prompt: string; days?: number }) =>
  request<Challenge>(() => axios.post(`${HOBBIES_URL}/${slug}/challenges`, payload, authConfig()), "Failed to start challenge");

export const getChallenge = (challengeId: string) =>
  request<Challenge>(() => axios.get(`${CHALLENGES_URL}/${challengeId}`, authConfig()), "Failed to load challenge");

export const getChallengeEntries = (challengeId: string, { sort, cursor }: { sort?: "top" | "new"; cursor?: string | null } = {}) =>
  request<FeedPage>(
    () => axios.get(`${CHALLENGES_URL}/${challengeId}/entries`, authConfig({ ...(sort === "top" ? { sort } : {}), ...(cursor ? { cursor } : {}) })),
    "Failed to load entries"
  );

export const getUserProgressLogs = (username: string, hobbyId?: string) =>
  request<ProgressLogSummary[]>(
    () => axios.get(`${BASE_URL}/${encodeURIComponent(username)}/progress`, authConfig(hobbyId ? { hobby: hobbyId } : undefined)),
    "Failed to load progress logs"
  );

export const createProgressLog = (payload: { title: string; hobbyId: string; description?: string }) =>
  request<ProgressLogSummary>(() => axios.post(PROGRESS_URL, payload, authConfig()), "Failed to create progress log");

export const getProgressLog = (logId: string) =>
  request<ProgressLogDetail>(() => axios.get(`${PROGRESS_URL}/${logId}`, authConfig()), "Failed to load progress log");

export const updateProgressLog = (logId: string, payload: { title?: string; description?: string | null }) =>
  request<ProgressLogSummary>(() => axios.patch(`${PROGRESS_URL}/${logId}`, payload, authConfig()), "Failed to update progress log");

export const deleteProgressLog = (logId: string) =>
  request<Record<string, never>>(() => axios.delete(`${PROGRESS_URL}/${logId}`, authConfig()), "Failed to delete progress log");

// --- Topic model (apps/ml via the backend). Every call degrades to "unavailable" if the ML service is down.

export interface HiveSuggestion {
  available: boolean;
  verdict: "too_short" | "unavailable" | "fits" | "other_hive" | "no_hive";
  suggestion: { id: string; name: string; slug: string; icon: string | null; confidence: number } | null;
}

export interface FlaggedPost {
  post: Post;
  flaggedAt: string;
  hiveScore: number | null;
  looksLike: string | null;
}

const ML_URL = BASE_URL.replace(/\/users$/, "/ml");

/** Does this draft look like it belongs in a different hive (or none)? */
export const suggestHive = (text: string, hobbyId: string) =>
  request<HiveSuggestion>(() => axios.post(`${ML_URL}/suggest-hive`, { text, hobbyId }, authConfig()), "Failed to check the draft");

/** Search by meaning (hybrid: embedding similarity + topic model). */
export const semanticSearch = (q: string) =>
  request<{ available: boolean; posts: Post[] }>(() => axios.get(`${SEARCH_URL}/semantic`, authConfig({ q })), "Failed to search");

export const getSimilarPosts = (postId: string) =>
  request<Post[]>(() => axios.get(`${POSTS_URL}/${postId}/similar`, authConfig()), "Failed to load similar posts");

/** Moderators: posts the model flagged as off-topic for this hive. */
export const getFlaggedPosts = (slug: string) =>
  request<FlaggedPost[]>(() => axios.get(`${HOBBIES_URL}/${slug}/flagged`, authConfig()), "Failed to load flagged posts");

export const dismissFlag = (postId: string) =>
  request<Record<string, never>>(() => axios.post(`${POSTS_URL}/${postId}/flag/dismiss`, {}, authConfig()), "Failed to dismiss flag");
