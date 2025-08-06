const Favorite = require('../models/favorite.model');
const Product = require('../models/product.model');
const { authAccountValidation } = require('./user.controller');

// Add a product to a user's favorites
const addFavorite = async (req, res) => {
  const { productId } = req.body;

  try {
    const authValidationRes = await authAccountValidation(req);
    if (authValidationRes && !authValidationRes.isValid) {
      throw new ErrorHandler(401, authValidationRes);
    }

    const userId = authValidationRes.user._id;
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ error: 'Usuario o producto no encontrados.' });
    }

    // Check if the favorite already exists
    const existingFavorite = await Favorite.findOne({
      user: userId,
      product: productId,
    });
    if (existingFavorite) {
      return res
        .status(400)
        .json({ error: 'El producto ya está en favoritos.' });
    }

    // Create and save the favorite
    const favorite = new Favorite({ user: userId, product: productId });
    product.isFavorite = true;

    await product.save();
    await favorite.save();

    res.json({ message: 'Producto agregado a favoritos.' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Un error ha ocurrido agregando a favoritos.' });
  }
};

// Remove a product from a user's favorites
const removeFavorite = async (req, res) => {
  const { productId } = req.body;

  try {
    const authValidationRes = await authAccountValidation(req);
    if (authValidationRes && !authValidationRes.isValid) {
      throw new ErrorHandler(401, authValidationRes);
    }

    const userId = authValidationRes.user._id;
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ error: 'Usuario o producto no encontrados.' });
    }

    // Find and delete the favorite
    await Favorite.findOneAndDelete({ user: userId, product: productId });
    product.isFavorite = false;
    await product.save();

    res.json({ message: 'Producto removido de favoritos.' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Un error ha ocurrido al remover de favoritos.' });
  }
};

const getMyFavoriteProducts = async (req, res) => {
  const userId = req.user._id;

  try {
    const favoriteProducts = await Favorite.find({ user: userId }).populate(
      'product'
    );

    res.json(favoriteProducts.map((fav) => fav.product));
  } catch (error) {
    res.status(500).json({
      error: 'Un error ha ocurrido al buscar los productos favoritos.',
    });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getMyFavoriteProducts,
};
