import bcrypt from "bcrypt"

export const hashingPassword = async (password: string): Promise<string> => {
    const hash = await bcrypt.hash(password, 10)

    return hash
}

export const comparePassword =async (password: string, storePassword: string): Promise<boolean> => {
    const isMatching = await bcrypt.compare(password, storePassword)

    return isMatching
}