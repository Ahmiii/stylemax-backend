//admin controller

import {Controller} from "./libs/definitions/controller";
import {User} from "../entity/User";
import {hashPassword, setToken} from "../libs/utils";
import * as Joi from "joi";
import {ERRORS} from "../libs/utils/errors";
import {PlatformFee, PromoCode} from "../entity/Models";
import {MoreThan, Not} from "typeorm";
import {NewOrder} from "../entity/Product";
import {SystemConfig} from "../entity/Config";

function getDateFromDuration(duration: string | boolean | number): Date | null {
   if (typeof duration === 'number' || typeof duration === 'boolean') {
        const today = new Date();
        const twoDaysAgo = null
        return twoDaysAgo;
    }

    const unit = duration.slice(-1);
    const amount = parseInt(duration.slice(0, -1));
    const today = new Date();
    let resultDate: any = null;

    switch (unit) {
        case 'd':
            resultDate = new Date(today.getTime() + (amount * 24 * 60 * 60 * 1000));
            break;
        case 'm':
            resultDate = new Date(today.getFullYear(), today.getMonth() + amount, today.getDate());
            break;
        case 'y':
            resultDate = new Date(today.getFullYear() + amount, today.getMonth(), today.getDate());
            break;
        default:
            throw new Error('Invalid duration unit: ' + unit);
    }

    return resultDate;
}

//get date for past date (30d -> date 30 days ago)
export function getDateAgo(dateFormat: string): Date {
    const currentDate = new Date();

    // Extract the numerical value and unit from the date format
    const value = parseInt(dateFormat);
    const unit = dateFormat.charAt(dateFormat.length - 1);

    // Calculate the date ago based on the unit
    let dateAgo: Date;
    if (unit === 'd') {
        dateAgo = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - value);
    } else if (unit === 'w') {
        dateAgo = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - (value * 7));
    } else if (unit === 'm') {
        dateAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - value, currentDate.getDate());
    }
    else if (unit === 'y') {
        dateAgo = new Date(currentDate.getFullYear() - value, currentDate.getMonth(), currentDate.getDate());
    } else {
        throw new Error('Invalid date format');
    }

    return dateAgo;
}

interface GraphableData {
    count: string;
    date: string;
}
function fillGraphData(graphDataArray: GraphableData[][]): GraphableData[][] {
    // Find all unique dates across all arrays
    const allDates = Array.from(
        new Set(graphDataArray.flatMap((data) => data.map((item) => item.date)))
    );

    // Sort all dates in ascending order
    allDates.sort();

    // Fill missing dates in each array
    const filledGraphData: GraphableData[][] = graphDataArray.map((data) => {
        const filledArray: GraphableData[] = [];

        for (const date of allDates) {
            const existingData = data.find((item) => item.date === date);

            if (existingData) {
                filledArray.push(existingData);
            } else {
                filledArray.push({ count: "0", date });
            }
        }

        return filledArray;
    });

    return filledGraphData;
}

function genExpireDate(date_str:string|undefined){

    return new Date((new Date()).getTime() + (30 * 24 * 60 * 60 * 1000));
}
export class AdminController extends Controller {
    //login
    async login(req: any, res: any): Promise<unknown> {
        
        if(!req.user){
            throw ERRORS.UserNotAuthorized()
        }

        const user = await this.dataSource.manager.findOne(User, {
            where: {
                id: req.user.id,
                isAdmin: true
            }
        })

        if(!user){
            throw ERRORS.UserNotAuthorized()
        }

        user.role = "admin"
        await this.dataSource.manager.save(user)


        //set token in cookie
        //setToken(user, res);

        return user;
    }

    async setSignupCode(req: any, res: any): Promise<unknown> {
        const schema = Joi.object({
            code: Joi.string().required()
        })

        const {error, value} = schema.validate(req.body);

        if(error){
            throw error
        }

        const {code} = value;


         let signupCodeKey = 'ADMIN_SIGNUP_CODE';

         //if exists, update, if not, create
        //SystemConfig is a key-value table
        let signupCode = await this.dataSource.manager.findOne(SystemConfig, {
            where: {
                key: signupCodeKey
            }
        })

        if(!signupCode){
            signupCode = this.dataSource.manager.create(SystemConfig, {
                key: signupCodeKey,
                value: code
            })
        }

        signupCode.value = code;

        return await this.dataSource.manager.save(signupCode);
    }

