import { NextFunction, Request, Response } from "express";
import fs from "fs";
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import User from "../models/User";

type ErrorMsg = { formError: string };
type JWTToken = { name: string; email: string; password: string };
type FormData = {
  name: string;
  email: string;
  password: string;
  password2: string;
};

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
  User.findOne({ email: formData.email })
    .then((user) => {
      if (user) {
        //------------ User already exists ------------//
        errors.push({ formError: "Email ID already registered" });
        res.status(400);
        next({ errors });
      } else {
        sendValidationEmail(
          formData.name,
          formData.email,
          formData.password,
          req.headers.host ?? "",
          next
        );
        res.sendStatus(201);
      }
    })
    .catch((err) => {
      res.status(500);
      next({ errors: { databaseError: err } });
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
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
      email
    );
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
  host: string,
  next: NextFunction
) {
  if (!process.env.JWT_KEY) {
    next({ errors: [{ tokenError: "Unable to access the JWT key" }] });
    return;
  }

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
    from: `"Auth Server" <${process.env.EMAIL_USER}>`, // sender address
    to: email, // list of receivers
    subject: "Account Verification 👋", // Subject line
    generateTextFromHTML: true,
    html: getEmailHtml(confirmUrl), // html body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) next({ errors: [{ sendMailError: error }] });
    console.log("Mail sent : %s", info.response);
  });
}

const activateHandle = (req: Request, res: Response, next: NextFunction) => {
  const token = req.params.token;
  const jwt_key = process.env.JWT_KEY;

  const timeoutMsg = "?timeout=true";
  const userExistsMsg = "?exists=true";
  const activatedMsg = "?activated=true";

  if (token && jwt_key) {
    res.status(500);
    next({
      errors: [{ serverError: "Unable to find the token or the JWT_KEY" }],
    });
    return;
  }

  jwt.verify(token, jwt_key ?? "", (err, decodedToken) => {
    if (err || typeof decodedToken === "string" || !decodedToken) {
      res.status(410);
      res.redirect("http://localhost:3000/register" + timeoutMsg);
      return;
    }

    const { name, email, password } = decodedToken as JWTToken;

    User.findOne({ email: email }).then((user) => {
      if (user) {
        //------------ User already exists ------------//
        res.redirect("http://localhost:3000/login" + userExistsMsg);
      } else {
        const newUser = new User({
          name,
          email,
          password,
        });

        bcryptjs.genSalt(10, (err, salt) => {
          bcryptjs.hash(newUser.password, salt, (err, hash) => {
            if (err) {
              res.status(500);
              next({ errors: [{ serverError: 'Failed to save user details' }] });
            }
            newUser.password = hash;
            newUser
              .save()
              .then((user) => {
                res.redirect("http://localhost:3000/login" + activatedMsg);
              })
              .catch(err => {
                res.status(500);
                next({ errors: [{ databaseError: err }] })
              });
          });
        });
      }
    }).catch(err => {
      next({ errors: [{ databaseError: err }] })
    });
  })
};

export { registerHandle, activateHandle };
