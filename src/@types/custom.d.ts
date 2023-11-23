import { Request } from "express";
import { IUser } from "../interface/user.type";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export interface CustomRequest extends Request {
  user?: IUser;
}