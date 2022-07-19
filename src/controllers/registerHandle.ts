import { NextFunction, Request, Response } from "express";
import fs from "fs";
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import User from "../models/User";

type ErrorMsg = { formError: string };
type JWTToken = { name: string, email: string, password: string };
type FormData = { name: string, email: string, password: string, password2: string };

//------------ Register Handle ------------//
const registerHandle = (req: Request, res: Response, next: NextFunction) => {
  const formData: FormData = req.body;

  const errors = validateRegistrationForm(formData);
  if (errors.length !== 0) {
    res.status(400);
    next({ errors });
    return;
  }

  //------------ Validation passed ------------//
  User.findOne({ email: formData.email }).then((user) => {
    if (user) {
      //------------ User already exists ------------//
      errors.push({ formError: "Email ID already registered" });
      res.status(400);
      next({ errors });
    } else {
      //sendValidationEmail(name, email, password, req.headers.host ?? "");
      res.sendStatus(201);
    }
  }).catch((err) => {
    res.status(500);
    next({ errors: { databaseError: err }});
  });
};

const validateRegistrationForm = (formData: FormData) => {
  const { name, email, password, password2 } = formData;
  const errors: ErrorMsg[] = [];

    //------------ Checking required fields ------------//
    if (!name || !email || !password || !password2)
      errors.push({ formError: "Not all form fields were filled" });
  
    //------------ Checking password mismatch ------------//
    if (password != password2)
      errors.push({ formError: "Passwords do not match" });
  
    //------------ Checking password length ------------//
    if (!password || password.length < 10) 
      errors.push({ formError: "Password must be at least 10 characters" });

    //------------ Checking if email format is valid ------------//
    const isValidEmail = 
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
      .test(email);
    if (!isValidEmail)
      errors.push({ formError: "Provided email does not have a valid form" });

    //------------ Checking if data contains invalid characters ------------//
    const containsValidChars = 
      /^[a-zA-Z0-9._%=\-!?&*~#$@]*$/.test(name) &&
      /^[a-zA-Z0-9._%=\-!?&*~#$@]*$/.test(email) &&
      /^[a-zA-Z0-9._%=\-!?&*~#$@]*$/.test(password) &&
      /^[a-zA-Z0-9._%=\-!?&*~#$@]*$/.test(password2);
    if (!containsValidChars)
      errors.push({ formError: "Provided field contains invalid characters" });
    
    return errors;
}

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
