//buyer router (express)

import {Router} from "express";
import {BuyerController} from "../controllers/buyer";
import {requireVerifiedUser} from "../middlewares/auth";

const router = Router();
const controller = new BuyerController();

router.post("/signup", controller.signup);

router.post("/login", requireVerifiedUser, controller.login);

router.get("/", controller.getAllBuyers)

router.get("/:id", controller.getBuyerById);


// any other route /buyer/* 404
router.all("*", (req, res) => {
    res.status(404).send("Not found");
})

export default router;
