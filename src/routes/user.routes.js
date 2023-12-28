import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import { loginUser, logoutUser, refreshAcsessToken, registerUser } from "../controllers/user.controllers.js";
const router=Router()
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )
    router.route("/login").post(loginUser)

    router.route("/logout").post(verifyJWT , logoutUser)
    router.route("/refresh-token").post(refreshAcsessToken)

export default router