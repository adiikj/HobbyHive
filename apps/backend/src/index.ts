import http from "http";
import dotenv from "dotenv";
import { app } from "./app.js";
import { prisma } from "./db/prisma.js";
import { initSocket } from "./socket.js";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "./.env" });
}

const httpServer = http.createServer(app);
initSocket(httpServer);

prisma
  .$connect()
  .then(() => {
    console.log("Connected to Postgres");

    httpServer.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });

    if (process.env.NODE_ENV !== "production") {
      // Neon's free-tier compute auto-suspends after a few minutes idle, and the first query
      // after that pays a multi-second cold-start penalty — this makes every click feel stuck
      // during local dev. A cheap periodic ping keeps the branch awake during an active session.
      setInterval(() => {
        prisma.$queryRaw`SELECT 1`.catch(() => undefined);
      }, 4 * 60 * 1000).unref();
    }
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
    process.exit(1);
  });
