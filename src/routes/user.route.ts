import express from "express"
import { registerValidator } from "../utils/validators/userValidator"
import { validatorResult } from "../middlewares/validator/validatorResult.middleware"
import { Register } from "../controllers/example.controller"

const router = express.Router()

router.post("/register", registerValidator, validatorResult,)
router.get("/register", Register)

export default router