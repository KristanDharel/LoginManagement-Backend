import { Router } from "express";
import validation from "../middleware/validation.js";
import registerValidation from "../validation/registerValidation.js";
import {
  deleteUser,
  forgotPassword,
  loginUser,
  logout,
  myProfile,
  readAllUser,
  readUserById,
  registerCreate,
  resetPassword,
  updatePassword,
  updateProfile,
  updateSpecificUser,
  verifyEmail,
} from "./registerController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import authorized from "../middleware/authorized.js";
import isAuthenticatedForEmail from "../middleware/isAuthenticatedForEmail.js";

const registerRouter = Router();
registerRouter
  .route("/register")
  .post(validation(registerValidation), registerCreate)
  .post(registerCreate)
  .get(isAuthenticated, readAllUser)

  .get(readUserById);
registerRouter
  .route("/verify-email")
  .post(isAuthenticatedForEmail, verifyEmail);
registerRouter.route("/login").post(loginUser);
registerRouter.route("/my-profile").get(isAuthenticated, myProfile);
registerRouter.route("/update-profile").patch(isAuthenticated, updateProfile);
registerRouter.route("/update-password").patch(
  isAuthenticated, //to send token
  updatePassword
);
registerRouter.route("/forgot-password").get(forgotPassword);
registerRouter.route("/reset-password").patch(isAuthenticated, resetPassword);
registerRouter.route("/logout").delete(isAuthenticatedForEmail, logout);

// registerRouter
//   .route("/:id")
//   .get(isAuthenticated, authorized(["admin", "superadmin"]), readUserById)
//   .patch(
//     isAuthenticated,
//     authorized(["admin", "superadmin"]),
//     updateSpecificUser
//   )
//   .delete(isAuthenticated, authorized(["superadmin"]), deleteUser);

export default registerRouter;

//admin=>user read
//superadmin=>user read, delete user
//customer=> does not have permission to read
