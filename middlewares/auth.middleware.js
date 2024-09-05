import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { customApiError } from "../utils/customApiError.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const refreshTokenFromCookies = req.cookies?.refreshToken;

  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"]; // Handle different cases
  const refreshTokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : "";

  const refreshToken = refreshTokenFromCookies || refreshTokenFromHeader;
  if (!refreshToken) {
    throw new customApiError(401, "You are not authorized to visit this page");
  }

  const decodedToken = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const userId = decodedToken?._id;
  if (!userId) {
    throw new customApiError(400, "You are not authorized to visit this page");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new customApiError(400, "You are not authorized to visit this page");
  }

  req.user = {
    userId: user._id,
    email: user.email,
    userName: user.userName,
  };
  next();
});
