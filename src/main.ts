import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import passportConfig from './config/passportConfig';
import dotenv from 'dotenv';
import routes from './routes/index';

const app = express();

//------------ Passport Configuration ------------//
passportConfig(passport);

//------------ DB Configuration ------------//
dotenv.config();
const MongoURI = process.env.MONGO_URI;

//------------ Mongo Connection ------------//
mongoose.connect(MongoURI || '')
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch(err => console.log(err));

//------------ Bodyparser Configuration ------------//
app.use(express.urlencoded({ extended: false }));
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
app.use('/auth', routes);

//------------ Global variables ------------//
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => 
  console.log(`Server running on PORT ${PORT}`)
);