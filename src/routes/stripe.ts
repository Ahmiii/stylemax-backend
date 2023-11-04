import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { StripeController } from "../controllers/stripe";


//const env = require('dotenv').config({path:"../../.env"})
const router = Router();

const controller = new StripeController();


// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY,{
//     apiVersion:'2022-08-01'
// })


router.post('/',controller.getIntent)
router.get('/getTheKey')
export default router;