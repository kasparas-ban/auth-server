import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  resetLink: {
    type: String,
    default: '',
  },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;