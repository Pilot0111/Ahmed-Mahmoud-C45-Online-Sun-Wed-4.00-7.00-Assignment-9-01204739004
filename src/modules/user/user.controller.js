import { Router } from "express";
 
import * as US from "./user.service.js";

const userRouter = Router();


userRouter.post("/signup", US.signUp);
userRouter.get("/signin", US.signIn);
userRouter.get("/profile/", US.getProfile);


export default userRouter