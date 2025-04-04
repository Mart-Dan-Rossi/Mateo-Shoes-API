const router = require('express').Router();
const {
  createUser,
  loginUser,
  forgotPassword,
  verifyToken,
  resetPassword,
  getUser,
} = require('../controllers/user.controller');

router.route('/getUser').get(getUser);
router.route('/register').post(createUser);
router.route('/login').post(loginUser);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password').post(resetPassword);
router.route('/verify/:token').get(verifyToken);

// router.route('/logout').post(logoutUser);

module.exports = router;
