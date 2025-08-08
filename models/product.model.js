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

const clothSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

const productSchema = new mongoose.Schema(
  {
    productType: {
      type: String,
      enum: {
        values: ['indumentaria', 'calzado'],
        message: 'Tipo de producto inválido',
      },
      required: [true, 'Nombre requerido. No puede repetirse.'],
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
      type: new mongoose.Schema(
        {
          negro: { type: [String], default: [] },
          blanco: { type: [String], default: [] },
          gris: { type: [String], default: [] },
          azul: { type: [String], default: [] },
          rojo: { type: [String], default: [] },
          amarillo: { type: [String], default: [] },
          verde: { type: [String], default: [] },
          violeta: { type: [String], default: [] },
          naranja: { type: [String], default: [] },
          rosa: { type: [String], default: [] },
          celeste: { type: [String], default: [] },
        },
        { _id: false }
      ),
      required: [true, 'Debe haber al menos un color con imágenes.'],
    },
    price: {
      type: Number,
      required: [true, 'Precio requerido.'],
    },
    sizeOptions: {
      type: [
        {
          usSize: {
            type: mongoose.Schema.Types.Mixed,
            validate: {
              validator: function (v) {
                return (
                  typeof v === 'number' || clothSizes.includes(v.toUpperCase())
                );
              },
              message:
                'Talle inválido (debe ser número o un talle de ropa válido)',
            },
            required: [true, 'Talle US es requerido'],
          },
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
          color: { type: String, required: [true, 'Color requerido'] },
          quantity: { type: Number, required: [true, 'Cantidad requerida'] },
          userId: { type: String, required: [true, 'userId is required'] },
          hide: { type: Boolean, required: false },
          timestamp: { type: Number, required: false },
        },
      ],
      required: false,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
