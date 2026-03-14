import joi from "joi";
import {
  encryptionModeEnum,
  genderEnum,
  providerEnum,
  roleEnum,
} from "./../../common/enums/user.enum.js";
import { general_rules } from "../../common/utilites/generalRules.js";

export const signUpSchema = {
  body: joi
    .object({
      userName: joi.string().min(3).max(20).required(), //we can user also .alphanum() and length(3,20)
      email: general_rules.email.required(),
      password: general_rules.password.required(),
      cPassword: general_rules.cPassword.required(),
      age: joi.number(),
      gender: joi
        .string()
        .valid(...Object.values(genderEnum))
        .required(),
      provider: joi
        .string()
        .valid(...Object.values(providerEnum))
        .required(),
      phone: joi.string().required(),
      role: joi
        .string()
        .valid(...Object.values(roleEnum))
        .required(),
      encryptionMode: joi
        .string()
        .valid(...Object.values(encryptionModeEnum))
        .required(),
    })
    .required()
    .messages({
      "string.empty": "field is required",
      "any.required": "field is required",
    }),
  file: general_rules.file.optional(),
  // in case of using fileds in form-data with attachment and attachments
  files: joi
    .object({
      attachment: joi.array().max(1).items(general_rules.file.required()),
      attachments: joi.array().max(2).items(general_rules.file.required()),
    })
    .optional(),
};

export const signInSchema = {
  body: joi
    .object({
      email: joi.string().email().required(),
      password: joi
        .string()
        .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/)
        .required(),
    })
    .required(),
  query: joi
    .object({
      x: joi.string().required(),
    })
    .required(),
};


export const shareProfileSchema = {
  params: joi
    .object({
      id: general_rules.id.required(),
    })
    .required(),
}

export const updateProfileSchema = {
  body: joi
    .object({
      firstName: joi.string().trim().min(3),
      lastName: joi.string().trim().min(3),
      phone: joi.string(),
      gender: joi.string().valid(...Object.values(genderEnum)),
    })
    .required(),
}

export const updatePasswordSchema = {
  body: joi
    .object({
      oldPassword: general_rules.password.required(),
      newPassword: general_rules.password.required(),
      cPassword: joi.string().valid(joi.ref("newPassword")).required(),
    })
    .required(),
}