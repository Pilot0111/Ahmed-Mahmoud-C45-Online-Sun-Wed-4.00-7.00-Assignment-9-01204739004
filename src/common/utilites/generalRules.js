import joi from "joi";

export const general_rules = {
  email: joi.string().email({
    tlds: { allow: false, deny: ["org"] },
    minDomainSegments: 2,
    maxDomainSegments: 2,
  }),
  password: joi
    .string()
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/)
    .messages({
      "string.min": "password must be at least 4 characters",
      "any.required": "password is required",
    }),
  cPassword: joi.string().valid(joi.ref("password")),

  file: joi
    .object({
      fieldname: joi.string().required(),
      originalname: joi.string().required(),
      encoding: joi.string().required(),
      mimetype: joi.string().required(),
      destination: joi.string().required(),
      filename: joi.string().required(),
      path: joi.string().required(),
      size: joi.number().required(),
    })
    .messages({
      "string.empty": "file is required",
      "any.required": "file is required",
    }),
};
