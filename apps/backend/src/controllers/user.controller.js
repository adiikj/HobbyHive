import { asyncHandler } from "../utils/asyncHandler.js"; 
import { ApiError } from "../utils/ApiError.js";         
import { User } from "../models/user.models.js";
import { PendingUser } from "../models/pendingUser.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { google } from "googleapis";

dotenv.config();

//Email Configuration
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID, 
  process.env.GOOGLE_CLIENT_SECRET, 
  process.env.GOOGLE_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const { token } = await oAuth2Client.getAccessToken();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
        user: process.env.GOOGLE_GMAIL_ID,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: token,
  }
});

// Utility function to generate tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();  // Ensure this method exists and works
    const refreshToken = user.generateRefreshToken();  // Ensure this method exists and works

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "Error generating tokens");
  }
};

// User Login
const loginUser = asyncHandler(async (req, res) => {
  const { emailOrUsername, password } = req.body;
  console.log("Login Request:", req.body);
  
  if (!emailOrUsername || !password) {
    throw new ApiError(400, "Email or Username, Password are required");
  }


  const user = await User.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  });


  if (!user) {
    res.status(404).json({ message: "User not found" });
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password.trim());
  console.log(password);
  console.log("Entered Password:", password);
console.log("Stored Password Hash:", user.password);


  if (!isPasswordValid) {
    res.status(401).json({ message: "Invalid credentials" });
    throw new ApiError(401, "Invalid credentials");
  }


  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
  secure: false,
  sameSite: "none", // Cross-origin cookies
  path: "/",
  expires: new Date(Date.now() + 3600000),
  };

  res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      status: 200,
      data: { user: loggedInUser, accessToken, refreshToken },
      message: "User logged in successfully"
    });

});

// User Logout
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true, // Set to true in production
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Generate OTP and expiry
const generateOTP = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expiry: 10 minutes


    await sendOTP(email,otp); // Pass email as the first parameter

  return { otp, otpExpiry };
};

// Utility function to send OTP via email
const sendOTP = async (email, otp) => {

// Ensure email is provided for email-based OTP
if (!email) {
  throw new ApiError(400, "Email is required for OTP method 'email'");
}

const mailOptions = {
  from: process.env.GOOGLE_GMAIL_ID,
  to: email, // Use email directly
  subject: "Welcome to HobbyHive",
  html : `<h3>Your OTP Code for HobbyHive Registration is <b>${otp}</b>. It is valid for 10 minutes.</h3>`,
  text: `Your OTP Code for HobbyHive Registration is ${otp}. It is valid for 10 minutes.`,
};

try {
  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent: ", info.response);
} catch (error) {
  console.error("Error sending OTP via email:", error);
  throw new ApiError(500, "Error sending OTP via email");
}
} 

// User Registration
const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password} = req.body;

  // Validate required fields
  if (!name || !username || !email || !password) {
    throw new ApiError(400, "All fields are required.");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [
      { email }, 
      { username },
    ] 
  });

  if (existingUser) {
    throw new ApiError(400, "Email, phone number, or username is already registered.");
  }

  // Generate OTP
  const { otp, otpExpiry } = await generateOTP(email);

  // Save PendingUser
  const pendingUser = new PendingUser({
    name,
    username,
    email,
    password,
    otp,
    otpExpiry,
    otpVerified: false,
  });

  await pendingUser.save();

  res.status(200).json({
    message: "User registered successfully. Please verify the OTP.",
  });
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp} = req.body;

  // Ensure required fields are present
  if (!otp) {
    throw new ApiError(400, "OTP are required.");
  }

  if (!email) {
    throw new ApiError(400, "Email is required for OTP.");
  }


  // Look for the pending user based on contact method
  let pendingUser;
    pendingUser = await PendingUser.findOne({ email });

  console.log("Pending User OTP (from DB):", pendingUser.otp);  // Log OTP from DB
  console.log("Received OTP:", otp);  // Log OTP from request

  console.log("Pending User:", pendingUser);
  if (!pendingUser) {
    throw new ApiError(404, "No pending user found.");
  }

  // Check if OTP matches
  if (pendingUser.otp !== otp) {
    throw new ApiError(400, "Invalid OTP.");
  }

  // Check if OTP has expired
  if (Date.now() > pendingUser.otpExpiry) {
    throw new ApiError(400, "OTP has expired.");
  }

  // Mark OTP as verified
  pendingUser.otpVerified = true;
  await pendingUser.save();

  // Move user to Users collection
  const user = new User({
    name: pendingUser.name,
    username: pendingUser.username,
    email: pendingUser.email,
    password: pendingUser.password,
    otp: pendingUser.otp,
    otpVerified: true,
  });

  await user.save();
  await PendingUser.deleteOne({ _id: pendingUser._id });

  res.status(200).json({ message: "User verified and confirmed successfully. You can now log in." });
});

const getProfile = asyncHandler(async (req, res) => {
  // Fetching only the name field of the user by ID
  const user = await User.findById(req.user._id).select("name");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  // Return the user's name in the response
  res.status(200).json({ status: 200, data: { name: user.name } });
});


export { registerUser, loginUser, logoutUser, verifyOTP, sendOTP, getProfile };