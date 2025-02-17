const Joi = require('joi');

// Validate new user account
const registerUserSchema = Joi.object()
  .options({ abortEarly: false })
  .keys({
    fullName: Joi.string().min(6).max(255).required().messages({
      'string.base': `"Nombre completo" debería ser un texto`,
      'string.empty': `"Nombre completo" debe ser completado`,
      'string.min': `"Nombre completo" debería tener un mínimo de {#limit} caracteres`,
      'any.required': `"Nombre completo" es un campo requerido`,
    }),
    email: Joi.string().min(6).max(255).required().email().messages({
      'string.empty': `"mail" no puede ser un campo vacío`,
      'string.min': `"mail" debería tener un mínimo de {#limit} caracteres`,
      'any.required': `"mail" es un campo requerido`,
    }),
    phoneNumber: Joi.string()
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        'string.empty': `"número telefónico" no puede ser un campo vacío`,
        'string.pattern.base': `"número telefónico" solo puede contener números`,
        'any.required': `"número telefónico" es un campo requerido`,
      }),
    password: Joi.string()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$'))
      .required()
      .messages({
        'string.base': `"contraseña" debería ser un texto`,
        'string.empty': `"contraseña" no puede ser un campo vacío`,
        'any.required': `"contraseña" es un campo requerido`,
        'string.pattern.base': `"contraseña" debería tener un mínimo de ocho caracteres, una mayúscula y un número`,
      }),

    confirm_password: Joi.ref('contraseña'),
  });

// Validate login access
const loginUserSchema = Joi.object()
  .options({ abortEarly: false })
  .keys({
    email: Joi.string().min(6).max(255).required().email().messages({
      'string.base': `"mail" debería ser un texto`,
      'string.empty': `"mail" no puede ser un campo vacío`,
      'string.min': `"mail" debería tener un mínimo de {#limit} caracteres`,
      'any.required': `"mail" es un campo requerido`,
    }),
    password: Joi.string()
      .required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$'))
      .messages({
        'string.base': `"contraseña" debería ser un texto`,
        'string.empty': `"contraseña" no puede ser un campo vacío`,
        'any.required': `"contraseña" es un campo requerido`,
        'string.pattern.base': `"contraseña" debería tener un mínimo de ocho caracteres, at least one capital letter, and one number`,
      }),
  });

const forgotPasswordSchema = Joi.object()
  .options({ abortEarly: false })
  .keys({
    email: Joi.string().min(6).max(255).required().email().messages({
      'string.base': `"email" debería ser un texto`,
      'string.empty': `"email" no puede ser un campo vacío`,
      'string.min': `"email" debería tener un mínimo de {#limit} caracteres`,
      'any.required': `"email" es un campo requerido`,
    }),
  });

const resetPasswordSchema = Joi.object()
  .options({ abortEarly: false })
  .keys({
    password: Joi.string()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$'))
      .required()
      .messages({
        'string.base': `"contraseña" debería ser un texto`,
        'string.empty': `"contraseña" no puede ser un campo vacío`,
        'any.required': `"contraseña" es un campo requerido`,
        'string.pattern.base': `"contraseña" debería tener un mínimo de eight caracteres, at least one capital letter, and one number`,
      }),
  });

module.exports = {
  registerUserSchema,
  loginUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
