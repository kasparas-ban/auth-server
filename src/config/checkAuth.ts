import { Request, Response, NextFunction } from "express";

const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
      return next();
  }
  // req.flash('error_msg', 'Please log in first!');
  console.log('not authenticated')
  res.redirect('/auth/login');
};

const forwardAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
      return next();
  }
  res.redirect('/main');
};

export { ensureAuthenticated, forwardAuthenticated };