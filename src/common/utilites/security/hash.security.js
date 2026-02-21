import { hashSync, compareSync } from "bcrypt";

export const hashPassword = ({
  plainText,
  salt = process.env.SALT_ROUNDS,
} = {}) => hashSync(plainText, Number(salt));
export const comparePassword = ({ PlainText, cipherText } = {}) =>
  compareSync(PlainText, cipherText);
