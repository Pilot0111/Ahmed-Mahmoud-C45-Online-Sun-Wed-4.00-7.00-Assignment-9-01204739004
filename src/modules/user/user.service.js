import { providerEnum } from "../../common/enums/user.enum.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { responseSuccess } from "../../common/utilites/response.success.js";
import {
  symmetricDecryption,
  symmetricEncryption,
} from "../../common/utilites/security/encrypt.security.js";
import {
  comparePassword,
  hashPassword,
} from "../../common/utilites/security/hash.security.js";
import { sendEmail } from "../../common/utilites/email/send.email.js";
import {
  decryptAsymmetric,
  encryptAsymmetric,
} from "../../common/utilites/security/asymmetric.security.js";
import { generateOtp } from "../../common/utilites/security/code.generator.js";
import { v4 as uuidv4 } from "uuid";
import { Hash, randomUUID } from "node:crypto";
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
import revokeTokenModel from "../../DB/models/revokeToken.mode.js";
import {
  block_key_otp,
  block_key_login,
  deleteKey,
  generateOtpKey,
  generate2SVOtpKey,
  generateForgetPasswordOtpKey,
  generateProfileKey,
  generateRevokeTokenKey,
  get,
  increment,
  keys,
  max_Otp_tries,
  max_login_tries,
  setValue,
  ttl,
} from "../../DB/redis/redis.service.js";
import { emailEvents } from "../../common/utilites/email/email.events.js";
import { otpTemplate } from "../../common/utilites/email/otp.template.js";

// Helper function to handle OTP Rate Limiting, Generation, and Storage
const handleOtpWorkflow = async ({
  email,
  subject,
  message,
  redisKeyFunc,
  updateDb = false,
}) => {
  const blockKey = block_key_otp(email);
  const triesKey = max_Otp_tries(email);
  const otpKey = redisKeyFunc(email);

  // 1. Rate Limiting: Check if blocked
  const isBlocked = await ttl(blockKey);
  if (isBlocked > 0) {
    throw new Error(
      `You are blocked, please try again after ${isBlocked} seconds`,
      { cause: 400 },
    );
  }

  // 2. Rate Limiting: Check if OTP was recently sent (TTL check)
  const otpTtl = await ttl(otpKey);
  if (otpTtl > 0) {
    throw new Error(
      `OTP already sent, you can try again in ${otpTtl} seconds`,
      { cause: 400 },
    );
  }

  // 3. Security: Check max tries
  const maxTries = await get({ key: triesKey });
  if (maxTries >= 3) {
    await setValue({ key: blockKey, value: 1, ttl: 60 });
    await deleteKey(triesKey);
    throw new Error(
      "You have reached the maximum number of tries. Please wait 1 minute.",
      { cause: 400 },
    );
  }

  // 4. Action: Generate and Hash
  const otp = generateOtp();
  const hashedOtp = hashPassword({ plainText: otp });

  // 5. Action: Send Email (Backgrounded using emailEvents)
  emailEvents.emit("confirmEmail", async () => {
    await sendEmail({ to: email, subject, message: message(otp) });
  });

  // 6. Storage: Redis
  await setValue({ key: otpKey, value: hashedOtp, ttl: 600 });
  await increment(triesKey);

  // 7. Storage: Database (Optional)
  if (updateDb) {
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db_service.findOneAndUpdate({
      model: userModel,
      filter: { email },
      update: { otp: hashedOtp, otpExpiresAt },
    });
  }
};

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

  let encryptedPhone;
  if (encryptionMode === "asymmetric") {
    encryptedPhone = encryptAsymmetric(phone);
  } else {
    encryptedPhone = symmetricEncryption(phone);
  }
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
        profilePicture: req.files?.attachment?.[0]?.path,
        coverPictures: arr_paths,
      },
    });

    // Now called directly: Redis/DB updates are awaited, but the email part is backgrounded inside the helper
    await handleOtpWorkflow({
      email,
      subject: "Confirm your email - Saraha App",
      message: (otp) => otpTemplate({ userName, otp, subject: "Email Confirmation" }),
      redisKeyFunc: generateOtpKey,
      updateDb: true,
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

export const confirmEmail = async (req, res) => {
  const { email, code } = req.body;
  const otpValue = await get({ key: generateOtpKey(email) });
  if (!otpValue) {
    throw new Error("otp not found or expired", { cause: 404 });
  }
  if (!comparePassword({ PlainText: code, cipherText: otpValue })) {
    throw new Error("otp is incorrect", { cause: 401 });
  }
  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: false },
      provider: providerEnum.system,
    },
    update: { confirmed: true },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  await deleteKey(generateOtpKey(email));
  await deleteKey(max_Otp_tries(email)); // Clear tries on success
  responseSuccess({
    res,
    status: 200,
    message: "email confirmed successfully",
  });
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: false },
      provider: providerEnum.system,
    },
  });
  if (!user) {
    throw new Error("user not found or already confirmed", { cause: 404 });
  }

  await handleOtpWorkflow({
    email,
    subject: "Resend OTP - Saraha App",
    message: (otp) => otpTemplate({ userName: user.userName, otp, subject: "Resending OTP" }),
    redisKeyFunc: generateOtpKey,
    updateDb: true,
  });

  responseSuccess({
    res,
    status: 200,
    message: "OTP resent successfully",
  });
};

