const mercadopago = require('mercadopago');

mercadopago.configurations.setAccessToken(
  process.env.MERCADO_PAGO_ACCESS_TOKEN
);

const createPaymentPreference = async (req, res) => {
  const { items, payer } = req.body;

  console.log('items:', items, 'payer:', payer);

  const preference = {
    items: items,
    payer: payer,
    back_urls: {
      success: 'https://facebook.com',
      failure: 'https://youtube.com',
      pending: 'https://google.com',
    },
    auto_return: 'approved',
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    res.json({ id: response.body.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPaymentPreference,
};
