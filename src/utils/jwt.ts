import { Response } from "express";
import jwt from "jsonwebtoken";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// parse environment variables to integrates with fallback value
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

// Options for cookies
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000), //
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000), // วัน
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const signAccessToken = (id: string): string => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN as string, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRE + "m",
  });

  return accessToken;
};

export const signRefreshToken = (id: string): string => {
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN as string, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE + "d",
  });

  return refreshToken;
};

export const sendToken = async (id: string, res: Response) => {
  const accessToken = signAccessToken(id);
  const refreshToken = signRefreshToken(id);

  // Only set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);
};

export const signActivationToken = (
  id: string,
  activationRef: string
): string => {
  const activationToken = jwt.sign(
    { id, activation_reference: activationRef },
    process.env.ACTIVATION_SECRET as string,
    {
      expiresIn: "3m",
    }
  );

  return activationToken;
};