export const signUpGmail = async (req, res) => {
  const { idToken } = req.body;
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
      notBefore: 10, //in seconds,when the token will be valid
      // jwtid: uuidv4(),
      jwtid: randomUUID(),
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

  let encryptedPhone;
  if (encryptionMode === "asymmetric") {
    encryptedPhone = encryptAsymmetric(phone);
  } else {
    encryptedPhone = symmetricEncryption(phone);
  }

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
        profilePicture: {
          secure_url,
          public_id,
        },
      },
    });

    // Consistent with the standard signup path
    await handleOtpWorkflow({
      email,
      subject: "Confirm your email - Saraha App",
      message: (otp) => otpTemplate({ userName, otp, subject: "Email Confirmation" }),
      redisKeyFunc: generateOtpKey,
      updateDb: true,
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

  const isBlocked = await ttl(block_key_login(email));
  if (isBlocked > 0) {
    throw new Error(
      `Account temporarily banned. Please try again after ${isBlocked} seconds`,
      { cause: 403 },
    );
  }

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      provider: providerEnum.system,
      // confirmed: true,// if the value can be true or false
      confirmed: { $exists: true },
    },
  });
  if (!user) {
    throw new Error("user not found, or email is not confirmed", {
      cause: 404,
    });
  }
  const match = comparePassword({
    PlainText: password,
    cipherText: user.password,
  });
  if (!match) {
    await increment(max_login_tries(email));
    const failed_tries = await get({ key: max_login_tries(email) });

    if (failed_tries >= 5) {
      await setValue({ key: block_key_login(email), value: 1, ttl: 300 }); // 300 seconds = 5 minutes
      await deleteKey(max_login_tries(email)); // Reset the counter so they don't get banned instantly again after 5 mins
      throw new Error(
        "Account temporarily banned due to 5 consecutive failed login attempts",
        { cause: 403 },
      );
    }

    throw new Error("password is incorrect", { cause: 401 });
  }

  await deleteKey(max_login_tries(email)); // Reset the counter on a successful login

  if (user.twoStepVerification) {
    // Use the centralized helper for 2SV login attempts to ensure rate-limiting
    await handleOtpWorkflow({
      email: user.email,
      subject: "Login 2-Step Verification - Saraha App",
      message: (otp) => otpTemplate({ userName: user.userName, otp, subject: "Login Verification" }),
      redisKeyFunc: generate2SVOtpKey,
    });

    return responseSuccess({
      res,
      status: 200,
      message:
        "2-step verification required. Please check your email for the OTP.",
      data: { require2SV: true },
    });
  }

  // res.status(200).json({ message: "user login successfully", user });
  const jwtid = randomUUID();
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
      notBefore: 10, //in seconds,when the token will be valid
      // jwtid: uuidv4(),
      jwtid,
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
      notBefore: 10, //in seconds,when the token will be valid
      // jwtid: uuidv4(),
      jwtid,
    },
  });

  responseSuccess({
    res,
    status: 200,
    message: "user login successfully",
    data: { access_token, refresh_token },
  });
};

