import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "../db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

const port = process.env.PORT || 3000;
connectDB().then(() => {
  app.on("error", (error) => {
    console.log("ERROR: ", error);
    throw error;
  });
  app.listen(port, () => {
    console.log(`Server spinning up on PORT ${port}`);
  });
});
