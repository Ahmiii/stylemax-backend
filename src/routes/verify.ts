import {Router} from "express";
import {UserController} from "../controllers/user";
import {requireAuth} from "../middlewares/auth";

const router = Router();
const controller = new UserController();

router.get('/forgot-password', controller.forgotPassword);

router.post('/reset-password', controller.resetPassword);



router.get('/resend-verification-email/:email', controller.resendVerificationEmail);



router.get('/:code', controller.verify);




export default router;
