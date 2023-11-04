import * as express from "express";
import {Router} from "express";
import * as morgan from "morgan";
import * as cookieParser from "cookie-parser";
import {logUserIn} from "../middlewares/auth";
import {getUploadRouter} from "./get_upload_router";
import {generateToken} from "./utils";
// const expressListRoutes = require('express-list-routes');
import {serveRouteList} from "./utils/express_list_routes";
import {AppDataSource} from "./data-source";
import {Product} from "../entity/Product";
import {calculateEarnings} from "../controllers/product";
import {PlatformFee} from "../entity/Models";
import {SystemConfig} from "../entity/Config";
import { Scheduler, initializeScheduler, myScheduledTask } from "./scheduler";

/**
 * @param host
 * @param port
 * @param routers array of {entity: Router}, such as [{buyer: buyerRouter}, {vendor: vendorRouter}]
 * @param db_entities
 * @example start_server('localhost', 3000, [{buyer: buyerRouter}, {vendor: vendorRouter}])
 */


const env = require("dotenv").config({ path: "../../.env" });

export function start_server({
                                 host,
                                 port,
                                 routers,
                                 db_entities

                             }: {
    db_entities: any[],
    host: string, port: number, routers: { [key: string]: Router }[]
}) {
    

    // makeAllUsersVendors().then(() => {
    //     //
    //     console.log('all users are vendors')
    // }).catch((e) => {
    //     console.log(e)
    // })

    async function correctProductEarnings(
    ){
        const products = await AppDataSource.manager.find(Product, {
            relations: ['details']
        } );

        let platformEarningsConfig:PlatformFee|null = await AppDataSource.manager.findOne(PlatformFee, {
            where: {

            }
        });
        if(!platformEarningsConfig){
            platformEarningsConfig = await AppDataSource.manager.save(new PlatformFee({}));
        }
        for (const product of products) {
            const {
                earnings,platformProfit,shippingFee
            } = calculateEarnings({
                offeredPrice: product.details.offered_price,
                shippingOption: product.delivery_type,
                platformConfig: platformEarningsConfig
            })
            product.details.earnings = earnings
            product.details.platform_fee = platformProfit
            product.details.shipping_fee = shippingFee
            await AppDataSource.manager.save(product)
        }
    }

    async function applyCorrections() {
        //if no ADMIN_SIGNUP_CODE is set, set random code
        let signupCode = await AppDataSource.manager.findOne(SystemConfig, {
            where: {
                key: 'ADMIN_SIGNUP_CODE'
            }
        })
        if (!signupCode) {
            await AppDataSource.manager.save(new SystemConfig({
                key: 'ADMIN_SIGNUP_CODE',
                value: '123'
            }))
        }
        await correctProductEarnings()
    }
    applyCorrections().then(() => {
        console.log('corrected product earnings')
    }).catch((e) => {
        console.log(e)
    })

    const app = express();


    // cookie parser


    app.use(cookieParser());

    app.use(morgan('dev'));

    // parse application/x-www-form-urlencoded
    app.use(express.urlencoded({extended: false}));

    // parse application/json
    app.use(express.json());


    const uploadRouter = getUploadRouter()
    app.use('/uploads', uploadRouter)
    let logAdditionals: any;

    //cor
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
            return res.status(200).json({});
        }
        next();
    })


    //helmet
    // app.use(helmet.contentSecurityPolicy({
    //     directives: {
    //         defaultSrc: ["'self'"],
    //         scriptSrc: ["'self'"]
    //     }
    // }));
    //allow unsafe-inline for now
    // app.use(helmet.contentSecurityPolicy({
    //     directives:  {
    //             defaultSrc: ["'self'"],
    //             scriptSrc: ["'self'", "'unsafe-inline'"],
    //             styleSrc: ["'self'", "'unsafe-inline'"],
    //             imgSrc: ["'self'", "data:"],
    //             fontSrc: ["'self'", "data:"],
    //             connectSrc: ["'self'"],
    //             objectSrc: ["'self'"],
    //             frameSrc: ["'self'", "https://jsoncrack.com/"],
    //             mediaSrc: ["'self'"],
    //             childSrc: ["'self'"],
    //             formAction: ["'self'"],
    //             frameAncestors: ["'none'"],
    //             baseUri: ["'none'"]
    //
    // }
    // }));

    //set req.user if access token is valid
    app.use(logUserIn)

    for (let i = 0; i < routers.length; i++) {
        const router: {
            [entity: string]: Router
        } = routers[i];
        const entity = Object.keys(router)[0];
        app.use(`/${entity}`, router[entity]);
    }

    // /test route. sets an empty access token in cookies for testing
    app.get('/test', (req, res) => {
        // this cookie should work cross domain
        res.cookie('access_token', generateToken({}), {
            path: '/'
        })

        res.send("n'ok");
        
    })


    serveRouteList(app, {prefix: ''});

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2022-08-01",
      });
    app.use(express.static("public"));
    app.get("/config", (req, res) => {
        res.send({
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        });
      });

      app.post("/create-payment-intents", async (req, res) => {
        const { amount, currency } = req.body;
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            currency: currency,
            amount: amount,
            automatic_payment_methods: { enabled: true },
          });
      
          // Send publishable key and PaymentIntent details to client
          res.send({
            clientSecret: paymentIntent.client_secret,
          });
        } catch (e:any) {
          return res.status(400).send({
            error: {
              message: e.message,
            },
          });
        }
      });

    initializeScheduler();

    app.listen({
        host: host,
        port: port
    }, () => {
        console.log(`Server listening at http://${host}:${port}`);
        

        if (logAdditionals) {
            logAdditionals()
        }
    })
}