export const requestEnable2SV = async (req, res) => {
  if (req.user.twoStepVerification) {
    throw new Error("2-step verification is already enabled", { cause: 400 });
  }

  await handleOtpWorkflow({
    email: req.user.email,
    subject: "Enable 2-Step Verification - Saraha App",
    message: (otp) => otpTemplate({ userName: req.user.userName, otp, subject: "Enabling 2-Step Verification" }),
    redisKeyFunc: generate2SVOtpKey,
  });

  responseSuccess({
    res,
    status: 200,
    message: "OTP sent to your email to confirm 2-step verification",
  });
};

export const confirmEnable2SV = async (req, res) => {
  const { code } = req.body;
  const otpValue = await get({ key: generate2SVOtpKey(req.user.email) });

  if (!otpValue) {
    throw new Error("OTP not found or expired", { cause: 404 });
  }
  if (!comparePassword({ PlainText: code, cipherText: otpValue })) {
    throw new Error("OTP is incorrect", { cause: 401 });
  }

  await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: req.user._id },
    update: { twoStepVerification: true },
  });

  await deleteKey(generate2SVOtpKey(req.user.email));
  await deleteKey(max_Otp_tries(req.user.email)); // Clear tries on success
  await deleteKey(generateProfileKey(req.user._id)); // clear cache since profile changed

  responseSuccess({
    res,
    status: 200,
    message: "2-step verification enabled successfully",
  });
};

export const confirmLogin2SV = async (req, res) => {
  const { email, code } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: { email, provider: providerEnum.system },
  });

  if (!user || !user.twoStepVerification) {
    throw new Error("Invalid request or 2-step verification not enabled", {
      cause: 400,
    });
  }

  const otpValue = await get({ key: generate2SVOtpKey(email) });
  if (!otpValue) {
    throw new Error("OTP not found or expired", { cause: 404 });
  }

  if (!comparePassword({ PlainText: code, cipherText: otpValue })) {
    throw new Error("OTP is incorrect", { cause: 401 });
  }

  await deleteKey(generate2SVOtpKey(email));
  await deleteKey(max_Otp_tries(email)); // Clear tries on success

  // Generate the actual tokens now that 2SV is verified
  const jwtid = randomUUID();
  const access_token = generateToken({
    payload: { id: user._id, email: user.email },
    signature: JWT_ACCESS_SECRET,
    options: {
      expiresIn: "1d",
      audience: "user",
      issuer: "Saraha",
      notBefore: 10,
      jwtid,
    },
  });

  const refresh_token = generateToken({
    payload: { id: user._id, email: user.email },
    signature: JWT_REFRESH_SECRET,
    options: {
      expiresIn: "7y",
      audience: "user",
      issuer: "Saraha",
      notBefore: 10,
      jwtid,
    },
  });

  responseSuccess({
    res,
    status: 200,
    message: "User logged in successfully",
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

  const key = generateProfileKey(req.user._id);
  const userExists = await get({ key });
  if (userExists) {
    return responseSuccess({
      res,
      status: 200,
      message: "Profile fetched successfully",
      data: userExists,
    });
  }
  await setValue({ key, value: req.user, ttl: 60 });
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
      notBefore: 10, //in seconds,when the token will be valid
      // jwtid: uuidv4(),
      jwtid: randomUUID(),
    },
  });

  responseSuccess({
    res,
    status: 200,
    message: "user login successfully",
    data: { access_token },
  });
};

