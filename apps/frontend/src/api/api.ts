import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
const HOBBIES_URL = BASE_URL.replace(/\/users$/, "/hobbies");

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

export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem("authToken");

    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_URL}/profile`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch user profile");
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
