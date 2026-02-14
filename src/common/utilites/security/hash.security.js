import {hashSync, compareSync} from "bcrypt";

export const hashPassword = ({plainText, salt=12}={}) => hashSync(plainText, salt);
export const comparePassword = ({PlainText, cipherText}={}) => compareSync(PlainText, cipherText);