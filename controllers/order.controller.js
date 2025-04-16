const BEOrder = require('../models/order.model');
const { ErrorHandler } = require('../utils/errorHandler');

const createBEOrder = async (req, res, next) => {
  try {
    const data = req.body;
    const order = await BEOrder.create({ ...data, user: req.user._id });

    res.status(200).json({
      status: 'success',
      message: 'La órden ha sido creada exitosamente',
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateBEOrder = async (req, res) => {
  try {
    const data = req.body;

    let order = await BEOrder.findById(data._id);
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    if (data.name) order.name = data.name;
    if (data.phone) order.phone = data.phone;
    if (data.mail) order.mail = data.mail;
    if (data.isDelivered !== undefined) order.isDelivered = data.isDelivered;

    if (data.user) {
      order.user = data.user;
    } else if (!order.user) {
      return res.status(400).json({ message: 'El usuario es requerido' });
    }

    if (data.products && Array.isArray(data.products)) {
      order.products = data.products.map((product) => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        sizeOptions:
          product.sizeOptions &&
          product.sizeOptions.map((sizeOption) => {
            return typeof sizeOption === 'object'
              ? {
                  usSize: sizeOption.usSize || null,
                  color: sizeOption.color || null,
                  quantity: sizeOption.quantity || 0,
                }
              : null;
          }),
      }));
    }

    await order.save();

    res.status(200).json({ message: 'Orden actualizada correctamente', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la orden', error });
  }
};

const getParticularOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await BEOrder.findById(id).populate('user orders.order');
    if (!order) throw new ErrorHandler(404, 'La órden no existe');

    res.status(200).json({
      status: 'success',
      message: 'La órden ha sido buscada exitosamente',
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const order = await BEOrder.find({ user: req.user._id }).populate(
      'user orders.order'
    );

    res.status(200).json({
      status: 'success',
      message: 'Las órdenes han sido buscadas exitosamente',
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrdersList = async (req, res, next) => {
  try {
    const orders = await BEOrder.find();

    res.status(200).json({
      status: 'success',
      data: {
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBEOrder,
  updateBEOrder,
  getParticularOrder,
  getMyOrders,
  getAllOrdersList,
};
