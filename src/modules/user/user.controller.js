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
import messageRouter from "../message/message.controller.js";

const userRouter = Router({
  caseSensitive: true, // now it is case sensitive
  strict: true, // now it is strict means the path must match exactly even with trailing slashes
});

userRouter.use("/:userId/messages", messageRouter);

userRouter.post("/signup", validation(UV.signUpSchema), US.signUp);
// userRouter.post("/multer", multer_local({customType:[...multerEnum.image]}).single("attachment"), US.multerservice);
userRouter.post(
  "/signup/multer_local",
  multerErrorHandler(
    multer_local({ customType: [...multerEnum.image] }).fields([
      { name: "attachment", maxCount: 1 },
      { name: "attachments", maxCount: 2 },
    ]),
  ),
  validation(UV.signUpSchema),
  US.signUp,
);

userRouter.patch(
  "/confirm_email",
  validation(UV.confirmEmailSchema),
  US.confirmEmail,
);

userRouter.patch("/resend_otp", validation(UV.resendOtpSchema), US.resendOtp);

userRouter.post(
  "/forget-password",
  validation(UV.forgetPasswordSchema),
  US.forgetPassword,
);

userRouter.post(
  "/forgot-password-link",
  validation(UV.forgotPasswordLinkSchema),
  US.forgotPasswordLink,
);

userRouter.patch(
  "/reset-password-link",
  validation(UV.resetPasswordLinkSchema),
  US.resetPasswordLink,
);

userRouter.patch(
  "/reset-password",
  validation(UV.resetPasswordSchema),
  US.resetPassword,
);

userRouter.get(
  "/reset-password-confirmation",
  validation(UV.resetPasswordConfirmationSchema),
  US.resetPasswordConfirmation,
);

userRouter.patch("/enable-2sv/request", authentication, US.requestEnable2SV);

userRouter.patch(
  "/enable-2sv/confirm",
  authentication,
  validation(UV.confirm2SVSchema),
  US.confirmEnable2SV,
);

userRouter.post(
  "/signin/confirm-2sv",
  validation(UV.confirmLogin2SVSchema),
  US.confirmLogin2SV,
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
  US.getProfileVisits,
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
    multer_local({ customType: [...multerEnum.image] }).single("attachment"),
  ),
  US.uploadProfilePicture,
);

userRouter.post(
  "/upload-cover-picture",
  authentication,
  multerErrorHandler(
    multer_local({ customType: [...multerEnum.image] }).fields([
      { name: "attachments", maxCount: 2 },
    ]),
  ),
  US.uploadCoverPicture,
);

userRouter.get("/logout", authentication, US.logout);

userRouter.delete(
  "/delete-profile-picture",
  authentication,
  US.deleteProfilePicture,
);

export default userRouter;
