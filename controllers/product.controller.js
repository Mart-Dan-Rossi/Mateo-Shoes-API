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
    console.log('req.body: ', req.body);
    const product = new Product(req.body);
    await product.save();

    res.json({ message: 'Producto agregado.' });
  } catch (error) {
    res.status(500).json({
      error: 'Un error ha ocurrido agregando el producto.',
      details: error.message,
    });
  }
};

// Update a particular product
const updateProduct = async (req, res, next) => {
  try {
    const {
      productType,
      name,
      slug,
      images,
      price,
      sizeOptions,
      desc,
      tags,
      brand,
    } = req.body;

    const product = await Product.findOne({ slug });

    if (!product) throw new ErrorHandler(404, 'El producto no existe');

    product.productType = productType;
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
    console.log('Error modifying product:', error);
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

const reserveStock = async (req, res) => {
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

      const matchingSizeOption = product.sizeOptions.find((sizeOption) => {
        return (
          sizeOption.usSize === reservedData.usSize &&
          sizeOption.color.toLowerCase() === reservedData.color.toLowerCase()
        );
      });

      if (
        !matchingSizeOption ||
        matchingSizeOption.quantity < reservedData.quantity
      ) {
        throw new Error(
          `Producto talle ${reservedData.usSize}${
            typeof reservedData.usSize === 'number' && 'US'
          }, color ${
            reservedData.color
          } y de ID ${id} no tiene suficiente stock.`
        );
      }

      matchingSizeOption.quantity -= reservedData.quantity;

      const existingReservation = product.reservedData.find(
        (res) =>
          res.usSize === reservedData.usSize &&
          res.color.toLowerCase() === reservedData.color.toLowerCase() &&
          res.userId === userId
      );

      if (existingReservation) {
        existingReservation.quantity += reservedData.quantity;
      } else {
        product.reservedData.push({
          usSize: reservedData.usSize,
          color: reservedData.color,
          quantity: reservedData.quantity,
          userId: userId,
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

const hideUserReservations = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Falta el userId' });
  }

  try {
    const products = await Product.find({
      'reservedData.userId': userId,
    });

    if (products.length === 0) {
      return res.status(404).json({
        message: 'No se encontraron productos con reservas para este usuario.',
      });
    }

    for (const product of products) {
      let modified = false;

      product.reservedData.forEach((reservation) => {
        if (reservation.userId === userId && !reservation.hide) {
          reservation.hide = true;
          modified = true;
        }
      });

      if (modified) {
        await product.save();
      }
    }

    res.status(200).json({
      message: `Reservas del usuario ${userId} ocultadas exitosamente.`,
    });
  } catch (error) {
    console.error('Error al ocultar reservas:', error);
    res.status(500).json({
      message: 'Error al ocultar las reservas del usuario.',
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

const releaseReservations = async ({ slugs, userId }) => {
  if (!Array.isArray(slugs) || !userId) {
    throw new Error('Faltan datos necesarios');
  }

  for (const slug of slugs) {
    const product = await Product.findOne({ slug });

    if (!product) continue;

    let modified = false;
    const updatedSizeOptions = [...product.sizeOptions];

    const userReservations =
      product.reservedData?.filter((res) => res.userId === userId) || [];

    for (const reservation of userReservations) {
      const matchIndex = updatedSizeOptions.findIndex(
        (sizeOption) =>
          sizeOption.usSize === reservation.usSize &&
          sizeOption.color.toLowerCase() === reservation.color.toLowerCase()
      );

      if (matchIndex !== -1) {
        updatedSizeOptions[matchIndex].quantity -= reservation.quantity;

        if (updatedSizeOptions[matchIndex].quantity <= 0) {
          updatedSizeOptions.splice(matchIndex, 1);
        }

        modified = true;
      }
    }

    product.reservedData = product.reservedData.filter(
      (res) => res.userId !== userId
    );

    if (updatedSizeOptions.length === 0) {
      await Product.deleteOne({ _id: product._id });
    } else if (modified) {
      product.sizeOptions = updatedSizeOptions;
      await product.save();
    }
  }
};

module.exports = {
  welcomePage,
  getAllProductsList,
  getParticularProduct,
  createProduct,
  updateProduct,
  updateMultipleProducts,
  reserveStock,
  hideUserReservations,
  deleteProduct,
  searchProduct,
  releaseReservations,
};
