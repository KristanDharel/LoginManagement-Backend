import jwt from "jsonwebtoken";
import expressAsyncHandler from "express-async-handler";
import { secretKey } from "../constant.js";

export let verifyToken = expressAsyncHandler(async (token) => {
  let infoObj = await jwt.verify(token, secretKey);
  return infoObj;
});

// format of infoObj
// {
//     id:"...",
//     role:"...."

// }

// expiresInfo:{
//     expiresIn:"..."
// }
export let generateToken = expressAsyncHandler(async (infoObj, expireInfo) => {
  let token = await jwt.sign(infoObj, secretKey, expireInfo);
  return token;
});
