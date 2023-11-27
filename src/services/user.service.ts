import { Request } from "mssql";
import { ILogin, IRegister } from "../interface/user.type";
import { comparePassword, hashingPassword } from "../utils/password";
import { signActivationToken } from "../utils/jwt";

export const existAccount = async (data: IRegister, pool: Request) => {
  const { username, email } = data;

  const checkUsernameQuery = `SELECT * FROM USERS WHERE Username = @chkUsername OR Email = @chkEmail`;

  pool.input("chkUsername", username);
  pool.input("chkEmail", email);

  const existUser = await pool.query(checkUsernameQuery);

  console.log(existUser);

  if (existUser.recordset.length > 0) {
    return true;
  }

  return false;
};

export const insertNewUser = async (data: IRegister, pool: Request) => {
  const { username, email, password, firstname, lastname } = data;

  const insertUserQuery = `
    Insert into Users (
        Username,
        PasswordHash,
        Email,
        FirstName,
        LastName
    ) VALUES (
        @username,
        @password,
        @email,
        @firstname,
        @lastname
    )
    `;

  const passwordHash = await hashingPassword(password);

  pool.input("username", username);
  pool.input("password", passwordHash);
  pool.input("email", email);
  pool.input("firstname", firstname);
  pool.input("lastname", lastname);

  await pool.query(insertUserQuery);

  const checkUsernameQuery = `SELECT * FROM USERS WHERE Username = @user_return`;

  pool.input("user_return", username);

  const existUser = await pool.query(checkUsernameQuery);

  if (existUser.recordset.length > 0) {
    return existUser.recordset[0];
  } else {
    return null;
  }
};

interface IActivationToken {
  token: string;
  activationRef: string;
  activationCode: string;
}

export const createActivationToken = async (
  userId: string,
  pool: Request
): Promise<IActivationToken> => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const activationRef = result;

  const query = `
  INSERT INTO EmailVerification(
	UserID,
	ActivationCode,
	ActivationRef
) VALUES (
	@userId,
    @activationCode,
    @activationRef
)
  `;

  const token = signActivationToken(userId, activationRef);

  pool.input("userId", userId);
  pool.input("activationCode", activationCode);
  pool.input("activationRef", activationRef);
  pool.query(query);

  return { token, activationRef, activationCode };
};

export const loginUser = async (data: ILogin, pool: Request) => {
  const { username, email, password } = data;

  // Find Username or Email
  const loginQuery = `
        SELECT * FROM Users
        WHERE Username = @username OR Email = @email
    `;

  pool.input("username", username);
  pool.input("email", email);

  const userLogin = await pool.query(loginQuery);
  if (userLogin.recordset.length < 1) {
    return null;
  }

  // Compare Password from store
  const userLoginData = userLogin.recordset[0];
  const isComparePassword = await comparePassword(
    password,
    userLoginData.PasswordHash
  );
  if (!isComparePassword) {
    return null;
  }

  // Check Validate Account
  if (userLoginData.Email_Verified) {
    return {
      isActive: true,
      userId: userLoginData.UserID,
      email: userLoginData.Email,
    };
  } else {
    return {
      isActive: false,
      userId: userLoginData.UserID,
      email: userLoginData.Email,
    };
  }
};

export const getUserFromToken = async (userId: string, pool: Request) => {
  const query = `
    SELECT UserID, Username, Email, FirstName, LastName, Role FROM Users WHERE UserID = @userId
  `;

  pool.input("userId", userId);

  const userData = await pool.query(query);

  if (userData.recordset.length < 1) {
    return null;
  }

  return userData.recordset[0];
};

export const getUserFromUserId = async (userId: string, pool: Request) => {
  const query = `
    SELECT * FROM Users WHERE UserID = @userId
  `;

  pool.input("userId", userId);

  const userData = await pool.query(query);

  if (userData.recordset.length < 1) {
    return null;
  }

  return userData.recordset[0];
};

export const changePassword = async (userId: string, password: string, pool: Request) => {
  try {
    const query = `
      UPDATE Users SET
      PasswordHash = @passwordHash
      WHERE UserId = @userIdMatch
    `;
  
    pool.input("userIdMatch", userId);
    pool.input("passwordHash", password);
  
    await pool.query(query);
  
    return true
  } catch (error) {
    console.error('Error executing query:', error);
    return false;
  }
};

export const getAllUsers = async (pool: Request) => {
  const query = `
      SELECT UserID, Username, Email, FirstName, LastName, Role FROM Users WHERE Role <> 'admin'
    `;

    const users = await pool.query(query);

    return users.recordset
}

export const editUserRole = async (userId: string, role: string, pool: Request) => {
  const query = `
      UPDATE Users SET
      Role = @role
      OUTPUT INSERTED.UserID, INSERTED.FirstName, INSERTED.LastName, INSERTED.Email
      WHERE UserID = @userId
    `;

    pool.input('userId', userId)
    pool.input('role', role)
    const users = await pool.query(query);

    return users.recordset
}