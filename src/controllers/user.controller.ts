import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ErrorHandler } from "../utils/errorHandler";
import { sqlConnection } from "../utils/db";
import {
  changePassword,
  createActivationToken,
  existAccount,
  getUserFromToken,
  getUserFromUserId,
  insertNewUser,
  loginUser,
} from "../services/user.service";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { comparePassword, hashingPassword } from "../utils/password";

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

    return res.status(200).json({
      success: true,
      message: "Fetch user success",
      data: {
        user,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    next(ErrorHandler(error.message, 500));
  }
};

export const RefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_Token = req.cookies.refresh_token;
    const sql = await sqlConnection();
    const pool = sql.request();

    // verift token
    const decoded = jwt.verify(
      refresh_Token,
      process.env.REFRESH_TOKEN as string
    ) as JwtPayload;

    const message = "Could not refresh token";
    if (!decoded) {
      return next(ErrorHandler(message, 400));
    }

    // get user detail
    const userData = await getUserFromToken(decoded.id, pool);

    if (!userData) {
      return next(ErrorHandler("Invalid data from token"));
    }

    const accessToken = jwt.sign(
      { id: userData.UserID },
      process.env.ACCESS_TOKEN as string,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE + "m",
      }
    );

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp
      ? decoded.exp - now
      : process.env.REFRESH_TOKEN_EXPIRE + "d";

    const refreshToken = jwt.sign(
      { id: userData.UserID },
      process.env.REFRESH_TOKEN as string,
      {
        expiresIn: expiresIn,
      }
    );

    req.user = userData;

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(200).json({
      status: "success",
      accessToken,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    next(ErrorHandler(error.message, 500));
  }
};

export const Logout = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.cookie("access_token", "", { maxAge: 1 });
    res.cookie("refresh_token", "", { maxAge: 1 });

    res.json({
      success: true,
      message: "Logged Successfully",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    next(ErrorHandler(error.message, 500));
  }
};

export const ChangePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { user } = req;
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const sql = await sqlConnection();
  const pool = sql.request();

  if (!user) {
    return next(ErrorHandler("User not found, Please Log in again!", 404));
  }

  const userData = await getUserFromUserId(user.UserID, pool);
  if (!userData) {
    return next(ErrorHandler("User not found, Please Log in again!", 404));
  }

  const isMatchPassword = await comparePassword(
    oldPassword,
    userData.PasswordHash
  );
  if (!isMatchPassword) {
    return next(ErrorHandler("Password is invalid", 400));
  }

  if (newPassword !== confirmPassword) {
    return next(
      ErrorHandler("New password and Confirm password not match", 400)
    );
  }

  const passwordHash = await hashingPassword(newPassword);
  const isUpdate = await changePassword(userData.UserID, passwordHash, pool);

  if (isUpdate) {
    return res.status(200).json({
      success: true,
      message: "Change password successfully",
    });
  } else {
    return next(ErrorHandler("Change password failed", 400));
  }
};
