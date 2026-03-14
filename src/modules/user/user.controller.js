import { Router } from "express";

import * as US from "./user.service.js";
import * as UV from "./user.validation.js";

import { authentication } from "../../common/middleware/authentication.js";
import { authrization } from "../../common/middleware/authrization.js";
import { roleEnum } from "../../common/enums/user.enum.js";
import { validation } from "../../common/middleware/validation.js";
import {
  multer_Cloudinary,
  multer_local,
  multer_memory,
  multerErrorHandler,
} from "../../common/middleware/multer.js";
import { multerEnum } from "../../common/enums/multer.enum.js";

const userRouter = Router();

userRouter.post("/signup", validation(UV.signUpSchema), US.signUp);
// userRouter.post("/multer", multer_local({customType:[...multerEnum.image]}).single("attachment"), US.multerservice);
userRouter.post(
  "/signup/multer_local",
  multerErrorHandler(
    multer_local({ customType: [...multerEnum.image] }).fields([
      { name: "attachment", maxCount: 1 },
      { name: "attachments", maxCount: 2 },
    ])
  ),
  validation(UV.signUpSchema),
  US.signUp,
);
userRouter.post(
  "/multer_memory",
  multer_memory().single("attachment"),
  US.multerservice,
);
userRouter.post(
  "/multer_cloudinary",
  multer_Cloudinary({ customType: [...multerEnum.image] }).single("attachment"),
  validation(UV.signUpSchema),
  US.signUp_Cloudinary,
);
userRouter.post("/signup/gmail", US.signUpGmail);
userRouter.get("/signin", validation(UV.signInSchema), US.signIn);
userRouter.get("/refresh_token", US.refresh_token);
userRouter.get(
  "/profile/",
  authentication,
  authrization([roleEnum.user]),
  US.getProfile,
);

userRouter.get(
  "/share-profile/:id",
  validation(UV.shareProfileSchema),
  US.shareProfile,
);

userRouter.get(
  "/profile/visits/:id",
  authentication,
  authrization([roleEnum.admin]),
  validation(UV.shareProfileSchema),
  US.getProfileVisits
);

userRouter.patch(
  "/update-profile",
  authentication,
  validation(UV.updateProfileSchema),
  US.updateProfile,
);

userRouter.patch(
  "/update-password",
  authentication,
  validation(UV.updatePasswordSchema),
  US.updatePassword,
);

userRouter.post(
  "/upload-profile-picture",
  authentication,
  multerErrorHandler(
    multer_local({ customType: [...multerEnum.image] }).single("attachment")
  ),
  US.uploadProfilePicture
);

userRouter.post(
  "/upload-cover-picture",
  authentication,
  multerErrorHandler(
    multer_local({ customType: [...multerEnum.image] }).fields([
      { name: "attachments", maxCount: 2 },
    ])
  ),
  US.uploadCoverPicture
);

userRouter.get("/logout",authentication, US.logout);

userRouter.delete("/delete-profile-picture", authentication, US.deleteProfilePicture);

export default userRouter;
