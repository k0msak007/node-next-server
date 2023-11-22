import { NextFunction, Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { sqlConnection } from "../utils/db";

export const isAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies.access_token;
  if (!accessToken) {
    next(ErrorHandler("Please Login again!", 401));
  }

  const decoded = jwt.verify(
    accessToken,
    process.env.ACCESS_TOKEN as string
  ) as JwtPayload;
  const userId = decoded.id;

  const sql = await sqlConnection();
  const pool = sql.request();

  const query = `
        SELECT UserID, Username, Email, FirstName, LastName, Role FROM Users WHERE UserID = @userId
    `;
  pool.input("userId", userId);
  const user = await pool.query(query);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userData = user as any;

  console.log(user);
  req.user = userData;
  next();
};
