import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { HttpStatus, secretKey } from "../constant.js";
import { sendMail } from "../utils/sendMail.js";
import { Register, Token } from "../model.js";
import expressAsyncHandler from "express-async-handler";
import registerSchema from "./registerSchema.js";
import { hashPassword } from "../utils/hashing.js";
import { generateToken } from "../utils/token.js";
import successResponse from "../middleware/SuccessResponse.js";

export let registerCreate = expressAsyncHandler(async (req, res, next) => {
  let data = req.body; //taking data from postman
  data.isVerifiedEmail = false; //we set isVerify and isDeactivate to false in code itself and not let the user decide
  // data.isDeactivate = false;
  let email = data.email; //getting email and storing in variable
  let user = await Register.findOne({ email: email }); //Checking if the email is in DB

  if (user) {
    //If it is then show duplicate email error
    let error = new Error("Duplicate email.");
    error.statusCode = 409;
    throw error;
  } else {
    //else hash the password and create User
    let _hashPassword = await hashPassword(data.password);
    data.password = _hashPassword;
    let result = await Register.create(req.body);
    delete result._doc.password; //delete password to not show it in response
    let infoObj = {
      //setting infoObj and expireInfo for generating token
      id: result._id,
      role: result.role,
    };
    let expireInfo = {
      expiresIn: "1d",
    };
    let token = await generateToken(infoObj, expireInfo); //Calling the generate token function
    console.log(token);
    await Token.create({ token });
    let link = `http://localhost:3000/verify-email?token=${token}`;
    await sendMail({
      from: "'Houseobjob'<uniquekc425@gmail.com>",
      to: data.email,
      subject: "account create",
      html: `
      <h1> your account has been created successfully</h1>
      Verify Email
      <a href = "${link}">CLick to verify</a>
      
     
      `,
      //   <a href="http://localhost:3000/verify-email?token=${token}">
      //   http://localhost:3000/verify-email?token=${token}
      //  </a>
    });

    successResponse(
      res,
      HttpStatus.CREATED,
      "User created successfully",
      result
    );
  }
});

// export const registerCreate = async (req, res) => {
//   try {
//     let data = req.body;
//     console.log("data", data);
//     let hashPassword = await bcrypt.hash(data.password, 10);

//     data = {
//       ...data,
//       isVerifiedEmail: false,
//       password: hashPassword,
//     };

//     let result = await Register.create(data);

//     //send email with link
//     //generate tokon
//     let infoObj = {
//       _id: result._id,
//     };

//     let expiryInfo = {
//       expiresIn: "5d",
//     };

//     let token = await jwt.sign(infoObj, secretKey, expiryInfo);

//     // send mail
//     await sendMail({
//       from: "'Houseobjob'<uniquekc425@gmail.com>",
//       to: data.email,
//       subject: "account create",
//       html: `
//       <h1> your account has been created successfully</h1>
//       <a href="http://localhost:3000/verify-email?token=${token}">
//        http://localhost:3000/verify-email?token=${token}
//       </a>
//       `,
//     });

//     res.json({
//       success: true,
//       message: "user created successfully.",
//       data: result,
//     });
//   } catch (error) {
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// code to verify email
// export const verifyEmail = async (req, res) => {
//   try {
//     let tokenString = req.headers.authorization;
//     let tokenArray = tokenString.split(" ");
//     let token = tokenArray[1];
//     console.log(token);
//     let infoObj = await jwt.verify(token, secretKey);
//     let userId = infoObj._id;
//     let result = await Register.findByIdAndUpdate(
//       userId,
//       {
//         isVerifiedEmail: true,
//       },
//       {
//         new: true,
//       }
//     );
//     res.json({
//       success: true,
//       message: "User verified successfully",
//     });
//   } catch (error) {
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export let verifyEmail = expressAsyncHandler(async (req, res, next) => {
  let id = req.info.id; //getting id from query and setting it in a variable
  console.log("id of verify email", id);
  let tokenId = req.token.tokenId; //sent token inside isAuthenticated and received tokenId through it
  console.log(tokenId);
  let result = await Register.findByIdAndUpdate(
    //This line updates the user document in the database with the provided id.
    id,
    { isVerifiedEmail: true }, //isVerify is set to true, initially its false
    { new: true } //this updates the response at once and need not hit the postman twice
  );
  // delete result._doc.password;    //password should not be shown so we delete it

  successResponse(
    res,
    HttpStatus.CREATED,
    "Email verified successfully.",
    result
  );
});

