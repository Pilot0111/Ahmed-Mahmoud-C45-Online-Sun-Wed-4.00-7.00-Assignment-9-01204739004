import * as db_service from "../../DB/db.service.js";
import messageModel from "../../DB/models/message.model.js";
import userModel from "../../DB/models/user.model.js";
import { responseSuccess } from "../../common/utilites/response.success.js";

export const sendMessage = async (req, res) => {
  const { content, userId } = req.body;

  // Verify that the user exists
  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: userId },
  });

  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
let arr =[];
if(req.files.length > 0){
  for (const file of req.files) {
    arr.push(file.path);
  }
}
  // Create the message
  const message = await db_service.create({
    model: messageModel,
    date: {
      content,
      userId: user._id, // This is the receiverId in your model
      attachment: arr
    },
  });

  responseSuccess({
    res,
    status: 201,
    message: "Message sent successfully",
    data: message,
  });
};

export const getMessageById = async (req, res) => {
  const { messageId } = req.params;

  const message = await db_service.findOne({
    model: messageModel,
    filter: { _id: messageId, userId: req.user._id }, // Ensure only the receiver can see their message
  });

  if (!message) {
    throw new Error("Message not found or unauthorized access", { cause: 404 });
  }

  responseSuccess({
    res,
    message: "Message fetched successfully",
    data: message,
  });
};

export const getUserMessages = async (req, res) => {
  // Fetch all messages where the logged-in user is the receiver
  const messages = await db_service.find({
    model: messageModel,
    filter: { userId: req.user._id },
    options: { sort: { createdAt: -1 } }, // Show newest messages first
  });

  responseSuccess({
    res,
    message: "Messages fetched successfully",
    data: messages,
  });
};
