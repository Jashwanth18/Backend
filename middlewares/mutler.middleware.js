import multer from "multer";
import { FILE_STORAGE_DESTINATION } from "../src/constants.js";

const storage = multer.diskStorage(
  {
    destination: function (req, file, cb) {
      cb(null, FILE_STORAGE_DESTINATION);
    },
  },
  {
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }
);

export const upload = multer({ storage });
