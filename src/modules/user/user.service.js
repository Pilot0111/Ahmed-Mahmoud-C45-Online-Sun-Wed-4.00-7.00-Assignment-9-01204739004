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
import {
  generateToken,
  verifyToken,
} from "../../common/utilites/security/toke.security.js";
import { OAuth2Client } from "google-auth-library";
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  SALT_ROUNDS,
} from "../../config/config.service.js";
import cloudinary from "../../common/utilites/cloudnary.js";
import fs from "node:fs";

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
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

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
  console.log(req.files);
  let arr_paths = [];
  if (req.files?.attachments) {
    for (const file of req.files.attachments) {
      arr_paths.push(file.path);
    }
  }
  try {
    const user = await db_service.create({
      model: userModel,
      date: {
        userName,
        email,
        password: hashPassword({ plainText: password, salt: SALT_ROUNDS }),
        age,
        gender,
        provider,
        phone: encryptedPhone,
        encryptionMode: encryptionMode || "symmetric",
        otp: hashedOtp,
        otpExpiresAt,
        profilePicture: req.files?.attachment?.[0]?.path,
        coverPictures: arr_paths,
      },
    });
    responseSuccess({
      res,
      status: 201,
      message: "user created successfully",
      data: user,
    });
  } catch (error) {
    if (req.files) {
      for (const key in req.files) {
        for (const file of req.files[key]) {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
              if (
                fs.existsSync(file.destination) &&
                fs.readdirSync(file.destination).length === 0
              ) {
                fs.rmdirSync(file.destination);
              }
            }
          } catch (err) {
            // ignore cleanup errors
          }
        }
      }
    }
    throw error;
  }
};

export const signUpGmail = async (req, res) => {
  const { idToken } = req.body;
  console.log(idToken);

  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience:
      "725208979610-gf7bf1v4ic94jj4n32ga591tu3is7ftf.apps.googleusercontent.com",
  });
  const payload = ticket.getPayload();
  const { email, email_verified, name, picture } = payload;
  let user = await db_service.findOne({
    model: userModel,
    filter: { email },
  });
  if (!user) {
    user = await db_service.create({
      model: userModel,
      date: {
        userName: name,
        email,
        confirmed: email_verified,
        // password: null,
        // age: null,
        // gender: null,
        provider: providerEnum.google,
        // phone: null,
        // encryptionMode: null,
        // otp: null,
        profilePicture: picture,
      },
    });
  }
  if (user.provider == providerEnum.system) {
    throw new Error("please login with your email", { cause: 400 });
  }

  const access_token = generateToken({
    payload: {
      id: user._id,
      email: user.email,
    },
    signature: JWT_ACCESS_SECRET,
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
    status: 201,
    message: "user created successfully",
    data: { access_token },
  });
};

export const signUp_Cloudinary = async (req, res, next) => {
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
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

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
  console.log(req.file);

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "Saraha_App/users",
      resource_type: "image",
      // public_id: userName,
      use_filename: true,
      unique_filename: false, // to make sure the file name is unique by adding a random string to it
    },
  );

  try {
    const user = await db_service.create({
      model: userModel,
      date: {
        userName,
        email,
        password: hashPassword({ plainText: password, salt: SALT_ROUNDS }),
        age,
        gender,
        provider,
        phone: encryptedPhone,
        encryptionMode: encryptionMode || "symmetric",
        otp: hashedOtp,
        otpExpiresAt,
        profilePicture: {
          secure_url,
          public_id,
        },
      },
    });
    responseSuccess({
      res,
      status: 201,
      message: "user created successfully",
      data: user,
    });
  } catch (error) {
    // await cloudinary.uploader.destroy(public_id); // for single file
    await cloudinary.api.delete_resources([public_id]); // for multiple files
    // Attempt to delete the folder if it is empty
    try {
      const folder = public_id.split("/").slice(0, -1).join("/");
      await cloudinary.api.delete_folder(folder);
    } catch (err) {
      // Folder is not empty, ignore
    }
    throw error;
  }
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
    signature: JWT_ACCESS_SECRET,
    options: {
      expiresIn: "1d",
      audience: "user",
      issuer: "Saraha",
      noTimestamp: true,
      notBefore: 10, //in seconds,when the token will be valid
      jwtid: uuidv4(),
    },
  });

  const refresh_token = generateToken({
    payload: {
      id: user._id,
      email: user.email,
    },
    signature: JWT_REFRESH_SECRET,
    options: {
      expiresIn: "7y",
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
    data: { access_token, refresh_token },
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

export const multerservice = async (req, res) => {
  if (!req.file) {
    throw new Error("file is required", { cause: 400 });
  }
  console.log(req.file, "file after upload");
  responseSuccess({
    res,
    status: 200,
    message: "Profile fetched successfully",
    data: req.user,
  });
};

export const refresh_token = async (req, res) => {
  const { authrization } = req.headers;
  if (!authrization) {
    throw new Error("token not found", { cause: 401 });
  }
  if (!authrization.startsWith(PREFIX + " ")) {
    throw new Error("invalid token prefix", { cause: 401 });
  }
  const token = authrization.split(" ")[1];
  if (!token) {
    throw new Error("invalid token", { cause: 401 });
  }
  const decoded = verifyToken({ token: token, signature: JWT_REFRESH_SECRET });
  if (!decoded || !decoded?.id) {
    throw new Error("invalid token", { cause: 401 });
  }

  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: decoded.id },
    options: { select: "-password -otp -__v" },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }

  const access_token = generateToken({
    payload: {
      id: user._id,
      email: user.email,
    },
    signature: JWT_ACCESS_SECRET,
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
