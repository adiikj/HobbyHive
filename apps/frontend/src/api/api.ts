import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
const HOBBIES_URL = BASE_URL.replace(/\/users$/, "/hobbies");
const POSTS_URL = BASE_URL.replace(/\/users$/, "/posts");
const PRACTICE_URL = BASE_URL.replace(/\/users$/, "/practice");
const SKILLS_URL = BASE_URL.replace(/\/users$/, "/skills");
const GOALS_URL = BASE_URL.replace(/\/users$/, "/goals");
const FEEDBACK_URL = BASE_URL.replace(/\/users$/, "/feedback");
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
  /** The viewer can add this post to its hive's guide (moderator, or Mentor level in the hive). */
  canCurate?: boolean;
  /** The viewer wrote this post. */
  isOwn?: boolean;
  /** Set when the author asked for feedback: their specific question. */
  feedbackAsk?: string | null;
  feedbackCount?: number;
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
  /** Ask the hive for feedback on something specific. */
  feedbackAsk?: string | null;
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

export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW" | "NEW_POST" | "MENTION" | "REPLY" | "FEEDBACK" | "FEEDBACK_HELPFUL";

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
    const message = getErrorMessage(error, "We couldn't create your account. Please try again.");
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
    const message = getErrorMessage(error, "We couldn't check that code. Please try again.");
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
    const message = getErrorMessage(error, "We couldn't sign you out. Please try again.");
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

// Server/library wording that shouldn't reach people ("Request failed with status code 500", Prisma, stack traces…)
const TECHNICAL = /internal server error|status code|prisma|invocation|stack|econn|etimedout|network error|typeerror|syntaxerror|referenceerror|unexpected token|undefined|cannot (read|get|post)|failed to fetch/i;
const isFriendly = (message: unknown): message is string =>
  typeof message === "string" && message.trim().length > 0 && message.length <= 200 && !TECHNICAL.test(message);

const STATUS_MESSAGES: Record<number, string> = {
  401: "Please sign in again to continue.",
  403: "You don't have permission to do that.",
  404: "We couldn't find that. It may have been removed.",
  408: "That took too long. Please try again.",
  413: "That's too large to upload. Please try something smaller.",
  429: "You're going a bit fast. Please wait a moment and try again.",
};
export const SERVER_ERROR_MESSAGE = "Something went wrong on our side. Please try again in a moment.";

/** A message a person can act on, whatever went wrong: offline, timeouts, 4xx, 5xx or a crash. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
        ? "That took too long. Please check your connection and try again."
        : "Can't reach HobbyHive right now. Please check your connection and try again.";
    }
    const { status } = error.response;
    const serverMessage = (error.response.data as { message?: unknown } | undefined)?.message;
    // The API writes its own messages for people; only fall back when there's none or it's technical
    if (isFriendly(serverMessage) && status < 500) return serverMessage;
    if (status >= 500) return isFriendly(serverMessage) && status !== 500 ? serverMessage : SERVER_ERROR_MESSAGE;
    return STATUS_MESSAGES[status] ?? (isFriendly(fallback) ? fallback : SERVER_ERROR_MESSAGE);
  }
  if (error instanceof Error && isFriendly(error.message)) return error.message;
  return isFriendly(fallback) ? fallback : SERVER_ERROR_MESSAGE;
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

// --- Ask Bea (local RAG over the hive's posts and comments; every answer carries its evidence and a trace)

export interface BeaEvidence {
  chunk_id: string;
  kind: "post" | "comment";
  post_id: string;
  comment_id: string | null;
  author_name: string;
  author_username: string;
  text: string;
  created_at: string;
  post: Post | null;
}

export interface BeaCandidate {
  text: string;
  author: string;
  kind: "post" | "comment";
  keyword_score: number;
  matched_terms: Record<string, number>;
  meaning_score: number;
  fused_score: number;
  rerank_score: number | null;
  passed_threshold: boolean;
  close_to_best: boolean;
  is_question: boolean;
  replying_to: string | null;
  selected: boolean;
}

export interface BeaRewrite {
  evidence: number;
  source: string;
  draft: string | null;
  accepted: boolean;
  reason: string | null;
  unsupported_words: string[];
  dropped_words: string[];
}

export interface BeaTrace {
  index: { posts: number; comments: number; chunks: number; skipped_low_information: number; skipped_duplicates: number };
  config: { use_rerank: boolean; min_relevance: number; max_evidence: number };
  candidates: BeaCandidate[];
  generator: string;
  rewrites: BeaRewrite[];
  timings_ms: Record<string, number>;
}

export interface BeaReply {
  available: boolean;
  assistant: string;
  /** Id for rating this answer (👍/👎). */
  answerId?: string;
  mode?: "none" | "extractive" | "generated" | "mixed";
  /** Answer text in segments; `evidence` holds indexes into `evidence` below. */
  answer?: { text: string; evidence: number[] }[];
  evidence?: BeaEvidence[];
  trace?: BeaTrace;
}

