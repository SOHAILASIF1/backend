import { asyncHandler } from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
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
    
    
    
    
    
})
    
export {registerUser}