import express from "express"
import { registerValidator } from "../utils/validators/userValidator"
import { validatorResult } from "../middlewares/validator/validatorResult.middleware"

const router = express.Router()

router.post("/register", registerValidator, validatorResult);

export default router