const ASK_URL = BASE_URL.replace(/\/users$/, "/ask");

export const askBea = (question: string, hobbySlug?: string | null) =>
  request<BeaReply>(() => axios.post(ASK_URL, { question, hobbySlug: hobbySlug ?? undefined }, authConfig()), "Bea couldn't answer that");

export const rateBeaAnswer = (answerId: string, helpful: boolean) =>
  request<{ id: string; helpful: boolean }>(
    () => axios.post(`${ASK_URL}/${answerId}/feedback`, { helpful }, authConfig()),
    "Couldn't save your feedback"
  );

// ---- Journey (streaks, milestones, then → now) ----

export interface JourneyHobby {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface JourneyPostRef {
  id: string;
  excerpt: string;
  image: string | null;
}

export type JourneyMilestone =
  | { type: "joined"; date: string; hobby: JourneyHobby }
  | { type: "first_post" | "first_photo"; date: string; hobby: JourneyHobby; post: JourneyPostRef }
  | { type: "challenge_entry"; date: string; hobby: JourneyHobby; post: JourneyPostRef; challengeTitle: string }
  | { type: "log_started"; date: string; hobby: JourneyHobby; logId: string; logTitle: string }
  | { type: "post_count"; date: string; hobby: JourneyHobby; post: JourneyPostRef; count: number }
  | { type: "first_practice"; date: string; hobby: JourneyHobby; focus: string; minutes: number }
  | { type: "practice_hours"; date: string; hobby: JourneyHobby; hours: number };

export interface Journey {
  user: { id: string; name: string; username: string; avatarUrl: string | null };
  hobby: JourneyHobby | null;
  joinedAt: string | null;
  stats: {
    posts: number;
    photos: number;
    challengesEntered: number;
    logs: number;
    practiceSessions: number;
    practiceMinutes: number;
    practiceMinutesThisWeek: number;
  };
  /** Weekly streaks: a week counts when you practised or posted in it. */
  streak: {
    current: number;
    best: number;
    activeThisWeek: boolean;
    weeks: { start: string; posts: number; sessions: number; minutes: number }[];
  };
  /** What they've practised most over the last 4 weeks. */
  recentFocus: { focus: string; minutes: number }[];
  currentChallenge: { id: string; title: string; prompt: string; endsAt: string; entered: boolean } | null;
  logs: { id: string; title: string; createdAt: string; hobby: JourneyHobby; entryCount: number; lastEntryAt: string | null }[];
  thenNow: { first: { postId: string; image: string; date: string }; latest: { postId: string; image: string; date: string } } | null;
  milestones: JourneyMilestone[];
}

/** A user's journey in one hive (`hobbySlug`) or across all their hives. */
export const getJourney = (username: string, hobbySlug?: string | null) =>
  request<Journey>(
    () => axios.get(`${BASE_URL}/${username}/journey`, authConfig(hobbySlug ? { hobby: hobbySlug } : undefined)),
    "Couldn't load this journey"
  );

// ---------- Practice sessions ----------

export type PracticeFeel = "rough" | "okay" | "great";

export interface PracticeSession {
  id: string;
  startedAt: string;
  durationMin: number;
  focus: string;
  /** Private to you. */
  note: string | null;
  feel: PracticeFeel | null;
  /** Set once the session has been shared to its hive. */
  postId: string | null;
  createdAt: string;
  hobby: JourneyHobby;
  skill: { id: string; name: string } | null;
}

export interface LogPracticeInput {
  hobbyId: string;
  skillId?: string | null;
  durationMin: number;
  focus: string;
  note?: string;
  feel?: PracticeFeel | null;
  startedAt?: string;
}

export const logPractice = (input: LogPracticeInput) =>
  request<PracticeSession>(() => axios.post(PRACTICE_URL, input, authConfig()), "Couldn't log this session");

/** Your sessions, newest first, plus what you usually work on (for quick picks). */
export const getMyPractice = (hobbySlug?: string | null) =>
  request<{ sessions: PracticeSession[]; recentFocus: string[] }>(
    () => axios.get(PRACTICE_URL, authConfig(hobbySlug ? { hobby: hobbySlug } : undefined)),
    "Couldn't load your practice"
  );

export const deletePractice = (sessionId: string) =>
  request<{ id: string }>(() => axios.delete(`${PRACTICE_URL}/${sessionId}`, authConfig()), "Couldn't delete this session");

/** Share a session to its hive as a post. The private note is never shared. */
export const sharePractice = (sessionId: string, { caption, images }: { caption?: string; images?: string[] } = {}) =>
  request<Post>(
    () => axios.post(`${PRACTICE_URL}/${sessionId}/share`, { caption, images }, authConfig()),
    "Couldn't share this session"
  );

// ---------- Skills & goals ----------

export type SkillStatus = "LEARNING" | "DONE";

export interface SkillNode {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** 1 = first steps; higher tiers build on lower ones. */
  tier: number;
  position: number;
  parentId: string | null;
  membersDone: number;
  membersLearning: number;
  /** You: status (null if you've only practised it) and practice time tagged to it. */
  my: { status: SkillStatus | null; startedAt: string | null; completedAt: string | null; minutes: number; sessions: number } | null;
}

export type GoalStatus = "ACTIVE" | "ACHIEVED" | "DROPPED";

export interface Goal {
  id: string;
  title: string;
  targetDate: string | null;
  status: GoalStatus;
  createdAt: string;
  achievedAt: string | null;
  hobby: JourneyHobby;
  skill: { id: string; name: string } | null;
  /** Practice on the goal's skill since it was set (null for goals without a skill). */
  progress: { minutes: number; sessions: number } | null;
}

export const getHobbySkills = (slug: string) =>
  request<{ hobby: JourneyHobby; skills: SkillNode[]; goals: { id: string; title: string; targetDate: string | null; skillId: string | null; createdAt: string }[] }>(
    () => axios.get(`${HOBBIES_URL}/${slug}/skills`, authConfig()),
    "Couldn't load this hive's skills"
  );

export const setSkillStatus = (skillId: string, status: SkillStatus | null) =>
  request<{ skillId: string; status: SkillStatus | null; achievedGoals?: number }>(
    () => axios.put(`${SKILLS_URL}/${skillId}/status`, { status }, authConfig()),
    "Couldn't update this skill"
  );

export interface UserSkillItem {
  id: string;
  name: string;
  tier: number;
  startedAt: string;
  completedAt: string | null;
  minutes: number;
}

/** Someone's skills, grouped by hive: what they're learning and what they've done. */
export const getUserSkills = (username: string) =>
  request<{ hives: { hobby: JourneyHobby; learning: UserSkillItem[]; done: UserSkillItem[] }[] }>(
    () => axios.get(`${BASE_URL}/${username}/skills`, authConfig()),
    "Couldn't load skills"
  );

export const getMyGoals = (params: { hobbySlug?: string | null; status?: GoalStatus } = {}) =>
  request<Goal[]>(
    () => axios.get(GOALS_URL, authConfig({ hobby: params.hobbySlug ?? undefined, status: params.status })),
    "Couldn't load your goals"
  );

export const createGoal = (input: { hobbyId: string; skillId?: string | null; title?: string; targetDate?: string | null }) =>
  request<Goal>(() => axios.post(GOALS_URL, input, authConfig()), "Couldn't set this goal");

export const updateGoal = (goalId: string, input: { title?: string; targetDate?: string | null; status?: GoalStatus }) =>
  request<Goal>(() => axios.patch(`${GOALS_URL}/${goalId}`, input, authConfig()), "Couldn't update this goal");

export const deleteGoal = (goalId: string) =>
  request<{ id: string }>(() => axios.delete(`${GOALS_URL}/${goalId}`, authConfig()), "Couldn't delete this goal");

// ---------- Feedback requests ----------

export type MentorLevel = "Helper" | "Mentor" | "Guide";

export interface Feedback {
  id: string;
  /** What's working. */
  working: string;
  /** One thing to try. */
  tryNext: string;
  /** Where to look: a clip timestamp or a photo. */
  at: string | null;
  helpfulAt: string | null;
  createdAt: string;
  author: { id: string; name: string; username: string; avatarUrl: string | null };
  isOwn: boolean;
  /** The giver's level in this post's hive, from feedback others marked helpful. */
  mentorLevel: MentorLevel | null;
}

export const getPostFeedback = (postId: string) =>
  request<{ ask: string | null; canGive: boolean; canMarkHelpful: boolean; feedback: Feedback[] }>(
    () => axios.get(`${POSTS_URL}/${postId}/feedback`, authConfig()),
    "Couldn't load feedback"
  );

export const giveFeedback = (postId: string, input: { working: string; tryNext: string; at?: string }) =>
  request<Feedback>(() => axios.post(`${POSTS_URL}/${postId}/feedback`, input, authConfig()), "Couldn't send your feedback");

export const markFeedbackHelpful = (feedbackId: string, helpful: boolean) =>
  request<{ id: string; helpfulAt: string | null }>(
    () => axios.put(`${FEEDBACK_URL}/${feedbackId}/helpful`, { helpful }, authConfig()),
    "Couldn't update this feedback"
  );

export const deleteFeedback = (feedbackId: string) =>
  request<{ id: string }>(() => axios.delete(`${FEEDBACK_URL}/${feedbackId}`, authConfig()), "Couldn't delete this feedback");

/** Open (a question) or close (null) your post's feedback request. */
export const setFeedbackAsk = (postId: string, ask: string | null) =>
  request<{ id: string; feedbackAsk: string | null }>(
    () => axios.put(`${POSTS_URL}/${postId}/feedback-ask`, { ask }, authConfig()),
    "Couldn't update this request"
  );

/** A hive's feedback requests; `open` for ones nobody has answered yet. */
export const getFeedbackRequests = (slug: string, open = false) =>
  request<(Post & { hasHelpfulFeedback: boolean })[]>(
    () => axios.get(`${HOBBIES_URL}/${slug}/feedback-requests`, authConfig(open ? { open: 1 } : undefined)),
    "Couldn't load feedback requests"
  );

export const getHiveMentors = (slug: string) =>
  request<{ user: { id: string; name: string; username: string; avatarUrl: string | null }; helpful: number; level: MentorLevel | null }[]>(
    () => axios.get(`${HOBBIES_URL}/${slug}/mentors`, authConfig()),
    "Couldn't load mentors"
  );

/** Someone's helpful-feedback count and mentor level, per hive. */
export const getUserReputation = (username: string) =>
  request<{ hobbyId: string; helpful: number; level: MentorLevel | null }[]>(
    () => axios.get(`${BASE_URL}/${username}/reputation`, authConfig()),
    "Couldn't load reputation"
  );

// ---------- Weekly recap ----------

export type PersonalBest =
  | { kind: "week_minutes"; value: number; previous: number }
  | { kind: "longest_session"; value: number; previous: number; focus: string }
  | { kind: "streak"; value: number; previous: number };

export interface HiveWeek {
  hobby: JourneyHobby;
  sessions: number;
  minutes: number;
  topFocus: string | null;
  skillsDone: string[];
  goalsAchieved: string[];
}

export interface WeeklyRecap {
  weekStart: string;
  weekEnd: string;
  isCurrentWeek: boolean;
  totals: { sessions: number; minutes: number; activeDays: number; posts: number };
  previousMinutes: number;
  perHive: HiveWeek[];
  feedback: { given: number; markedHelpful: number };
  streak: number;
  personalBests: PersonalBest[];
  hasActivity: boolean;
}

/** Your week in review; `week` is any date in it (defaults to this week). */
export const getRecap = (week?: string | null) =>
  request<WeeklyRecap>(() => axios.get(`${PRACTICE_URL}/recap`, authConfig(week ? { week } : undefined)), "Couldn't load your recap");

/** Post one hive's part of a week's recap to that hive. */
export const shareRecap = (input: { week: string; hobbyId: string; caption?: string }) =>
  request<Post>(() => axios.post(`${PRACTICE_URL}/recap/share`, input, authConfig()), "Couldn't share your recap");

// ---------- Bea practice coach ----------

export type CoachFocusKind = "goal" | "neglected" | "rough" | "learning" | "next";

export interface CoachPlan {
  assistant: string;
  hive: { id: string; name: string; slug: string };
  /** How much to practise this week, from your recent average. */
  plan: { sessions: number; minutesEach: number; basis: string };
  focus: {
    skill: { id: string; name: string; description: string; tier: number };
    kind: CoachFocusKind;
    /** Why this skill, built from your own practice, goals and skill map. */
    reason: string;
    minutes: number;
    /** Your own last note on this skill (private to you). */
    lastNote: string | null;
    /** What worked for others: cited posts from the hive. */
    tips: { postId: string; authorName: string; authorUsername: string; text: string }[];
  }[];
  mlAvailable: boolean;
  hasSkillMap: boolean;
}

/** "What should I practise this week?" for one hive. */
export const getCoachPlan = (hobbySlug: string) =>
  request<CoachPlan>(() => axios.post(`${ASK_URL}/coach`, { hobbySlug }, authConfig()), "Bea couldn't plan your week");

// ---------- Hive guides ----------

export interface GuideSection {
  /** null = the general section. */
  skill: { id: string; name: string; tier: number } | null;
  /** Posts moderators and mentors added, with why. */
  curated: { id: string; note: string | null; createdAt: string; addedBy: { id: string; name: string; username: string }; canRemove: boolean; post: Post }[];
  /** Feedback the person who asked marked helpful. */
  helpful: {
    id: string;
    working: string;
    tryNext: string;
    at: string | null;
    helpfulAt: string;
    author: { id: string; name: string; username: string; avatarUrl: string | null };
    mentorLevel: MentorLevel | null;
    post: { id: string; ask: string | null; excerpt: string; author: { name: string; username: string } };
  }[];
  /** The hive's most-liked posts about this skill. */
  popular: Post[];
}

export interface HiveGuide {
  hive: { id: string; name: string; slug: string };
  canCurate: boolean;
  skills: { id: string; name: string; tier: number }[];
  sections: GuideSection[];
}

export const getHiveGuide = (slug: string) =>
  request<HiveGuide>(() => axios.get(`${HOBBIES_URL}/${slug}/guide`, authConfig()), "Couldn't load the guide");

export const addToGuide = (slug: string, input: { postId: string; skillId?: string | null; note?: string }) =>
  request<{ id: string }>(() => axios.post(`${HOBBIES_URL}/${slug}/guide`, input, authConfig()), "Couldn't add this to the guide");

export const removeFromGuide = (entryId: string) =>
  request<{ id: string }>(() => axios.delete(`${BASE_URL.replace(/\/users$/, "/guide")}/${entryId}`, authConfig()), "Couldn't remove this from the guide");
