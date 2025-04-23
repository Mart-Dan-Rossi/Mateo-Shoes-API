const mongoose = require('mongoose');

const clothSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

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
      phone: { type: String, required: true },
    },
    MPUserName: {
      type: String,
      required: [true, 'Name is required'],
    },
    MPmail: {
      type: String,
      required: [true, 'Phone is required'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
    },
    statusDetail: {
      type: String,
      required: [true, 'Status detail is required'],
    },
    products: [
      {
        id: { type: String, required: false },
        name: { type: String, required: false },
        price: { type: String, required: false },
        sizeOptions: [
          {
            usSize: {
              type: mongoose.Schema.Types.Mixed,
              validate: {
                validator: function (v) {
                  return typeof v === 'number' || clothSizes.includes(v);
                },
                message:
                  'Talle inválido (debe ser número o un talle de ropa válido)',
              },
              required: [true, 'Talle US es requerido'],
            },
            color: { type: String },
            quantity: { type: Number },
          },
        ],
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
