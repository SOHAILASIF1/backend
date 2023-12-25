import { asyncHandler } from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponce.js'
const registerUser=asyncHandler(async (req,res) => {
    // get user detail from frontend
    const {fullname,email,username,password } =req.body
    
    console.log("fullname",fullname);
    console.log("fullname",password);
    console.log("fullname",username);
    console.log("fullname",email);

    // validation
    if(fullname==="" ){
        throw new ApiError(400,"Full name is requird")
        

    } else if(email==="" ){
        throw new ApiError(400,"email is requird")
        

    } else if(username==="" ){
        throw new ApiError(400,"username is requird")
        

    }else if(password==="" ){
        throw new ApiError(400,"password is requird")
        

    }
    if(!email.includes('@')){
        throw new ApiError(400,"valid email adress")
        

    }
    const existedUser=await User.findOne(
        {
            $or:[{email},{username}]
        }
    )
    if(existedUser){
        throw new ApiError(409, "User with email or user already existed")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    
    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
     })
     const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
     )
     if (!createdUser) {
        throw new ApiError(500,"Something wrong with server")
        
     }
     return res.status(201).json(
        new ApiResponse(200,createdUser,"User Register Successfully")
     )
     
    
    
    
    
    
})
    
export {registerUser}