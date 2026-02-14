import crypto from "node:crypto";
import dotenv from "dotenv";
dotenv.config();

export const encryptAsymmetric = (plainText) => {
  if (!process.env.PUBLIC_KEY) throw new Error("PUBLIC_KEY not found in env");
  
  const encrypted = crypto.publicEncrypt(
    process.env.PUBLIC_KEY.replace(/\\n/g, '\n'),
    Buffer.from(plainText)
  );
  return encrypted.toString("base64");
};

export const decryptAsymmetric = (cipherText) => {
  if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY not found in env");

  const decrypted = crypto.privateDecrypt(
    process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    Buffer.from(cipherText, "base64")
  );
  return decrypted.toString("utf-8");
};
