import dotenv from "dotenv";

import connectDB from "../db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

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
