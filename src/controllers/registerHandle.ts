import { Request, Response } from "express";
import fs from "fs";
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import User from "../models/User";

type ErrorMsg = { msg: string };
type JWTToken = { name: string, email: string, password: string };

//------------ Register Handle ------------//
const registerHandle = (req: Request, res: Response) => {
  const { name, email, password, password2 } = req.body;
  const errors: ErrorMsg[] = [];

  //------------ Checking required fields ------------//
  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please enter all fields" });
  }

  //------------ Checking password mismatch ------------//
  if (password != password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  //------------ Checking password length ------------//
  if (password.length < 8) {
    errors.push({ msg: "Password must be at least 8 characters" });
  }

  if (errors.length > 0) {
    res.status(500);
    res.send(errors);
  } else {
    //------------ Validation passed ------------//
    User.findOne({ email: email }).then((user) => {
      if (user) {
        //------------ User already exists ------------//
        errors.push({ msg: "Email ID already registered" });
        res.status(500);
        res.send(errors);
      } else {
        sendValidationEmail(name, email, password, req.headers.host ?? "");
      }
    });
  }
};

function getEmailHtml(confirmUrl: string) {
  const emailTemplate = fs
    .readFileSync("./src/controllers/emailTemplate.html")
    .toString("utf8")
    .replace("$CONFIRM_URL$", confirmUrl);

  return emailTemplate;
}

function sendValidationEmail(
  name: string,
  email: string,
  password: string,
  host: string
) {
  if (!process.env.JWT_KEY) throw Error;
  const token = jwt.sign({ name, email, password }, process.env.JWT_KEY, {
    expiresIn: "30m",
  });
  const CLIENT_URL = "http://" + host;
  const confirmUrl = `${CLIENT_URL}/auth/activate/${token}`;

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
    from: `"Auth Admin" <${process.env.EMAIL_USER}>`, // sender address
    to: email, // list of receivers
    subject: "Account Verification: NodeJS Auth ✔", // Subject line
    generateTextFromHTML: true,
    html: getEmailHtml(confirmUrl), // html body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      // req.flash(
      //     'error_msg',
      //     'Something went wrong on our end. Please register again.'
      // );
      // res.redirect('http://localhost:3000/register');
    } else {
      console.log("Mail sent : %s", info.response);
      // req.flash(
      //     'success_msg',
      //     'Activation link sent to email ID. Please activate to log in.'
      // );
      // res.redirect('http://localhost:3000/login');
    }
  });
}

const activateHandle = (req: Request, res: Response) => {
  const token = req.params.token;

  console.log('INSIDE ACTIVATE');
  const timeoutMsg = '?timeout=true';
  const userExistsMsg = '?exists=true';
  const activatedMsg = '?activated=true';

  if (token) {
    if (!process.env.JWT_KEY) throw Error;
    jwt.verify(token, process.env.JWT_KEY, (err, decodedToken) => {
      if (err) {
        // req.flash(
        //   "error_msg",
        //   "Incorrect or expired link! Please register again."
        // );
        res.redirect("http://localhost:3000/register" + timeoutMsg);
        console.error('Error occured: ', err);
      } else {
        if (typeof decodedToken === 'string' || !decodedToken) throw Error;
        const { name, email, password } = decodedToken as JWTToken;
        User.findOne({ email: email }).then((user) => {
          if (user) {
            //------------ User already exists ------------//
            // req.flash(
            //   "error_msg",
            //   "Email ID already registered! Please log in."
            // );
            res.redirect("http://localhost:3000/login" + userExistsMsg);
            console.log('email ID already exists!');
          } else {
            const newUser = new User({
              name,
              email,
              password,
            });

            bcryptjs.genSalt(10, (err, salt) => {
              bcryptjs.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser
                  .save()
                  .then((user) => {
                    // req.flash(
                    //   "success_msg",
                    //   "Account activated. You can now log in."
                    // );
                    res.redirect("http://localhost:3000/login" + activatedMsg);
                    console.log('Account activated.');
                  })
                  .catch((err) => console.log(err));
              });
            });
          }
        });
      }
    });
  } else {
    console.log("Account activation error!");
  }
};

export { registerHandle, activateHandle };
