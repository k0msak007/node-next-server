import { IUser } from "../interface/user.type";

declare global {
    namespace Express {
        interface Request {
            user?: IUser
        }
    }
}