import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const getBearerToken = (str: string) => {
  if (!str || !str.startsWith("Bearer ")) return null;
  return str.slice(7).trim();
};

export const resolveToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const createToken = (data: any) => {
  return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "60d" });
};

export const hashPasssword = async (password: string) =>
  bcrypt.hash(password, await bcrypt.genSalt());

export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);
