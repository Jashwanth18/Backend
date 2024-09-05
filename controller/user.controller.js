import { asyncHandler } from "../utils/asyncHandler.js";
import { customApiError } from "../utils/customApiError.js";
import { customApiResponse } from "../utils/customApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadFile } from "../utils/cloudinary.js";
import { upload } from "../middlewares/mutler.middleware.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, userName, password, email } = req.body;
  console.log(req.body);
  // TODO : Use JOI for validation
  if ([fullName, userName, password].some((dataField) => !dataField?.trim())) {
    throw new customApiError(400, "All fields are mandatory");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existingUser) {
    throw new customApiError(
      400,
      "User with the following username or email already exists"
    );
  }
  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath = "";
  if (req.files.coverImage && req.files.coverImage.length) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  let coverImageUrl = "";
  let avatarUrl = "";
  if (!avatarLocalPath) {
    throw new customApiError(400, "Avatar is mandatory");
  } else {
    avatarUrl = await uploadFile(avatarLocalPath);
    if (!avatarUrl) {
      throw new customApiError(
        500,
        "Avatar failed to upload! Please try again"
      );
    }
    if (coverImageLocalPath)
      coverImageUrl = await uploadFile(coverImageLocalPath);
  }

  const currentUser = await User.create({
    userName: userName.toLowerCase(),
    fullName,
    password,
    email,
    coverImage: coverImageUrl,
    avatar: avatarUrl,
  });

  // if user creation failed
  if (!currentUser) {
    throw new customApiError(
      500,
      "Something went wrong while registering the user. Please try again"
    );
  }

  res.status(201).json(
    new customApiResponse(
      201,
      {
        userName: currentUser.userName,
        fullName: currentUser.fullName,
        email: currentUser.email,
        avatar: currentUser.avatar,
        coverImage: currentUser.coverImage,
      },
      "User registered successfully!"
    )
  );
});

const cookieOptions = {
  httpOnly: true,
  secure: true,
};

const generateAccessandRefreshToken = async (currentUser) => {
  try {
    const accessToken = currentUser.generateAccessToken();
    const refreshToken = currentUser.generateRefreshToken();

    await User.findOneAndUpdate(
      { _id: currentUser._id },
      {
        refreshToken,
      }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    throw new customApiError(500, "Error while generating tokens");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  if (!email || !password) {
    throw new customApiError(400, "All fields are mandatory");
  }
  const currentUser = await User.findOne({ email });
  if (!currentUser) {
    throw new customApiError(400, "User with this email doesn't exist");
  }
  const isPasswordCorrect = await currentUser.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new customApiError(400, "Incorrect Password");
  } else {
    const { accessToken, refreshToken } =
      generateAccessandRefreshToken(currentUser);

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new customApiResponse(
          200,
          { userId: currentUser._id, accessToken, refreshToken },
          "User loggedin successfully!"
        )
      );
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findOneAndUpdate(
    { _id: userId },
    {
      refreshToken: null,
    },
    { new: true }
  );

  const { accessToken, refreshToken } = req.cookies;
  res
    .status(200)
    .clearCookie("accessToken", accessToken, cookieOptions)
    .clearCookie("refreshToken", refreshToken, cookieOptions)
    .json(new customApiResponse(200, {}, "User logged out succesfully!"));
});

const refreshAcessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body || req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new customApiError(400, "Unauthorized request");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = User.findOneById(decodedToken?._id);
  if (!user) {
    throw new customApiError(400, "Unauthorized request");
  }

  const { accessToken, refreshToken } = generateAccessandRefreshToken(user);

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new customApiResponse(
        200,
        { userId: user._id, accessToken, refreshToken },
        "Access token refreshed"
      )
    );
});

export { registerUser, loginUser, logoutUser, refreshAcessToken };
