import { decryptAsymmetric } from "../utilites/security/asymmetric.security.js";
import { symmetricDecryption } from "../utilites/security/encrypt.security.js";
import { verifyToken } from "../utilites/security/toke.security.js";
import * as db_service from "../../DB/models/db.service.js";
import userModel from "../../DB/models/user.model.js";

export const authentication = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new Error("token not found", { cause: 401 });
  }
  if (!authorization.startsWith("Bearer ")) {
    throw new Error("invalid token", { cause: 401 });
  }
const token = authorization.split(" ")[1];
  if (!token) {
    throw new Error("invalid token", { cause: 401 });
  }
  const decoded = verifyToken({ token: token });
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

  let decryptedPhone;
  if (user.encryptionMode === "asymmetric") {
    decryptedPhone = decryptAsymmetric(user.phone);
  } else {
    decryptedPhone = symmetricDecryption(user.phone);
  }

  req.user = {
    ...user._doc,
    phone: decryptedPhone,
  };

  next();
};
