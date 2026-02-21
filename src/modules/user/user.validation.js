import joi from "joi";
import { encryptionModeEnum, genderEnum, providerEnum, roleEnum } from './../../common/enums/user.enum.js';

export const signUpSchema = {
  body: joi
    .object({
      userName: joi.string().min(3).max(20).required(),//we can user also .alphanum() and length(3,20)
      email: joi.string().email().required(),
      password: joi.string().min(4).required(),
      cPassword: joi.string().valid(joi.ref("password")).required(),
      age: joi.number(),
      gender: joi.string().valid(...Object.values(genderEnum)).required(),
      provider: joi.string().valid(...Object.values(providerEnum)).required(),
      phone: joi.string().required(),
      role: joi.string().valid(...Object.values(roleEnum)).required(),
      encryptionMode: joi.string().valid(...Object.values(encryptionModeEnum)).required(),
    })
    .required(),
};

export const signInSchema = {
  body: joi
    .object({
      email: joi.string().email().required(),
      password: joi.string().min(4).required(),
    })
    .required(),
  query: joi
    .object({
      x: joi.string().required(),
    })
    .required(),
};
