const User = require('../models/user.model');
const {
  registerUserSchema,
  loginUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validations/user.validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ErrorHandler } = require('../utils/errorHandler');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const getUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) throw new ErrorHandler(404, 'Usuario no encontrado');

    res.status(200).json({
      status: 'success',
      data: {
        user: user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const findUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  return user;
};

const createUser = async (req, res, next) => {
  try {
    // Validate data
    const data = req.body;
    const { error } = await registerUserSchema.validateAsync(data);
    if (error) throw new ErrorHandler(400, error.message);

    // Verify if email exist
    data.email = data.email.toLowerCase();

    let user = await User.findOne({ email: data.email });
    if (user) throw new ErrorHandler(400, 'El mail ya existe');

    user = await User.findOne({ phoneNumber: data.phoneNumber });
    if (user) throw new ErrorHandler(400, 'Número de teléfono ya existe');

    const salt = await bcrypt.genSalt(8);
    data.password = await bcrypt.hash(data.password, salt);

    // Set isVerified to false initially
    data.isVerified = false;

    // Save user to the DB
    user = await User.create(data);

    // Generate token for access
    const verificationToken = jwt.sign(
      { sub: user._id },
      process.env.JWT_TOKEN,
      {
        expiresIn: '10m',
      }
    );

    const verificationLink = `${process.env.FRONTEND_REDIRECT}/auth/verify-email?token=${verificationToken}&email=${data.email}`;

    // Send verification email
    const sendEmailResult = await sendEmail(data.email, '', verificationLink);

    if (!sendEmailResult) {
      throw new ErrorHandler(500, 'Fallo al enviar el mail');
    }
    const userJson = user.toJSON();
    delete userJson.password;

    res.status(201).json({
      status: 'success',
      message:
        'Usuario registrado exitosamente. Un mail de verificación ha sido enviado.',
      data: userJson,
    });
  } catch (error) {
    next(new ErrorHandler(error.statusCode || 500, error.message));
  }
};

const loginUser = async (req, res, next) => {
  try {
    // Validate data
    const data = req.body;
    const { error } = await loginUserSchema.validateAsync(data);
    if (error) throw new ErrorHandler(400, error.message);

    // Verify email and password
    const user = await User.findOne({ email: data.email.toLowerCase() });

    if (!user)
      throw new ErrorHandler(
        400,
        'Usuario no encontrado. No hay cuenta asociada a este mail. Por favor ve a la página de registro para crear una nueva cuenta.'
      );

    const validatePassword = await bcrypt.compare(data.password, user.password);
    if (!validatePassword)
      throw new ErrorHandler(
        400,
        'Credenciales incorrectas. Por favor verifica el mail y contraseña nuevamente.'
      );

    // Generate token for access
    const token = jwt.sign({ sub: user._id }, process.env.JWT_TOKEN);

    res.status(200).json({
      status: 'success',
      message: 'Logueado con éxito',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(new ErrorHandler(error.statusCode || 500, error.message));
  }
};

const forgotPassword = async (req, res) => {
  try {
    // Validate email using forgotPasswordSchema
    const { error } = await forgotPasswordSchema.validateAsync(req.body);
    if (error) {
      throw new ErrorHandler(400, error.message);
    }
    const { email } = req.body;

    // Find the user and update the password reset code
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: 'Usuario no encontrado. Por favor, regístrate.' });
    }

    const secretKey = process.env.JWT_TOKEN;
    const token = jwt.sign({ sub: user._id }, secretKey, { expiresIn: '1h' });

    const resetPasswordLink = `${process.env.FRONTEND_REDIRECT}/auth/reset-password?code=${token}`;

    // Send password reset email
    const sendEmailResult = await sendEmail(email, resetPasswordLink);

    if (!sendEmailResult) {
      throw new ErrorHandler(500, 'Fallo al mandar el mail');
    }

    res.json({
      message:
        'Un correo para resetear la contraseña ha sido mandado exitosamente. por favor verifica tu bandeja de entrada para más instrucciones.',
      status: 'success',
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({
      error:
        error.message ||
        'Un error inesperado ha ocurrido. Por favor intenta nuevamente luego',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Validate newPassword
    const { error } = await resetPasswordSchema.validateAsync({
      password: newPassword,
    });
    if (error) {
      throw new ErrorHandler(400, error.message);
    }

    // Verify the reset token
    const secretKey = process.env.JWT_TOKEN;
    const decodedToken = jwt.verify(resetToken, secretKey);
    const userId = decodedToken.sub;

    // Update user's password
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado. Por favor proceda a registrarse.',
      });
    }

    // Update user's password
    const salt = await bcrypt.genSalt(8);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Cambio de contraseña exitoso', status: 'success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ha ocurrido un error' });
  }
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.params.token;

    // Verify the token
    const secretKey = process.env.JWT_TOKEN;
    const decodedToken = jwt.verify(token, secretKey);

    // Find the user by the id in the database
    const user = await User.findOne({ _id: decodedToken.sub });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Mark the user as verified
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Mail verificado exitosamente.',
    });
  } catch (error) {
    next(error);
  }
};

const sendEmail = async (email, resetPasswordLink, verificationLink) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: !verificationLink
        ? 'Pedido de cambio de contraseña'
        : 'Verifica tu email',
      html: `
      <html>
        <body>
          <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a
                  href=""
                  style="font-size:1.4rem;color: #30C376;text-decoration:none;font-weight:600"
                >
                  MateoShooes
                </a>
              </div>
              <p style="font-size:1.1rem">Hi, there.</p>
              <p>
                ${
                  verificationLink
                    ? 'Gracias por elegir MateoShooest. Usa el siguiente link para completar tu proceso de verificación. El link es válido por 5 minutos.'
                    : 'Hemos recivido un pedido de cambio de contraseña para tu cuenta. Para completar el proceso haga click en el link a continuación.'
                }
              </p>
              <p>${!verificationLink ? resetPasswordLink : verificationLink}</p>
              ${
                resetPasswordLink
                  ? `<p>Si usted no inició el pedido, por favor ignore este mensaje.</p>`
                  : ''
              }
              
              <p style="font-size:0.9rem;">
                Muchas gracias,
                <br />
                MateoShooes
              </p>
              <hr style="border:none;border-top:1px solid #eee" />
            </div>
          </div>
        </body>
      </html>
      `,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error mandando mail:', error);
    return false;
  }
};

module.exports = {
  getUser,
  findUserById,
  createUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyToken,
};