    //signup
    async signup(req: any, res: any): Promise<unknown> {
        //if signup code is correct, auto set isAdmin to true, isVerified to true
        //if signup code is incorrect, throw error
        const schema = Joi.object({

            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().required(),
            signup_code: Joi.string().optional()
        })

        const {error, value} = schema.validate(req.body);

        if(error){
            throw error
        }

        const {firstName, lastName, email, password,  signup_code} = value;

        //check if signup code is correct
        const signupCode = await this.dataSource.manager.findOne(SystemConfig, {
            where: {
                key: 'ADMIN_SIGNUP_CODE',
                value: signup_code
            }
        })

        if(!signupCode || !signup_code){
            throw ERRORS.UserNotAuthorized()
        }

        //check if user already exists
        const user = await this.dataSource.manager.findOne(User, {
            where: {
                email
            }
        })

        if(user){
            throw ERRORS.UserAlreadyExists()
        }

        const newUser = this.dataSource.manager.create(User, {
            firstName: firstName,
            lastName: lastName,
            email,
            password: await hashPassword(password),
            isAdmin: true,
            isVerified: true
        })

        await this.dataSource.manager.save(newUser)

        //set token in cookie
        setToken(newUser, res);

        return newUser;
    }

    //block user
    //data: {block: 30d} or {block: false} to unblock (will set user.blocked_till to 2 days ago)
    async blockUser(req: any, res: any): Promise<unknown> {
        const schema = Joi.object({
            block: Joi.alternatives().try(Joi.string(), Joi.boolean(), Joi.number()).required()
        })

        const {error, value} = schema.validate(req.body);

        if(error){
            throw error
        }

        if(!req.params.id){
            throw ERRORS.invalidParams("please provide user id to block")
        }

        //cannot block self
        if(req.user.id === req.params.id){
            throw ERRORS.UserNotAuthorized()
        }


        const {block} = value;

        const user = await this.dataSource.manager.findOne(User, {
            where: {
                id: req.params.id,
                isAdmin: false
            }
        })

        if(!user){
            throw {
                message: "User not found OR user is admin"
            }
        }

        const date = getDateFromDuration(block);

        user.blocked_till = date!;

        return await this.dataSource.manager.save(user);
    }



    //create promocode
    async createPromoCode(req: any, res: any): Promise<unknown> {
        //joi validation
        const schema = Joi.object({
            code: Joi.string().optional(),
            discount: Joi.number().required(),
            expiry_date: Joi.date().required(),
            is_active: Joi.boolean().optional().default(true),
            count: Joi.number().optional()
        })

        const {error, value} = schema.validate(req.body);

        if(error){
            return res.status(400).json({
                message: error.message
            })
        }

        let {code, discount, expiry_date, is_active, count, discount_type} = value;

        //enum: ['fixed', 'percentage'] valid discount types
        if(!discount_type){
            discount_type = "fixed"
        }else if(!["fixed", "percentage"].includes(discount_type)){
            throw new Error("Invalid discount type. Valid types: fixed, percentage")
        }


        if(!code){
            code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }

        const promoCode = this.dataSource.manager.create(PromoCode, {
            code,
            discount,
            expiry_date: genExpireDate(expiry_date),
            is_active,
            discount_type,
            count
        })

        await this.dataSource.manager.save(promoCode)

        return promoCode;
    }

    //get all promocodes (optional: filter by isActive, filter by expiryDate)
    async getPromoCodes(req: any, res: any): Promise<unknown> {
        const {is_active, expiry_date} = req.query;

        return await this.dataSource.manager.find(PromoCode, {
            where: {
                is_active,
                expiry_date,
            }
        });
    }

    //get platform-fee-config
    async getPlatformFeeConfig(req: any, res: any): Promise<unknown> {
        return await this.dataSource.manager.findOne(PlatformFee,{where:{}});
    }

    //update/create platform-fee-config (only one row so update if exists, create if not)
    async createPlatformFeeConfig(req: any, res: any): Promise<unknown> {

        const schema = Joi.object({
            id: Joi.any().optional(),
            min_val: Joi.number().required(),
            fixed_amount: Joi.number().required(),
            percentage: Joi.number().required()
        })

        const {error, value} = schema.validate(req.body);

        if(error){
            throw error
        }

        const platformFee = await this.dataSource.manager.findOne(PlatformFee, {
            where: {}
        })

        if(platformFee){
            platformFee.min_val = value.min_val;
            platformFee.fixed_amount = value.fixed_amount;
            platformFee.percentage = value.percentage;

            return await this.dataSource.manager.save(platformFee)
        }

        return await this.dataSource.manager.save(this.dataSource.manager.create(PlatformFee, value))

    }

