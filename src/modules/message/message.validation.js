import joi from "joi";
import { general_rules } from "../../common/utilites/generalRules.js";

export const sendMessageSchema = {
  body: joi
    .object({
      content: joi.string().min(1).max(1000).required(),
      userId: general_rules.id.required(),
    })
    .required(),
    file: joi.array().items(general_rules.file), 
};

export const getMessageByIdSchema = {
  params: joi.object({
    messageId: general_rules.id.required(),
  }).required(),
};