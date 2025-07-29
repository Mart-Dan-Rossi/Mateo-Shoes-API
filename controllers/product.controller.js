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

const isReservationOnTime = (reserve) => {
  const reservationDurationTimestamp = 5 * 60 * 60 * 1000; // 60*60*1000 = 1 hs

  return Date.now() < reserve.timestamp + reservationDurationTimestamp;
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

    for (const {
      id: updateId,
      reservedData: updateReservedData,
      userId: updateUserId,
    } of updates) {
      const product = await Product.findById(updateId);
      if (!product) {
        throw new Error(`Producto con ID ${updateId} no encontrado.`);
      }

      // Remove previous user reservations.
      product.reservedData = product.reservedData.filter(
        (rD) => rD.userId !== updateUserId
      );

      let originalSizeOptions = JSON.parse(JSON.stringify(product.sizeOptions));
      let validOriginalReservedData = JSON.parse(
        JSON.stringify(
          product.reservedData.filter((rvdDta) => {
            return isReservationOnTime(rvdDta);
          })
        )
      );

      const validOriginalReservationAmount = validOriginalReservedData
        .filter((validOriginalReservation) => {
          return (
            validOriginalReservation.usSize === updateReservedData.usSize &&
            validOriginalReservation.color.toLowerCase() ===
              updateReservedData.color.toLowerCase()
          );
        })
        .reduce((acumu, current) => {
          return acumu + current.quantity;
        }, 0);

      const matchingSizeOption = product.sizeOptions.find((sizeOption) => {
        return (
          sizeOption.usSize === updateReservedData.usSize &&
          sizeOption.color.toLowerCase() ===
            updateReservedData.color.toLowerCase()
        );
      });

      if (
        !matchingSizeOption ||
        matchingSizeOption.quantity <
          updateReservedData.quantity + validOriginalReservationAmount
      ) {
        throw new Error(
          `Sin stock de ${product.name} talle ${updateReservedData.usSize}${
            typeof updateReservedData.usSize === 'number' && 'US'
          }, color ${updateReservedData.color}`
        );
      }

      product.reservedData.push({
        usSize: updateReservedData.usSize,
        color: updateReservedData.color,
        quantity: updateReservedData.quantity,
        userId: updateUserId,
        timestamp: Date.now(),
      });

      await product.save();
      updatedProducts.push({
        product,
        originalSizeOptions,
        validOriginalReservedData,
      });
    }

    res.json({
      status: 'completed',
      message:
        'Reservas completadas exitosamente. Por favor completa el pago o comunicate con nosotros para continuar.',
    });
  } catch (error) {
    for (const {
      product,
      originalSizeOptions,
      validOriginalReservedData,
    } of updatedProducts) {
      product.sizeOptions = originalSizeOptions;
      product.reservedData = validOriginalReservedData;
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
