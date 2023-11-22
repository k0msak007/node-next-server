// REQUEST
export interface ILogin {
    username: string
    password: string
    email: string,
}

export interface IRegister extends ILogin {
    firstname: string,
    lastname: string,
    role?: string
}

// RESPONSE
export interface IUser {
    UserID: number,
    Username: string,
    Email: string,
    FirstName: string,
    LastName: string,
    Role: string
}