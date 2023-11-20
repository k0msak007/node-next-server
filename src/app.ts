import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import userRouter from "./routes/user.route";

export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(morgan("dev"));
  app.use(cors());

  app.use("/api/user", userRouter);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  });

  return app;
};
