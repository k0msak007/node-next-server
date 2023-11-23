import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/errorHandler";
import { sqlConnection } from "../utils/db";
import {
  createActivationToken,
  existAccount,
  insertNewUser,
  loginUser,
} from "../services/user.service";
import sendMail from "../utils/sendMail";
import { sendToken } from "../utils/jwt";

export const Register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sql = await sqlConnection();
    const pool = sql.request();

    const isExistsAccount = await existAccount(req.body, pool);
    if (isExistsAccount) {
      return next(ErrorHandler("Username or Email already use", 400));
    }

    const user = await insertNewUser(req.body, pool);

    const { token, activationRef, activationCode } =
      await createActivationToken(user.UserID, pool);

    const data = {
      user: {
        name: req.body.username,
      },
      activationCode,
      activationRef,
    };

    await sendMail({
      email: req.body.email,
      subject: "Activate your account",
      template: "activation-mail.ejs",
      data: data,
    });

    return res.json({
      success: true,
      message: "Please check your email for activate account",
      data: {
        token,
        activationRef,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return next(ErrorHandler(error.message, 500));
  }
};

export const ActivateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const { activationCode } = req.body;
    const sql = await sqlConnection();
    const pool = sql.request();

    // verify and decode data from token
    const decoded = jwt.verify(
      token,
      process.env.ACTIVATION_SECRET as string,
      (err, decoded) => {
        if (err) {
          next(ErrorHandler("Invalid Token", 401));
          return null;
        }

        return decoded;
      }
    );

    if (decoded !== null) {
      // Get verified code
      const queryVerifyStore = `
                SELECT * FROM EmailVerification 
                WHERE UserID = @userid 
                AND ActivationRef = @activationRef
                AND ActivationCode = @activationCode
            `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decodedData = decoded as any;

      pool.input("userid", decodedData.id);
      pool.input("activationRef", decodedData.activation_reference);
      pool.input("activationCode", activationCode);

      const verifiedCodeStore = await pool.query(queryVerifyStore);

      // Update status email verified
      if (verifiedCodeStore.recordset.length > 0) {
        const queryUpdateUserActive = `
            UPDATE Users SET
            Email_Verified = 1
            WHERE UserID = @userid
        `;

        await pool.query(queryUpdateUserActive);

        await sendToken(decodedData.id, res);

        return res.status(200).json({
          success: true,
          message: "Account Activated",
        });
      }

      return next(ErrorHandler("Invalid Activate Code", 401));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return next(ErrorHandler(error.message, 500));
  }
};

export const Login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sql = await sqlConnection();
    const pool = sql.request();

    const userLogin = await loginUser(req.body, pool);
    if (userLogin === null) {
      return next(ErrorHandler("Invalid Username and Password", 401));
    }

    const { isActive, userId, email } = userLogin;

    if (!isActive) {
      const { token, activationRef, activationCode } =
        await createActivationToken(userId, pool);

      const data = {
        user: {
          name: req.body.username,
        },
        activationCode,
        activationRef,
      };

      await sendMail({
        email: email,
        subject: "Activate your account",
        template: "activation-mail.ejs",
        data: data,
      });

      return res.json({
        success: true,
        message: "Please check your email for activate account",
        data: {
          isActive,
          token,
          activationRef,
        },
      });
    } else {
      await sendToken(userId, res);
      return res.json({
        success: true,
        message: "Login Success",
        data: {
          isActive,
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    next(ErrorHandler(error.message, 500));
  }
};

export const UserDetail = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;

    console.log(user);

    res.json({
      user,
      access_token: req.cookies.access_token,
      refresh: req.cookies.refresh_token,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    next(ErrorHandler(error.message, 500));
  }
};
