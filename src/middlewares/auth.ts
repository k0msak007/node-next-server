import { NextFunction, Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { sqlConnection } from "../utils/db";
import { CustomRequest } from "../@types/custom";

export const isAuthentication = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies.access_token;
  if (!accessToken) {
    next(ErrorHandler("Please Login again!", 401));
  }

  try {
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
    const userData = user.recordset[0] as any;

    req.user = userData;
    next();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error:any) {
    return next(ErrorHandler(error.message, 500))
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {

    const userRole = req.user?.Role
    const findRole = roles.findIndex((role) => role === userRole)

    if(findRole === -1) {
      return next(ErrorHandler(`Role ${userRole} is not allowed to access this resource`, 401))
    }

    next()
  }
}