export const shareProfile = async (req, res) => {
  const { id } = req.params;
  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: id },
    options: { select: "-password -otp -__v" },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }

  // 1. Increment Logic (Fetch -> Calculate -> Update)
  const currentCount = user.viewCount || 0;
  await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: id },
    update: { viewCount: currentCount + 1 },
  });

  // 2. Hide viewCount from public response
  // converting to object ensures we can delete properties effectively if 'user' is a strict mongoose doc
  const userData = user.toObject ? user.toObject() : user;
  delete userData.viewCount;

  if (user.encryptionMode === "asymmetric") {
    userData.phone = decryptAsymmetric(user.phone);
  } else {
    userData.phone = symmetricDecryption(user.phone);
  }
  responseSuccess({
    res,
    status: 200,
    message: "Profile fetched successfully",
    data: userData,
  });
};

export const getProfileVisits = async (req, res) => {
  const { id } = req.params;
  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: id },
    options: { select: "viewCount" },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  responseSuccess({
    res,
    status: 200,
    message: "Profile visits fetched successfully",
    data: { viewCount: user.viewCount },
  });
};

export const updateProfile = async (req, res) => {
  let { firstName, lastName, phone, gender } = req.body;
  if (!firstName && !lastName && !phone && !gender) {
    throw new Error("at least one field is required", { cause: 400 });
  }
  if (phone) {
    if (req.user.encryptionMode === "asymmetric") {
      phone = encryptAsymmetric(phone);
    } else {
      phone = symmetricEncryption(phone);
    }
  }
  const updatedUser = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: req.user._id },
    update: { firstName, lastName, phone, gender },
    options: { select: "-password -otp -__v", returnDocument: "after" },
  });

  if (updatedUser.encryptionMode === "asymmetric") {
    updatedUser.phone = decryptAsymmetric(updatedUser.phone);
  } else {
    updatedUser.phone = symmetricDecryption(updatedUser.phone);
  }
  await deleteKey(generateProfileKey(req.user._id)); //delete cache so that it gets updated
  responseSuccess({
    res,
    status: 200,
    message: "Profile updated successfully",
    data: updatedUser,
  });
};

export const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new Error("oldPassword and newPassword are required", { cause: 400 });
  }

  const match = comparePassword({
    PlainText: oldPassword,
    cipherText: req.user.password,
  });
  if (!match) {
    throw new Error("old password is incorrect", { cause: 401 });
  }
  const hashedPassword = hashPassword({
    plainText: newPassword,
    salt: SALT_ROUNDS,
  });
  const updatedUser = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: req.user._id },
    update: { password: hashedPassword, changeCredentials: new Date() },
    options: { select: "-password -otp -__v", returnDocument: "after" },
  });

  await deleteKey(generateProfileKey(req.user._id));

  responseSuccess({
    res,
    status: 200,
    message: "Password updated successfully",
    data: updatedUser,
  });
};

export const forgetPassword = async (req, res) => {
  const { email } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: { email, provider: providerEnum.system },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }

  await handleOtpWorkflow({
    email,
    subject: "Reset your password - Saraha App",
    message: (otp) => otpTemplate({ userName: user.userName, otp, subject: "Password Reset" }),
    redisKeyFunc: generateForgetPasswordOtpKey,
  });

  responseSuccess({
    res,
    status: 200,
    message: "OTP sent to your email to reset password",
  });
};

export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  const otpValue = await get({ key: generateForgetPasswordOtpKey(email) });
  if (!otpValue) {
    throw new Error("OTP not found or expired", { cause: 404 });
  }

  if (!comparePassword({ PlainText: code, cipherText: otpValue })) {
    throw new Error("OTP is incorrect", { cause: 401 });
  }

  const hashedPassword = hashPassword({
    plainText: newPassword,
    salt: SALT_ROUNDS,
  });

  await db_service.findOneAndUpdate({
    model: userModel,
    filter: { email, provider: providerEnum.system },
    update: { password: hashedPassword, changeCredentials: new Date() },
  });

  await deleteKey(generateForgetPasswordOtpKey(email));
  await deleteKey(max_Otp_tries(email)); // Clear tries on success

  responseSuccess({
    res,
    status: 200,
    message: "Password reset successfully",
  });
};

