//cart router

import {Router} from "express";
import {CartController} from "../controllers/cart";
import {ROLE, accessControl} from "../middlewares/auth";

const router = Router();
const controller = new CartController();

router.post("/", accessControl([ROLE.BUYER]), controller.createCart);

router.get("/", accessControl([ROLE.BUYER]), controller.getCart);

router.post("/product", accessControl([ROLE.BUYER]), controller.addToCart);

router.delete("/:id/item", accessControl([ROLE.BUYER]), controller.removeFromCart);


router.delete("/:id", accessControl([ROLE.BUYER]), controller.clearCart);


export default router;
