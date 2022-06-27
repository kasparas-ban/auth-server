import passportLocal from 'passport-local';
import brypt from 'bcryptjs';
import { PassportStatic  } from 'passport';
import User from '../models/User';

const LocalStrategy = passportLocal.Strategy;

export default function passportConfig(passport: PassportStatic) {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      (email, password, done) => {
        //------------ User Matching ------------//
        User.findOne({ email }).then(user => {
          if (!user) {
            return done(null, false, { message: 'This email ID is not registered' })
          }

          //------------ Password Matching ------------//
          brypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false, { message: 'Password incorrect! Please try again.' })
            }
          });
        });
      })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));

  passport.deserializeUser((id, done) => {
    User.findById(id, (err: any, user: any) => done(err, user));
  });
}