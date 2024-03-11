import {asyncHandler} from "../utils/asynchandler.js";
import {apiError} from "../utils/apierror.js"
import  Jwt  from "jsonwebtoken";
import { User } from "../models/user.model.js";




export const verifyJWT = asyncHandler(async (req ,res,next)=>{
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer" , "")

    if (!token) {
 throw new apiError(401 , " Unauthorized request ")
    }
   const decodedToken =  Jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)

  const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

  if (!user) {
   throw new apiError(401,"Invalid Access Token")
  }

  req.user = user;
  next()
   } catch (error) {
throw new apiError(401,error?.message || "Inavalid Access token")
   }

})