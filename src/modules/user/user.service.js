import { providerEnum } from "../../common/enums/user.enum.js";
import * as db_service from "../../DB/models/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { responseSuccess } from "../../common/utilites/response.success.js";
import { symmetricEncryption } from "../../common/utilites/security/encrypt.security.js";
import {
  comparePassword,
  hashPassword,
} from "../../common/utilites/security/hash.security.js";
import { sendEmail } from "../../common/utilites/email/send.email.js";
import { encryptAsymmetric } from "../../common/utilites/security/asymmetric.security.js";
import { v4 as uuidv4 } from "uuid";
import { generateToken } from "../../common/utilites/security/toke.security.js";

export const signUp = async (req, res, next) => {
  const {
    userName,
    email,
    password,
    cPassword,
    age,
    gender,
    provider,
    phone,
    encryptionMode,
  } = req.body;
  if (!userName || userName.split(" ").length < 2) {
    // next(new Error("userName must be at least 2 words"));// error handler using express golbal error handler
    throw new Error("userName must be at least 2 words", { cause: 400 }); // error handler using express golbal error handler
  }
  if (password !== cPassword) {
    throw new Error("password and confirm password must be the same", {
      cause: 400,
    });
  }

  if (await db_service.findOne({ model: userModel, filter: { email } })) {
    // return res.status(409).json({ message: "email already exists" });
    throw new Error("email already exists", { cause: 409 }); // error handler using express golbal error handler
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = hashPassword({ plainText: otp });

  const emailSent = await sendEmail({
    to: email,
    subject: "Confirm your email - Saraha App",
    message: `<h1>Welcome to Saraha App</h1><p>Your OTP is <b>${otp}</b></p>`,
  });

  if (!emailSent) {
    throw new Error("Failed to send verification email", { cause: 500 });
  }

  let encryptedPhone;
  if (encryptionMode === "asymmetric") {
    encryptedPhone = encryptAsymmetric(phone);
  } else {
    encryptedPhone = symmetricEncryption(phone);
  }

  const user = await db_service.create({
    model: userModel,
    date: {
      userName,
      email,
      password: hashPassword({ plainText: password }),
      age,
      gender,
      provider,
      phone: encryptedPhone,
      encryptionMode: encryptionMode || "symmetric",
      otp: hashedOtp,
    },
  });
  responseSuccess({
    res,
    status: 201,
    message: "user created successfully",
    user,
  });
};

export const signIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: { email },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  const match = comparePassword({
    PlainText: password,
    cipherText: user.password,
  });
  if (!match) {
    throw new Error("password is incorrect", { cause: 401 });
  }
  // res.status(200).json({ message: "user login successfully", user });

  const access_token = generateToken({
    payload: {
      id: user._id,
      email: user.email,
    },
    options: {
      expiresIn: "1d",
      audience: "user",
      issuer: "Saraha",
      noTimestamp: true,
      notBefore: 10, //in seconds,when the token will be valid
      jwtid: uuidv4(),
    },
  });

  responseSuccess({
    res,
    status: 200,
    message: "user login successfully",
    data: { access_token },
  });
};

//old code by id directly without using the verification
// export const getProfile = async (req, res) => {
//   const { id } = req.params;
//   const user = await db_service.findOne({
//     model: userModel,
//     filter: { _id: id },
//     options: { select: "-password -otp -__v" },
//   });
// if (!user) {throw new Error("user not found", { cause: 404 }); }

//   let decryptedPhone;
//   if (user.encryptionMode === "asymmetric") {
//     decryptedPhone = decryptAsymmetric(user.phone);
//   } else {
//     decryptedPhone = symmetricDecryption(user.phone);
//   }

//   responseSuccess({
//     res,
//     status: 200,
//     message: "Profile fetched successfully",
//     data: {
//       ...user._doc,
//       phone: decryptedPhone,
//     },
//   });
// };

export const getProfile = async (req, res, next) => {
  // const { authorization } = req.headers;
  // const decode = verifyToken({
  //   token: authorization
  // }); now using middleware

  responseSuccess({
    res,
    status: 200,
    message: "Profile fetched successfully",
    data: req.user,
  });
};
