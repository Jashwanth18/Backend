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

export { registerUser };
