const Product = require('../models/product.model');
const slugify = require('slugify');
const { ErrorHandler } = require('../utils/errorHandler');

// Welcome
const welcomePage = (req, res, next) => {
  try {
    res.send(
      'Hey buddy! Feel free to create stuffs with this API. Try /products to get all products.'
    );
  } catch (error) {
    next(error);
  }
};

// Get the list of products
const getAllProductsList = async (req, res, next) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      status: 'success',
      data: {
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a particular product
const getParticularProduct = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug });

    if (!product) throw new ErrorHandler(404, 'El producto no existe');

    res.status(200).json({
      status: 'success',
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    res.json({ message: 'Producto agregado a favoritos.' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Un error ha ocurrido agregando a favoritos.' });
  }
};

// Update a particular product
const updateProduct = async (req, res, next) => {
  try {
    const { name, slug, images, price, sizeOptions, desc, tags, brand } =
      req.body;

    const product = await Product.findOne({ slug });

    if (!product) throw new ErrorHandler(404, 'El producto no existe');

    product.name = name;
    product.slug = slug;
    product.images = images;
    product.price = price;
    product.sizeOptions = sizeOptions;
    product.brand = brand.toLowerCase();
    product.desc = desc;
    product.tags = tags;

    await product.save();

    res.json({ message: 'Producto modificado exitosamente.' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Un error ha ocurrido modificando producto.' });
  }
};

// Delete a particular product
const deleteProduct = async (req, res) => {
  const { _id } = req.body;

  try {
    const product = await Product.findById(_id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    // Find and delete the product
    await Product.findByIdAndDelete(_id);

    res.json({ message: 'Producto eliminado.' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Un error ha ocurrido al eliminar el producto.' });
  }
};

const searchProduct = async (req, res, next) => {
  try {
    const { q } = req.query;
    const products = await Product.find({ name: { $regex: q, $options: 'i' } });

    if (products.length < 1)
      throw new ErrorHandler(404, 'No se ha encontrado ningún producto');

    res.status(201).json({
      status: 'success',
      message: 'Se encontró el producto exitosamente',
      products,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  welcomePage,
  getAllProductsList,
  getParticularProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProduct,
};