export const logout = async (req, res) => {
  const { flag } = req.query;

  if (flag === "all") {
    await db_service.findOneAndUpdate({
      model: userModel,
      filter: { _id: req.user._id },
      update: { changeCredentials: new Date() },
    });
    // 1. Revoke Token from local DB
    // await db_service.deleteMany({
    //   model: revokeTokenModel,
    //   filter: { userId: req.user._id },
    // });
    // 2. Revoke Token from Redis
    await deleteKey(await keys(generateRevokeTokenKey(req.user._id)));
    return responseSuccess({
      res,
      status: 200,
      message: "Logged out from all devices successfully",
    });
  } else {
    // 1. Revoke Token from local DB
    // await db_service.create({
    //   model: revokeTokenModel,
    //   date: {
    //     tokenId: req.decoded.jti,
    //     userId: req.user._id,
    //     expiresAt: new Date(req.decoded.exp * 1000),
    //   },
    // });

    // 2. Revoke Token from Redis
    await setValue({
      key: generateRevokeTokenKey(req.user._id, req.decoded.jti),
      value: `${req.decoded.jti}`,
      ttl: req.decoded.exp - Math.floor(Date.now() / 1000),
    });
    return responseSuccess({
      res,
      status: 200,
      message: "Logged out from this device successfully",
    });
  }
};

export const uploadCoverPicture = async (req, res, next) => {
  const files = req.files?.attachments;
  if (!files || files.length === 0) {
    throw new Error("file is required", { cause: 400 });
  }

  // 1. Prepare the new list of cover pictures
  const existingCovers = req.user.coverPictures || [];
  const newPaths = files.map((file) => file.path);
  const finalCoverPictures = [...existingCovers, ...newPaths];

  // 2. Validate limit
  if (finalCoverPictures.length > 2) {
    for (const file of files) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
    throw new Error(
      `Total cover pictures cannot exceed 2. Existing: ${existingCovers.length}, New: ${files.length}`,
      { cause: 400 },
    );
  }
  const updatedUser = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: req.user._id },
    update: { coverPictures: finalCoverPictures },
    options: { select: "-password -otp -__v", returnDocument: "after" },
  });
  responseSuccess({
    res,
    status: 200,
    message: "Cover pictures uploaded successfully",
    data: updatedUser,
  });
};

export const uploadProfilePicture = async (req, res, next) => {
  const file = req.file;
  if (!file) {
    throw new Error("file is required", { cause: 400 });
  }
  const currentGallery = req.user.gallery ? [...req.user.gallery] : [];
  if (req.user.profilePicture) {
    currentGallery.push(req.user.profilePicture);
  }
  const updatedUser = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: req.user._id },
    update: { profilePicture: file.path, gallery: currentGallery },
    options: { select: "-password -otp -__v", returnDocument: "after" },
  });

  responseSuccess({
    res,
    status: 200,
    message: "Profile picture uploaded successfully",
    data: updatedUser,
  });
};

export const deleteProfilePicture = async (req, res, next) => {
  if (!req.user.profilePicture) {
    throw new Error("No profile picture to delete", { cause: 404 });
  }

  if (
    typeof req.user.profilePicture === "string" &&
    fs.existsSync(req.user.profilePicture)
  ) {
    fs.unlinkSync(req.user.profilePicture);
  }

  const updatedUser = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: req.user._id },
    update: { profilePicture: null },
    options: { select: "-password -otp -__v", returnDocument: "after" },
  });

  responseSuccess({
    res,
    status: 200,
    message: "Profile picture deleted successfully",
    data: updatedUser,
  });
};
