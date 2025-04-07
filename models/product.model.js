const mongoose = require('mongoose');

const availableColors = [
  'negro',
  'blanco',
  'gris',
  'azul',
  'rojo',
  'amarillo',
  'verde',
  'violeta',
  'naranja',
  'rosa',
  'celeste',
];

const productSchema = new mongoose.Schema(
  {
    productType: {
      type: String,
      enum: {
        values: ['indumentaria', 'calzado'],
        message: 'Color inválido',
      },
      required: [true, 'Nombre requerido. No puede repetirse.'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Nombre requerido. No puede repetirse.'],
      unique: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug requerido. No puede repetirse.'],
      unique: true,
    },
    images: {
      type: [String],
      required: [true, 'Debe haber por lo menos una imágen.'],
    },
    price: {
      type: Number,
      required: [true, 'Precio requerido.'],
    },
    sizeOptions: {
      type: [
        {
          usSize: { type: Number, required: [true, 'Talle US es requerido'] },
          color: {
            type: String,
            enum: {
              values: availableColors,
              message: 'Color inválido',
            },
            required: [true, 'Color requerido'],
          },
          quantity: { type: Number, required: [true, 'Cantidad requerida'] },
          arg: { type: Number },
          cm: { type: Number },
          eu: { type: Number },
        },
      ],
      required: [true, 'Debe haber opciones de color y talle.'],
    },
    brand: {
      type: String,
      enum: ['puma', 'nike', 'adidas', 'underarmour', 'other'],
      required: [true, 'Debe haber una opción de marca.'],
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
    reservedData: {
      type: [
        {
          usSize: { type: Number, required: [true, 'Talle US es requerido'] },
          color: { type: String, required: [true, 'Color requerido'] },
          quantity: { type: Number, required: [true, 'Cantidad requerida'] },
          userId: { type: String, required: [true, 'userId is required'] },
          hide: { type: Boolean, required: false },
        },
      ],
      required: false,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
