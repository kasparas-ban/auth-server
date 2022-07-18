import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import routes from './routes/index';
import { ensureAuthenticated } from './config/checkAuth';

const app = express();
app.use(cors());

//------------ Bodyparser Configuration ------------//
// app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//------------ Express Session Configuration ------------//
app.use(
  session({
      secret: 'secret',
      resave: true,
      saveUninitialized: true
  })
);

//------------ Passport Middlewares ------------//
app.use(passport.initialize());
app.use(passport.session());

//------------ Routes ------------//
app.use('/', routes);

//------------ Dashboard Route ------------//
app.get(
  '/main',
  ensureAuthenticated,
  (req, res) => res.send("Congrats! You're in!")
);

export default app;