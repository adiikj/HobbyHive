import express from 'express';
import cors from 'cors';
import cookieparser from 'cookie-parser';
import {errorHandler} from './middlewares/err.middleware.js';


const app = express();

console.log(process.env.CORS_ORIGIN)
const corsOptions = {
  origin: process.env.CORS_ORIGIN, // Allow only your frontend origin
  credentials: true, // Allow credentials (cookies, authentication headers, etc.)
};

app.use(cors(corsOptions));


app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended: true, limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieparser())
app.options("*", cors(corsOptions)); // Enable preflight response for all routes


//routes import
import userRouter from './routes/user.routes.js';

//routes declaration
app.use("/api/v1/users",userRouter)

app.use(errorHandler);


export { app }