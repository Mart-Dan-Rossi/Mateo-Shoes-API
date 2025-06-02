const { required } = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'nombre completo requerido'],
    },
    email: {
      type: String,
      required: [true, 'mail requerido'],
      unique: true,
    },
    phoneNumber: {
      type: Number,
      required: [true, 'número telefónico requerido'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'contraseña requerida'],
    },
    token: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      required: false,
    }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
