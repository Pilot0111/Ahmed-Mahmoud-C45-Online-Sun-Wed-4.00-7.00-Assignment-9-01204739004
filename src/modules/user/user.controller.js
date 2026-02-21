import { Router } from "express";

import * as US from "./user.service.js";
import { authentication } from "../../common/middleware/authentication.js";
import { authrization } from "../../common/middleware/authrization.js";
import { roleEnum } from "../../common/enums/user.enum.js";

const userRouter = Router();

userRouter.post("/signup", US.signUp);
userRouter.post("/signup/gmail", US.signUpGmail);
userRouter.get("/signin", US.signIn);
userRouter.get(
  "/profile/",
  authentication,
  authrization([roleEnum.user]),
  US.getProfile,
);

export default userRouter;
