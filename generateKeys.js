import crypto from "node:crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 512,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

console.log("Copy and paste the following into your .env file:");
console.log("");
console.log(`PUBLIC_KEY="${publicKey.replace(/\n/g, "\\n")}"`);
console.log(`PRIVATE_KEY="${privateKey.replace(/\n/g, "\\n")}"`);