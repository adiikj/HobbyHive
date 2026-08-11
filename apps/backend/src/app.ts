import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import userRouter from "./routes/user.routes.js";
import hobbyRouter from "./routes/hobby.routes.js";

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.options("*", cors(corsOptions));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/hobbies", hobbyRouter);

app.use(errorHandler);

export { app };
