import { body } from "express-validator";

export const registerValidator = [
  body("username")
    .not()
    .isEmpty()
    .withMessage("Username is required")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Username must be minimum 6"),
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
  body("firstname").not().isEmpty().withMessage("Firstname is required").isString(),
  body("lastname").not().isEmpty().withMessage("Lastname is required").isString(),
];
