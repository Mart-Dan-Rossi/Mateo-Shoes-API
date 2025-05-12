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
        success: 'https://8a19-2800-21c5-c000-7ac-542d-2ca2-ac83-6154.ngrok-free.app/pay/success',
        failure: 'https://8a19-2800-21c5-c000-7ac-542d-2ca2-ac83-6154.ngrok-free.app/pay/fail',
        pending: 'https://8a19-2800-21c5-c000-7ac-542d-2ca2-ac83-6154.ngrok-free.app/pay/success',
      },
      auto_return: 'approved',
      notification_url:
        'https://9083-2800-21c5-c000-17b-7050-66ee-b484-f856.ngrok-free.app/api/webhook',
      metadata: {
        ...req.body.metadata,
        products: JSON.stringify(req.body.metadata.products),
      },
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
      console.log('payment data: ', data);

      const MSUserId = data.response.metadata.user_id;

      const MSUser = await findUserById(MSUserId);

      if (!MSUser) {
        throw new ErrorHandler(404, 'Usuario no encontrado');
      }

      const parsedProducts = JSON.parse(data.body.metadata.products);
      if (parsedProducts.length > 0) {
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
          products: parsedProducts.map(({ id, name, price, sizeOptions }) => {
            const orderSizeOptions = sizeOptions.map((sizeOption) => {
              const { usSize, color, quantity } = sizeOption;

              return { usSize, color, quantity };
            });

            return {
              id,
              name,
              price,
              sizeOptions: orderSizeOptions,
            };
          }),
        });

        await order.save();

        await releaseReservations({
          slugs: parsedProducts.map((p) => p.slug),
          userId: MSUserId,
        });

        res.sendStatus(204);
      }
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
