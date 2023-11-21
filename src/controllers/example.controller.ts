import { NextFunction, Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import { sqlConnection } from "../utils/db";

export const Register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sql = await sqlConnection();
    const request = sql.request()

    request.input("name", "master")

    const database = await request.query("SELECT name FROM sys.databases WHERE name = @name;")
    return res.status(200).json({
      database
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log(error);
    
    next(ErrorHandler(error.message, 500));
  }
};
