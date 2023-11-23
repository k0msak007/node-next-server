import express from "express"
import { registerValidator } from "../validators/userValidator"
import { validatorResult } from "../middlewares/validator/validatorResult.middleware"
import { ActivateAccount, Login, Logout, RefreshToken, Register, UserDetail } from "../controllers/user.controller"
import { isAuthentication } from "../middlewares/auth"

const router = express.Router()

router.post("/register", registerValidator, validatorResult, Register)
router.post("/activate-code/:token", ActivateAccount)
router.post("/login", Login)
router.get("/refresh-token", RefreshToken)
router.get("/logout", Logout)
router.get("/user-detail", isAuthentication, UserDetail)

export default router