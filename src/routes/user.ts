//user router

import {Router} from "express";
import {UserController} from "../controllers/user";
import {requireAuth, requireVerifiedUser, ROLE} from "../middlewares/auth";
import {handleMultiPartFormAndSaveToDB} from "../middlewares/handleMultiPartForm";

const router = Router();
const controller = new UserController();
router.post('/login',
    requireVerifiedUser, controller.login);
router.post('/logout', controller.logout);
router.post('/signup', controller.signup);

router.post('/picture', requireAuth, handleMultiPartFormAndSaveToDB("user", ["picture"], [
    {name: 'picture', maxCount: 1}
]), controller.updatePicture);
router.patch('/update-email', requireAuth, controller.updateEmail);
router.patch('/', requireAuth, controller.updateUser);
router.get('/', requireAuth, controller.getUser);

export default router;