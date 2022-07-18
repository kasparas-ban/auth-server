import mongoose from 'mongoose';
import passport from 'passport';
import dotenv from 'dotenv';
import passportConfig from './config/passportConfig';
import app from './app';

//------------ Passport Configuration ------------//
passportConfig(passport);

//------------ DB Configuration ------------//
dotenv.config();
const MongoURI = process.env.MONGO_URI;

//------------ Mongo Connection ------------//
mongoose.connect(MongoURI || '')
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch(err => console.log(err));

//------------ Global variables ------------//
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => 
  console.log(`Server running on PORT ${PORT}`)
);