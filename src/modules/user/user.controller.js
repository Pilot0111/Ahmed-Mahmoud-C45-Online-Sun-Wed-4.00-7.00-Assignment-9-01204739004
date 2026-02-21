import { Router } from "express";

import * as US from "./user.service.js";
import * as UV from "./user.validation.js";

import { authentication } from "../../common/middleware/authentication.js";
import { authrization } from "../../common/middleware/authrization.js";
import { roleEnum } from "../../common/enums/user.enum.js";
import { validation } from "../../common/middleware/validation.js";

const userRouter = Router();

userRouter.post("/signup", validation(UV.signUpSchema), US.signUp);
userRouter.post("/signup/gmail", US.signUpGmail);
userRouter.get("/signin", validation(UV.signInSchema), US.signIn);
userRouter.get(
  "/profile/",
  authentication,
  authrization([roleEnum.user]),
  US.getProfile,
);

export default userRouter;
