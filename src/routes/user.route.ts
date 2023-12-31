import express from "express"
import { changePasswordValidor, registerValidator } from "../validators/userValidator"
import { validatorResult } from "../middlewares/validator/validatorResult.middleware"
import { ActivateAccount, ChangePassword, EditRoleUser, GetAllUser, Login, Logout, RefreshToken, Register, UserDetail } from "../controllers/user.controller"
import { authorizeRoles, isAuthentication } from "../middlewares/auth"

const router = express.Router()

router.post("/register", registerValidator, validatorResult, Register)
router.post("/activate-code/:token", ActivateAccount)
router.post("/login", Login)
router.get("/refresh-token", RefreshToken)
router.get("/logout", Logout)

router.get("/user-detail", isAuthentication, UserDetail)
router.post("/change-password", isAuthentication, changePasswordValidor, validatorResult, ChangePassword)

router.get("/get-all-users", isAuthentication, authorizeRoles("admin"), GetAllUser)
router.put("/edit-role-users", isAuthentication, authorizeRoles("admin"), EditRoleUser)

export default router