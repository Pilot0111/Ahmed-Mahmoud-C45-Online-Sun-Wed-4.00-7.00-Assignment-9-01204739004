import { decryptAsymmetric } from "../utilites/security/asymmetric.security.js";
import { symmetricDecryption } from "../utilites/security/encrypt.security.js";
import { verifyToken } from "../utilites/security/toke.security.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { JWT_ACCESS_SECRET, PREFIX } from "../../config/config.service.js";
import revokeTokenModel from "../../DB/models/revokeToken.mode.js";
import { get } from "../../DB/redis/redis.service.js";

export const authentication = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new Error("token not found", { cause: 401 });
  }
  if (!authorization.startsWith(PREFIX + " ")) {
    throw new Error("invalid token", { cause: 401 });
  }
  const token = authorization.split(" ")[1];
  if (!token) {
    throw new Error("invalid token", { cause: 401 });
  }
  const decoded = verifyToken({ token: token, signature: JWT_ACCESS_SECRET });
  if (!decoded || !decoded?.id) {
    throw new Error("invalid token", { cause: 401 });
  }

  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: decoded.id },
    options: { select: " -otp -__v" },
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

  if (user.changeCredentials) {
    if (user.changeCredentials.getTime() > decoded.iat * 1000) {
      throw new Error("Credentials changed, please login again", {
        cause: 401,
      });
    }
  }
  // // revoke token check for local db
  // const revokeToken = await db_service.findOne({
  //   model: revokeTokenModel,
  //   filter: { tokenId: decoded.jti },
  // });
  // revoke token check for redis
  const revokeToken = await get({ key: `revokeToken::${user._id}::${decoded.jti}` });
  
  if (revokeToken) {
    throw new Error("token revoked", { cause: 401 });
  }

  req.user = {
    ...user._doc,
    phone: decryptedPhone,
  };
  req.decoded = decoded;

  next();
};
