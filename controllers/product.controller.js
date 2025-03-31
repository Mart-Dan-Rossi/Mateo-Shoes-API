const Product = require('../models/product.model');
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

    // Makes sure admins don't modify this field based on theyr current fav list
    product.isFavorite = false;

    await product.save();

    res.json({ message: 'Producto modificado exitosamente.' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Un error ha ocurrido modificando producto.' });
  }
};

const updateMultipleProducts = async (req, res, next) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ message: 'Lista de productos inválida' });
    }

    await Promise.all(
      products.map(async (product) => {
        await Product.updateOne({ _id: product.id }, { $set: product });
      })
    );

    res.json({ status: 'success', message: 'Productos actualizados' });
  } catch (error) {
    res.status(500).json({ message: 'Error en la actualización' });
  }
};

const updateReservedStock = async (req, res) => {
  let updatedProducts = [];

  try {
    const updates = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res
        .status(400)
        .json({ message: 'Lista de actualizaciones inválida' });
    }

    for (const { id, reservedData, userId } of updates) {
      const product = await Product.findById(id);
      if (!product) {
        throw new Error(`Producto con ID ${id} no encontrado.`);
      }

      let originalSizeOptions = JSON.parse(JSON.stringify(product.sizeOptions));
      let originalReservedData = JSON.parse(
        JSON.stringify(product.reservedData)
      );

      const matchingSizeOption = product.sizeOptions.find(
        (sizeOption) =>
          sizeOption.usSize === reservedData.usSize &&
          sizeOption.color.toLowerCase() === reservedData.color.toLowerCase()
      );

      if (
        !matchingSizeOption ||
        matchingSizeOption.quantity < reservedData.quantity
      ) {
        throw new Error(
          `Producto talle ${reservedData.usSize}US, color ${reservedData.color} y de ID ${id} no tiene suficiente stock.`
        );
      }

      matchingSizeOption.quantity -= reservedData.quantity;

      const existingReservation = product.reservedData.find(
        (res) =>
          res.usSize === reservedData.usSize &&
          res.color.toLowerCase() === reservedData.color.toLowerCase()
      );

      if (existingReservation) {
        existingReservation.quantity += reservedData.quantity;
        existingReservation.usersId.push(userId);
      } else {
        product.reservedData.push({
          usSize: reservedData.usSize,
          color: reservedData.color,
          quantity: reservedData.quantity,
          usersId: [userId],
        });
      }

      await product.save();
      updatedProducts.push({
        product,
        originalSizeOptions,
        originalReservedData,
      });
    }

    res.json({
      status: 'completed',
      message:
        'Reservas completadas exitosamente. Por favor completa el pago o comunicate con nosotros para continuar.',
    });
  } catch (error) {
    console.error('Error en la reserva:', error);

    for (const {
      product,
      originalSizeOptions,
      originalReservedData,
    } of updatedProducts) {
      product.sizeOptions = originalSizeOptions;
      product.reservedData = originalReservedData;
      await product.save();
    }

    res.status(500).json({
      message: 'Error en la reserva, cambios revertidos.',
      error: error.message,
    });
  }
};

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
  updateMultipleProducts,
  updateReservedStock,
  deleteProduct,
  searchProduct,
};
