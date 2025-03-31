const mongoose = require('mongoose');

const mpOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    phone: {
      type: String,
      required: [true, 'Number is required'],
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: [true, 'User is required'],
        },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
        },
      },
    ],
  },
  { timestamps: true }
);

const MPOrder = mongoose.model('mpOrder', mpOrderSchema);

module.exports = MPOrder;

const beOrderSchema = new mongoose.Schema(
  {
    user: {
      name: { type: String, required: true },
      id: { type: String, required: true },
      email: { type: String, required: true },
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    phone: {
      type: String,
      required: [true, "Number is required"],
    },
    mail: {
      type: String,
      required: [true, "Phone is required"],
    },
    products: [
      {
        id: { type: String, required: false },
        name: { type: String, required: false },
        price: { type: String, required: false },
        sizeOption: {
          usSize: { type: Number },
          color: { type: String },
          quantity: { type: Number },
        },
      },
    ],
    isDelivered: {
      type: Boolean,
      required: false,
    },
  },
  { timestamps: true }
);

const BEOrder = mongoose.model('orders', beOrderSchema);

module.exports = BEOrder;

