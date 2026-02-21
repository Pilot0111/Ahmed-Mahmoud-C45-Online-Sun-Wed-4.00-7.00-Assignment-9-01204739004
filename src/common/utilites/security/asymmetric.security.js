import crypto from "node:crypto";
import dotenv from "dotenv";
import { PRIVATE_KEY, PUBLIC_KEY } from "../../../config/config.service.js";
dotenv.config();

export const encryptAsymmetric = (plainText) => {
  if (!PUBLIC_KEY) throw new Error("PUBLIC_KEY not found in env");
  
  const encrypted = crypto.publicEncrypt(
    PUBLIC_KEY.replace(/\\n/g, '\n'),
    Buffer.from(plainText)
  );
  return encrypted.toString("base64");
};

export const decryptAsymmetric = (cipherText) => {
  if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY not found in env");

  const decrypted = crypto.privateDecrypt(
    PRIVATE_KEY.replace(/\\n/g, '\n'),
    Buffer.from(cipherText, "base64")
  );
  return decrypted.toString("utf-8");
};