    //get orders
    async getOrders(req: any, res: any): Promise<unknown> {
        const order_status = req.query.status;
        return await this.dataSource.manager.find(NewOrder, {
            where: {
                order_status
            },
            relations: ["buyer", "product", "product.details","vendor"]
        })
    }

   //dashboard data
   //  exampleDashboardData = {
   //      allOrders: 100,
   //      deliveredOrders: 50,
   //      pendingOrders: 50,
   //      totalUsers: 100,
   //      userEngagementScore: 100,
   //      productListingScore: 100
   //  }
    async getDashboardData(req: any, res: any): Promise<unknown> {
        //extract duration from query
        console.log({req} +"Here it is")
        let {duration} = req.query;

        if(!duration){
            duration = "30d"
        }
        //all dashboard data will be calculated from this date
        const date = getDateAgo(duration);

        // console.log("date", date)

        if(!date){
            throw ERRORS.invalidParams("please provide valid duration")
        }

        //get all orders
        const allOrders = await this.dataSource.manager.find(NewOrder, {
            where: {
                createdAt: MoreThan(date)
            }
        })

        //get delivered orders
        const deliveredOrders = await this.dataSource.manager.find(NewOrder, {
            where: {
                deliveredAt: MoreThan(date),
                order_status: "delivered"
            }
        })

        //get pending orders
        const pendingOrders = await this.dataSource.manager.find(NewOrder, {
            where: {
                createdAt: MoreThan(date),
                order_status: Not("delivered")
            }
        })

        //get total users
        const totalUsers = await this.dataSource.manager.count(User, {
            where: {
                createdAt: MoreThan(date)
            }
        })

        //get user engagement score
        //from comments (in Comment), likes (in Like), orders (in Order), share_count (in Product)
        const userEngagementScore = await this.dataSource.manager.query(`
            SELECT COUNT(*) as count
            FROM (SELECT COUNT(*) as count
                  FROM comment
                  WHERE "createdAt" > '${date.toISOString()}'
                  GROUP BY "userId"
                  UNION ALL
                  SELECT COUNT(*) as count
                  FROM "like"
                  WHERE "createdAt" > '${date.toISOString()}'
                  GROUP BY "buyerId"
                  UNION ALL
                  SELECT COUNT(*) as count
                  FROM "new_order"
                  WHERE "createdAt" > '${date.toISOString()}'
                  GROUP BY "buyerId"
                  UNION ALL
                  SELECT SUM(share_count) as count
                  FROM product
                  WHERE "createdAt" > '${date.toISOString()}'
                  GROUP BY "vendorId") as counts 
        `)

        //get product listing score
        //from products (in Product)
        const productListingScore = await this.dataSource.manager.query(`
            SELECT COUNT(*) as count
            FROM product
            WHERE "createdAt" > '${date.toISOString()}'
        `)

        //graphables, to show on area graph.
        //example: [{date: "2021-01-01", value: 10}, {date: "2021-01-02", value: 20}]
        const [g1, g2, g3] = await Promise.all([
  this.dataSource.manager.query(`
            SELECT COUNT(*) as count, DATE_TRUNC('day', "createdAt") as date
            FROM product
            WHERE "createdAt" > '${date.toISOString()}'
            GROUP BY date
        `), this.dataSource.manager.query(`
            SELECT COUNT(*) as count, DATE_TRUNC('day', "createdAt") as date
            FROM "new_order"
            WHERE "createdAt" > '${date.toISOString()}'
            GROUP BY date
        `),this.dataSource.manager.query(`
            SELECT COUNT(*) as count, DATE_TRUNC('day', "createdAt") as date
            FROM "new_order"
            WHERE "deliveredAt" > '${date.toISOString()}'
            and "order_status" = 'delivered'
            GROUP BY date
        `)
])
        const [productsCreated, ordersCreated, ordersDelivered] =
        fillGraphData([g1, g2, g3])


        return {
            allOrders: allOrders.length,
            deliveredOrders: deliveredOrders.length,
            pendingOrders: pendingOrders.length,
            totalUsers,
            userEngagementScore: userEngagementScore[0].count,
            productListingScore: productListingScore[0].count,
            productsCreated,
            ordersCreated,
            ordersDelivered
        }

    }
}
