import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET } from "../../../config/config.service.js";

export const generateToken = ({ payload, signature = JWT_ACCESS_SECRET, options = {} } = {}) =>{
    if (!signature) {
        throw new Error("Token signature (secret key) is required");
    }
    return jwt.sign(payload, signature, options);
}

export const verifyToken = ({ token, signature = JWT_ACCESS_SECRET, options = {} } = {}) =>
  jwt.verify(token, signature, options);
