//order controller


import {OrderController} from "../controllers/order";
import {Router} from "express";
import {requireAuth} from "../middlewares/auth";

const router = Router();

const controller = new OrderController();

router.post("/", requireAuth, controller.createOrder);
router.get("/", requireAuth, controller.getOrders);
router.get("/sales", requireAuth, controller.getSales);
router.get("/earning", requireAuth, controller.getVendorEarnings);
router.get("/shipping", requireAuth, controller.getShippingAddresses);
router.get("/:id", requireAuth, controller.getOrder);
//earning

//shipping
router.post("/shipping", requireAuth, controller.createShippingAddress);
//validate promo code
router.post("/promo", requireAuth, controller.validatePromoCode);

//confirm orderItem arrival (buyer)
router.post("/confirm-arrival/:id", requireAuth, controller.confirmOrderArrival);
//set order Status
router.post("/set-order-status",requireAuth,controller.setOrderStatus)
export default router;