export const loginUser = async (req, res, next) => {
  try {
    console.log("entered email controller");
    let email = req.body.email;
    let password = req.body.password;
    console.log(password);
    let user = await Register.findOne({ email: email });
    console.log(user);
    if (user) {
      if (user.isVerifiedEmail) {
        let isValidpassword = await bcrypt.compare(password, user.password);
        if (isValidpassword) {
          let infoObj = {
            _id: user._id,
          };
          let expiryInfo = {
            expiresIn: "365d",
          };
          let token = await jwt.sign(infoObj, secretKey, expiryInfo);
          //getting id from query and setting it in a variable

          res.json({
            success: true,
            message: "user login successful.",
            data: user,
            token: token,
          });
        } else {
          let error = new Error("Password not valid");
          error.statusCode = 401;
          throw error;
        }
      } else {
        let error = new Error("user not verified");
        error.statusCode = 401;

        throw error;
      }
    } else {
      let error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};
export const myProfile = async (req, res, next) => {
  let userId = req._id;
  try {
    let result = await Register.findById(userId);
    res.json({
      success: true,
      message: "register read successfully",
      data: result,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "unable to read profile",
    });
  }
};
export let logout = expressAsyncHandler(async (req, res, next) => {
  let tokenId = req.token.tokenId;
  console.log(tokenId);
  let result = await Token.findByIdAndDelete(tokenId);
  successResponse(res, HttpStatus.OK, "logout successfully", result);
});
export const updateProfile = async (req, res, next) => {
  try {
    console.log("update here");
    let _id = req._id;
    let data = req.body;
    delete data.email;
    delete data.password;
    let result = await Register.findByIdAndUpdate(_id, data, { new: true });
    res.json({
      success: true,
      message: "profile updated successfully",
      data: result,
    });
  } catch (error) {
    console.log("error caught", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};
export const updatePassword = async (req, res, next) => {
  try {
    let _id = req._id;
    // let data = req.body;
    let oldPassword = req.body.password;
    let newPassword = req.body.newPassword;
    // let { oldPassword, newPassword } = req.body;
    let data = await Register.findById(_id); //find data of this id
    let hashPassword = data.password;
    let isValidPassword = await bcrypt.compare(oldPassword, hashPassword);
    if (isValidPassword) {
      let newHashPassword = await bcrypt.hash(newPassword, 10);
      let result = await Register.findByIdAndUpdate(
        _id,
        {
          password: newHashPassword,
        },
        { new: true }
      );
      res.json({
        success: true,
        message: "passowrd updated successfully",
        data: result,
      });
    } else {
      let error = new Error("Credintial does not match");
      throw error;
    }

    // console.log(data);

    // let hasCode = await bcrypt.hash(password, 10);
    // let isValidPAss = await bcrypt.compare(password, hasCode);
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};
export const readAllUser = async (req, res, next) => {
  try {
    let results = await Register.find({});
    res.status(200).json({
      success: true,
      message: "data read successfully",
      data: results,
    });
  } catch (error) {
    res.json({
      success: true,
      message: error.message,
    });
  }
};
export const readUserById = async (req, res, next) => {
  try {
    let id = req.params.id; //to read id through params

    let result = await Register.findById(id);
    res.json({
      success: true,
      message: "Read all users",
      data: result,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};
export const updateSpecificUser = async (req, res, next) => {
  try {
    let id = req.params.id;
    let data = req.body;
    delete data.email;
    delete data.password;
    let result = await Register.findByIdAndUpdate(id, data, { new: true });
    res.json({
      success: true,
      message: "Updated succcessfully",
      data: result,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};
export const forgotPassword = async (req, res, next) => {
  try {
    let email = req.body.email;
    let result = await Register.findOne({ email: email });
    if (result) {
      //generate tokon
      let infoObj = {
        _id: result._id,
      };

      let expiryInfo = {
        expiresIn: "5d",
      };

      let token = await jwt.sign(infoObj, secretKey, expiryInfo);

      // send mail
      await sendMail({
        from: "'Houseobjob'<fbelly11@gmail.com>",
        to: email,
        subject: "Reset Password",
        html: `
      <h1> Click in the link to reset password</h1>
      <a href="http://localhost:3000/reset-password?token=${token}">
       http://localhost:3000/reset-password?token=${token}
      </a>
      `,
      });

      res.status(200).json({
        success: true,
        message: "Link has been changed",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};
export const resetPassword = async (req, res, next) => {
  try {
    let _id = req._id;
    let hashPassword = await bcrypt.hash(req.body.password, 10);
    let result = await Register.findByIdAndUpdate(
      _id,
      {
        password: hashPassword,
      },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "password reset successfully",
      data: result,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};
export const deleteUser = async (req, res, next) => {
  try {
    let id = req.params.id;
    let data = req.body;

    let result = await Register.findByIdAndDelete(id, data, { new: true });
    res.json({
      success: true,
      message: "deleted succcessfully",
      data: result,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};
