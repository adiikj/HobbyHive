import dotenv from "dotenv";
import { app } from "./app.js";
import { prisma } from "./db/prisma.js";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "./.env" });
}

prisma
  .$connect()
  .then(() => {
    console.log("Connected to Postgres");

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
    process.exit(1);
  });
