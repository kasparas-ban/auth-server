import { Request, Response, NextFunction } from "express";
import passport from 'passport';

//------------ Login Handle ------------//
const loginHandle = (req: Request, res: Response, next: NextFunction) => {
  console.log('LOGIN HANDLE')
  passport.authenticate('local', {
      successRedirect: '/main',
      failureRedirect: '/auth/login',
      failureMessage: true
      // failureFlash: true
  })(req, res, next);
}

//------------ Logout Handle ------------//
const logoutHandle = (req: Request, res: Response) => {
  // req.logout();
  // req.flash('success_msg', 'You are logged out');
  // res.redirect('/auth/login');
}

export { loginHandle, logoutHandle };