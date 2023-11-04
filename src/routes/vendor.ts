import {Router} from "express";
import {VendorController} from "../controllers/vendor";
import {UserController} from "../controllers/user";
import {requireVerifiedUser} from "../middlewares/auth";

const router = Router();
const vendorController = new VendorController();

router.post('/signup', vendorController.login);
router.post('/login',  requireVerifiedUser ,vendorController.login);

export default router;
