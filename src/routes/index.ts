import express from 'express';
import errorHandle from '../controllers/errorHandling';
import { loginHandle } from '../controllers/loginHandle';
import { forgotPassword } from '../controllers/passwordHandle';
import { registerHandle, activateHandle } from '../controllers/registerHandle';

const router = express.Router();

//------------ Register POST Handle ------------//
router.post('/register', registerHandle);

//------------ Email ACTIVATE Handle ------------//
router.get('/activate/:token', activateHandle);

//------------ Forgot Password Handle ------------//
router.post('/forgot', forgotPassword);

//------------ Reset Password Handle ------------//
// router.post('/reset/:id', authController.resetPassword);

//------------ Reset Password Handle ------------//
// router.get('/forgot/:token', authController.gotoReset);

//------------ Login POST Handle ------------//
router.post('/login', loginHandle);

//------------ Logout GET Handle ------------//
// router.get('/logout', authController.logoutHandle);

router.use('/', errorHandle);

export default router;