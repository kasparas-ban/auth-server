import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../models/User";

type ErrorMsg = { msg: string };

//------------ Forgot Password Handle ------------//
const forgotPassword = (req: Request, res: Response) => {
  const { email } = req.body;

  const errors: ErrorMsg[] = [];

  //------------ Checking required fields ------------//
  if (!email) {
    errors.push({ msg: "Please enter an email ID" });
  }

  if (errors.length > 0) {
    res.status(500);
    res.render("error", { error: errors });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (!user) {
        //------------ User does not exist ------------//
        errors.push({ msg: "User with Email ID does not exist!" });
        res.status(500);
        res.render("error", { error: errors });
      } else {
        if (!process.env.JWT_RESET_KEY) throw Error;
        const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_KEY, {
          expiresIn: "30m",
        });
        const CLIENT_URL = "http://" + req.headers.host;
        const output = `
                <h2>Please click on below link to reset your account password</h2>
                <p>${CLIENT_URL}/auth/forgot/${token}</p>
                <p><b>NOTE: </b> The activation link expires in 30 minutes.</p>
                `;

        User.updateOne({ resetLink: token }, (err: any, success: any) => {
          if (err) {
            errors.push({ msg: "Error resetting password!" });
            res.render("forgot", {
              errors,
              email,
            });
          } else {
            const transporter = nodemailer.createTransport({
              host: process.env.HOST_SERVER,
              port: 465,
              secure: true,
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
              },
            });

            // send mail with defined transport object
            const mailOptions = {
              from: '"Auth Admin" <password_reset@placidtalk.com>', // sender address
              to: email, // list of receivers
              subject: "Account Password Reset: NodeJS Auth ✔", // Subject line
              html: output, // html body
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log(error);
                // req.flash(
                //   "error_msg",
                //   "Something went wrong on our end. Please try again later."
                // );
                // res.redirect("/auth/forgot");
              } else {
                console.log("Mail sent : %s", info.response);
                // req.flash(
                //   "success_msg",
                //   "Password reset link sent to email ID. Please follow the instructions."
                // );
                // res.redirect("/auth/login");
              }
            });
          }
        });
      }
    });
  }
};

//------------ Redirect to Reset Handle ------------//
const gotoReset = (req: Request, res: Response) => {
  const { token } = req.params;

  if (token) {
    if (!process.env.JWT_RESET_KEY) throw Error;
    jwt.verify(token, process.env.JWT_RESET_KEY, (err, decodedToken) => {
      if (err) {
        // req.flash("error_msg", "Incorrect or expired link! Please try again.");
        // res.redirect("/auth/login");
        res.render("error", { error: "Incorrect or expired link! Please try again." });
      } else {
        if (!decodedToken || typeof decodedToken === 'string') throw Error;
        const { _id } = decodedToken;
        User.findById(_id, (err: any, user: any) => {
          if (err) {
            // req.flash(
            //   "error_msg",
            //   "User with email ID does not exist! Please try again."
            // );
            // res.redirect("/auth/login");
            res.render("error", { error: "User with email ID does not exist! Please try again." });
          } else {
            res.redirect(`/auth/reset/${_id}`);
          }
        });
      }
    });
  } else {
    console.log("Password reset error!");
  }
};

const resetPassword = (req: Request, res: Response) => {
  // let { password, password2 } = req.body;
  let password = req.body.password;
  const password2 = req.body.password2;
  const id = req.params.id;

  //------------ Checking required fields ------------//
  if (!password || !password2) {
    // req.flash(
    //     'error_msg',
    //     'Please enter all fields.'
    // );
    // res.redirect(`/auth/reset/${id}`);
    res.render("forgot", { error: "Please enter all fields." });
  }

  //------------ Checking password length ------------//
  else if (password.length < 8) {
    // req.flash(
    //     'error_msg',
    //     'Password must be at least 8 characters.'
    // );
    // res.redirect(`/auth/reset/${id}`);
    res.render("forgot", { error: "Password too short" });
  }

  //------------ Checking password mismatch ------------//
  else if (password != password2) {
    // req.flash(
    //     'error_msg',
    //     'Passwords do not match.'
    // );
    // res.redirect(`/auth/reset/${id}`);
    res.render("forgot", { error: "Passwords dont match" });
  } else {
    bcryptjs.genSalt(10, (err, salt) => {
      bcryptjs.hash(password, salt, (err, hash) => {
        if (err) throw err;
        password = hash;

        User.findByIdAndUpdate({ _id: id }, { password }, (err, result) => {
          if (err) {
            // req.flash("error_msg", "Error resetting password!");
            // res.redirect(`/auth/reset/${id}`);
            res.render("error", { error: "Error resetting password!" });
          } else {
            // req.flash("success_msg", "Password reset successfully!");
            // res.redirect("/auth/login");
            console.log("Password reset successfully");
          }
        });
      });
    });
  }
};

export { forgotPassword };
