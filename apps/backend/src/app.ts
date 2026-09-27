import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { IMAGE_EXTENSIONS } from "./middlewares/upload.middleware.js";
import { ApiError } from "./utils/ApiError.js";
import userRouter from "./routes/user.routes.js";
import hobbyRouter from "./routes/hobby.routes.js";
import postRouter from "./routes/post.routes.js";
import feedRouter from "./routes/feed.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import searchRouter from "./routes/search.routes.js";
import conversationRouter from "./routes/conversation.routes.js";
import eventRouter from "./routes/event.routes.js";
import savedRouter from "./routes/saved.routes.js";
import challengeRouter from "./routes/challenge.routes.js";
import progressRouter from "./routes/progress.routes.js";
import mlRouter from "./routes/ml.routes.js";
import askRouter from "./routes/ask.routes.js";
import practiceRouter from "./routes/practice.routes.js";
import skillRouter from "./routes/skill.routes.js";
import goalRouter from "./routes/goal.routes.js";
import feedbackRouter from "./routes/feedback.routes.js";
import guideRouter from "./routes/guide.routes.js";

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// User uploads are served as images only: anything else under /uploads (e.g. a file from before uploads were
// type-checked) is a 404, and nosniff stops browsers from guessing a different, executable type
app.use("/uploads", (req, _res, next) =>
  IMAGE_EXTENSIONS.has(path.extname(req.path).toLowerCase()) ? next() : next(new ApiError(404, "That image doesn't exist."))
);
app.use(
  express.static("public", {
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  })
);
app.use(cookieParser());
app.options("*", cors(corsOptions));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/hobbies", hobbyRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/feed", feedRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/conversations", conversationRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/saved", savedRouter);
app.use("/api/v1/challenges", challengeRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/ml", mlRouter);
app.use("/api/v1/ask", askRouter);
app.use("/api/v1/practice", practiceRouter);
app.use("/api/v1/skills", skillRouter);
app.use("/api/v1/goals", goalRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/guide", guideRouter);

app.use("/api", notFoundHandler);
app.use(errorHandler);

export { app };
