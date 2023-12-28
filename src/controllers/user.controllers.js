import { asyncHandler } from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponce.js'
import jwt from 'jsonwebtoken'
import { json } from 'express'
const generateAcsessAndRefreshToken=async (userId) => {
    try {
       const user= await User.findOne(userId)
       console.log(userId)
       const acsessToken=user.generateAccessToken()
       const refreshToken=user.generateRefreshToken()
       user.refreshToken=refreshToken
       await user.save({validateBeforeSave: false})
       return {refreshToken,acsessToken}

    } catch (error) {
        console.error('Error generating tokens:', error);
        throw new ApiError(500,"something went wrong while generating toens")
        
    }
}
const registerUser=asyncHandler( async (req,res) => {
    // get user detail from frontend
    const {fullname,email,username,password } =req.body
    console.log(req.body);
    
    

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
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

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
        avatar: avatar.url,
        
        
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
const loginUser=asyncHandler(async (req,res) => {
    // req . body say data lena hay
    const {email,username,password}=req.body
    // check kro user name or email database mai
    if(!username && !email){
        throw new ApiError(400,"data not found")
    }
    // data base mai ja kr password ya email say jo bh pehly aay usy lay aana hay
    const user=await User.findOne({
        $or : [{username},{email}]
    })
    if (!user) {
        throw new ApiError(404,"User not found")
        
    }
    // password valid hay ya nahn yahan chec ho ga
    const passwordValid = await user.isPasswordCorrect(password)
    if (!passwordValid) {
        throw new ApiError(400,"Wrong password")
        
    }
    const{refreshToken,acsessToken}=await generateAcsessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken", acsessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, acsessToken, refreshToken
            },
            "User logged In Successfully"
        ))


})
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("acsessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})
const refreshAcsessToken=asyncHandler(async (req,res)=>{
    const incommingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if (!incommingRefreshToken) {
        throw new ApiError(401,"Unauthorized requets")
        
    }
    const decodedToken=jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user=await User.findById(decodedToken?._id)
    if (!user) {
        throw new ApiError(400,"Invalid Refresh Token")
        
    }
    if (incommingRefreshToken!==user?.refreshToken) {
        throw new ApiError(401,"refrsh token used already")
        
    }
    const options={
        httpOnly:true,
        secure:true
    }
    const{acsessToken,newRefreshToken}=await generateAcsessAndRefreshToken(user._id)
    return res.status(200).cookie("acsessToken",acsessToken,options).cookie("refreshToken",newRefreshToken,options).json(new ApiResponse(200,{acsessToken,refreshToken:newRefreshToken},"Acsess token refreshed"))

})

const changeCurrentPassword=asyncHandler(async (req,res)=>{
    const{oldPassword,newPassword}=req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError (400,"Invalid old password")
        
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(
        new ApiResponse(200,{},"Password change Sucsesfull")
    )
})  
const getCurrentUser=asyncHandler(async (req,res)=>{
    return res.status(200).json(200,req.user,"Current User fetched ok")
})
const updateAccountDetail=asyncHandler(async (req,res)=>{
    const{fullname,email}=req.body
    if(!fullname||!email){
        throw new ApiError(400,"All field required")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullname,
            email,
        }

    },{new:true}).select("-password")
    return res.status(200).json(new ApiResponse(200,user,"account update sucsessfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400,"file is missing")
        
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
    throw new ApiError(400,"error while uploading on avatar")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{
    $set:{
        avatar:avatar.url
    }
    },{new:true}).select("-password")
    return res.status(200,json(200,user,"avatar update"))

})




    
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAcsessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,

}