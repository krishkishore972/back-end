import { asyncHandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists : username , email
  // check for images and avatar
  // upload them to cloudinary,avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  //   console.log("email:", email);

  if (
    [fullName, username, password, email].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new apiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const covreImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    covreImage: covreImage.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Something went wrong.");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registerd successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookies
  // return res

  const { email, username, password } = req.body;
  console.log(email);

  if (!username && !email) {
    throw new apiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apiError(404, " user doesn't exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new apiError(404, " invalid password.");
  }

  const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // console.log(loggedInUser);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user loggedin successfully"
      )
  )
});

const logOutUser = asyncHandler(async (req,res)=>{
User.findByIdAndUpdate(
req.user._id,
{
  $unset:{
    refreshToken:1
  },
},
{
new:true
}
)
const options = {
  httpOnly: true,
  secure: true,
};

return res
.status(200)
.clearCookie("accessToken" , options)
.clearCookie("refreshToken" , options)
.json(new apiResponse(200 , {} , "User logged out"))

})

const refreshAccessToken = asyncHandler ( async (req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new apiError(401 , "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    )

   const user = await User.findById(decodedToken?._id)
   if (!user) {
    throw new apiError(401 , "Invalid refresh token")
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new apiError(401,"refresh token is expired or used")
  }

  const options = {
    httpOnly:true,
    secure:true
  }

  const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

  return res
  .status(200)
  .cookie("access token" , accessToken , options)
  .cookie("refresh token" , newRefreshToken , options)
  .json(
    200,
    {
      accessToken, refreshToken:newRefreshToken
    },
    "Access token is refreshed"
  )
  } catch (error) {
    throw new apiError(401 , error?.message || "Invalid refresh token")
  }

})

export { loginUser , registerUser, logOutUser , refreshAccessToken };

