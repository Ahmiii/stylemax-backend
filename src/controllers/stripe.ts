import { resolve } from "path";
import {Controller} from "./libs/definitions/controller";
import {Response} from "express";
import { rejects } from "assert";


const stripe=require("stripe")("sk_test_51Nyc5ULsk7l8VN3O0u4499aRfWzTr1FSOq9lBN1rH6HKhhAdernfqxGIP9L94QtO3mdnkDA7s9dUy7uzW3Sd3M1j00kKZ2CkTT",{
    apiVersion:"2022-08-01"
})


export class StripeController extends Controller{
    
    async getIntent(req:any,res:Response): Promise<unknown>{
        console.log("GIRI")
        return new Promise(async(resolve,reject)=>{
            try {
                const paymentIntent=await stripe.paymentIntent.create({
                        currency:'eur',
                        amount:1999,
                        automatic_payment_methods:{
                            enabled:true
                        }
                })
                res.send({clientSecret:paymentIntent.clientSecret})
            } catch (error) {
                return res.status(400).send({
                    error:{
                        message:"Error at intent api",
                    }
                })
            }
        })
    }
    
}