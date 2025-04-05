const mercadopago = require('mercadopago');
const MPOrder = require('../models/order.model');

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

const createOrder = async (req, res) => {
  try {
    let preference = {
      items: req.body.cartItems,
      back_urls: {
        success: 'http://localhost:3000/pay/success',
        failure: 'http://localhost:3000/pay/failure',
        pending: 'http://localhost:3000/pay/pending',
      },
      auto_return: 'approved',
      notification_url:
        'https://c089-2800-21c5-c000-343-2de6-272c-bd77-2dc4.ngrok-free.app/api/webhook',
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
  console.log('receiveWebhook', req);

  // try {
  //   if (payment.type === 'payment') {
  //     const data = await mercadopago.payment.findById(payment['data.id']);

  //     console.log('data: ', data);

  //     const order = await MPOrder.create({
  //       // user: data.metadata.user,
  //       name: `${data.payer.first_name} ${data.payer.last_name}`,
  //       phone: data.payer.phone,
  //       // products: data.metadata.products,
  //     });

  //     console.log('New order incoming!:', order);
  //     console.log(data);
  //   }

  //   res.sendStatus(204);
  // } catch (error) {
  //   console.log('webhoock error: ', error);
  //   return res.sendStatus(500).json({ error: error.message });
  // }
};

module.exports = {
  createOrder,
  success,
  failure,
  pending,
  receiveWebhook,
};
