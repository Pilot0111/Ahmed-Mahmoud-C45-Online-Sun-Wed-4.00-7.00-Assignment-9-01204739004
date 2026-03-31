import { Router } from "express";
import { multer_local } from "../../common/middleware/multer.js";
import { validation } from "../../common/middleware/validation.js";
import * as MS from "./message.service.js";
import * as MV from "./message.validation.js";
import { multerEnum } from "../../common/enums/multer.enum.js";
import { authentication } from "../../common/middleware/authentication.js";

const messageRouter = Router({ 
    mergeParams: true //now we can access the params of the parent router
 });

messageRouter.post(
  "/send",
  multer_local({
    custom_path: "messages",
    custom_type: multerEnum.image,
  }).array("attachments", 3),
  validation(MV.sendMessageSchema),
  MS.sendMessage,
);

messageRouter.get("/", authentication, MS.getUserMessages);

messageRouter.get(
  "/:messageId",
  authentication,
  validation(MV.getMessageByIdSchema),
  MS.getMessageById,
);

export default messageRouter;
