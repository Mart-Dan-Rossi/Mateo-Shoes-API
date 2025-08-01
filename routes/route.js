const express = require('express');
// const {
//   createOrder,
//   getParticularOrder,
//   getMyOrders,
// } = require('../controllers/order.controller');

const {
  welcomePage,
  getAllProductsList,
  getParticularProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProduct,
  updateMultipleProducts,
  reserveStock,
  hideUserReservations,
  cancelReservation,
  manualPurchaseHanlding,
} = require('../controllers/product.controller');

const { isLoggedIn } = require('../middlewares/auth');

const {
  addFavorite,
  removeFavorite,
  getMyFavoriteProducts,
} = require('../controllers/favorite.controller');

const {
  createOrder,
  success,
  failure,
  pending,
  receiveWebhook,
} = require('../controllers/mp.controllers');

const {
  getAllOrdersList,
  createBEOrder,
  updateBEOrder,
} = require('../controllers/order.controller');

const router = express.Router();

router.route('/').get(welcomePage);

// router.post('/order', isLoggedIn, createOrder);
// router.get('/order', isLoggedIn, getMyOrders);
// router.get('/order/:id', isLoggedIn, getParticularOrder);

router.route('/products').get(getAllProductsList);

router.post('/products/add', createProduct);
router.delete('/products/remove', deleteProduct);
router.get('/products/search', searchProduct);
router.get('/products/:slug', getParticularProduct);
router.post('/products/update', updateProduct);
router.post('/product/updateMultiple', updateMultipleProducts);

router.post('/products/reserveProducts', reserveStock);
router.post('/products/hideUserReservations', hideUserReservations);
router.post('/products/cancelReservation', cancelReservation);

router.post('/products/manualPurchaseHanlding', manualPurchaseHanlding);

router.route('/order').get(getAllOrdersList);
router.post('/order/add', createBEOrder);
router.post('/order/update', updateBEOrder);
router.post('/order/create-order', createOrder);

router.get('/order/ordersuccess', success);
router.get('/order/orderfailure', failure);
router.get('/order/orderpending', pending);

router.post('/webhook', receiveWebhook);

router.post('/favorite/add', addFavorite);
router.delete('/favorite/remove', removeFavorite);
router.get('/favorite/my-favorites', isLoggedIn, getMyFavoriteProducts);

// router
//   .route('/product/:slug')
//   .patch(updateProduct)
//   .delete(deleteProduct);

module.exports = router;
