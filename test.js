const mercadopago = require('mercadopago');

mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN)

console.log('Mercado Pago configurado correctamente.');