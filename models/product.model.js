const { required } = require('joi');
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
    },
    images: {
      type: [String],
    },
    price: {
      type: Number,
      required: true,
    },
    sizeOptions: {
      type: Map,
      of: [
        {
          size: { type: Number, required: true },
          quantity: { type: Number, required: true },
        },
      ],
      required: true,
    },
    desc: {
      type: String,
      required: false,
    },
    tags: {
      type: [String],
      required: false,
    },
    isFavorite: {
      type: Boolean,
      required: false,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
