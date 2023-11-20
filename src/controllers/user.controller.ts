import { NextFunction, Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";

export const Register = (req: Request, res: Response, next: NextFunction) => {
    try {
        
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        next(ErrorHandler(error.message, 500))
    }
}