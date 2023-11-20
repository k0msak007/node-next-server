import { body } from "express-validator";

export const registerValidator = [
  body("username").not().isEmpty().withMessage("Username is required"),
  body("email")
    .not()
    .isEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),
  body("password")
    .not()
    .isEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 20 })
    .withMessage("Password must be between 6 and 20 characters"),
];
