import mongoose from 'mongoose';

// Create a schema for the PendingUser model
const pendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Optional: If you want to ensure unique emails even in pending state
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  otpExpiry: {
    type: Date,
    required: true,
  },
  otpVerified: {
    type: Boolean,
    default: false, // Default to false until OTP is verified
  },

}, {timestamp: true });

// Create an index for the `phoneNumber` and `email` to make sure they are unique
pendingUserSchema.index({ email: 1 }, { unique: true });

// Middleware to update `updatedAt` field on every update
pendingUserSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create the model for PendingUser
const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

export { PendingUser };