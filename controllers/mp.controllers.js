const mercadopago = require('mercadopago');
const MPOrder = require('../models/order.model');

const { ErrorHandler } = require('../utils/errorHandler');
const { findUserById } = require('./user.controller');
const { releaseReservations } = require('./product.controller');

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

const createOrder = async (req, res) => {
  try {
    let preference = {
      items: req.body.cartItems,
      back_urls: {
        success: 'http://localhost:3000/pay/success',
        failure: 'http://localhost:3000/pay/fail',
        pending: 'http://localhost:3000/pay/success',
      },
      auto_return: 'approved',
      notification_url:
        'https://6a42-2800-21c5-c000-343-c5a0-7530-3ec0-e136.ngrok-free.app/api/webhook',
      metadata: { ...req.body.metadata, products: req.body.cartItems },
    };

    mercadopago.preferences
      .create(preference)
      .then(function (response) {
        res.json({
          id: response.body.id,
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  } catch (err) {
    console.log('Error: ', err);
    res.status(500).json({
      error: 'Error al crear la preferencia de MP',
    });
  }
};

const success = (req, res) => res.send('pay/success');
const failure = (req, res) => res.send('pay/failure');
const pending = (req, res) => res.send('pay/pending');

const receiveWebhook = async (req, res) => {
  const payment = req.query;

  try {
    if (payment.type === 'payment') {
      const data = await mercadopago.payment.findById(payment['data.id']);

      console.log('BODY:', data.body);
      console.log('STATUS:', data.body.status);

      const MSUserId = data.response.metadata.user_id;

      const MSUser = await findUserById(MSUserId);

      if (!MSUser) {
        console.log('MSUser not found');
        throw new ErrorHandler(404, 'Usuario no encontrado');
      }

      const order = new MPOrder({
        user: {
          name: MSUser.fullName,
          id: MSUserId,
          email: MSUser.email,
          phone: MSUser.phoneNumber,
        },
        MPUserName: `${data.response.payer.first_name} ${data.response.payer.last_name}`,
        MPmail: data.response.payer.email,
        status: data.body.status,
        statusDetail: data.body.status_detail,
        products: data.response.metadata.products,
      });

      await order.save();

      await releaseReservations({
        slugs: data.response.metadata.products.map((p) => p.slug),
        userId: MSUserId,
      });

      res.sendStatus(204);
    }
  } catch (err) {
    console.log('Webhook error:', err);
    return res.sendStatus(500).json({ error: err.message });
  }
};

module.exports = {
  createOrder,
  success,
  failure,
  pending,
  receiveWebhook,
};
