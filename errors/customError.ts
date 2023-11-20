// eslint-disable-next-line no-unused-vars
export class CustomError extends Error {
    statusCode: number = 500
    message: string = "Internal Server Error"

    constructor(message?: string, statusCode?: number) {
        super(message);
        
        this.statusCode = statusCode || this.statusCode
        this.message = message || this.message
    }
}