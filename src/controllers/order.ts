

import {Controller} from "./libs/definitions/controller";
import {Response} from "express";
import {NewOrder, Product} from "../entity/Product";
import {EntityManager, MoreThan, MoreThanOrEqual} from "typeorm";
import {PromoCode, PromoCodeUsage} from "../entity/Models";
import {ShippingAddress} from "../entity/ShippingAddress";
import * as Joi from "joi";
import {User} from "../entity/User";
import {getDateAgo} from "./admin";
import {AppDataSource} from "../libs/data-source";
import {Cart} from "../entity/Cart";
import {CartItem} from "../entity/CartItem";
import {sendOrderConfirmationEmail} from "./libs/utils";
import { resolve } from "path";
import { rejects } from "assert";

export const validOrderStatuses = ["pending", "processing", "delivered"]

export class OrderController extends Controller {
    async setOrderStatus(req: any, res: Response): Promise<unknown> {
        try {
          const orderId = req.body.id;
          const newStatus = req.body.newStatus;
          
      
          const order = await this.dataSource.manager.findOne(NewOrder, {
            where: {
              id: orderId,
            },
          });
      
          if (!order) {
            return res.status(404).json({
              message: "Order not found",
            });
          }
          if (newStatus === "delivered") {
            order.deliveredAt = new Date();
        }
          order.order_status = newStatus;
          await this.dataSource.manager.save(order);
          res.status(200).json({
            message: "Order status updated successfully",
          });
        } catch (error) {
            console.error("Error in setOrderStatus:", error);
          res.status(500).json({
            message: "Internal server error",
          });
        }
      }
      
    async createOrder(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!req.body.product_id || !req.body.quantity) {
                    return reject({
                        message: "product_id and quantity are required",
                        status: 400
                    })
                }

                const shippingAddrQuery: any = {}

                if (req.body.shipping_address_id) {
                    shippingAddrQuery["id"] = req.body.shipping_address_id
                } else {
                    shippingAddrQuery["isDefault"] = true
                }
                //find shipping address for user (req.user.id)
                const shippingAddress = await this.dataSource.manager.findOne(ShippingAddress, {
                    where: {
                        user: {
                            id: req.user.id
                        },
                        ...shippingAddrQuery
                    }
                })

                if (!shippingAddress) {
                    return reject({
                        message: "Shipping address not found. Either provide shipping_address_id or set a default shipping address",
                        status: 404
                    })
                }

                let cart: Cart | null = await this.findCart(req.user.id, req.body.product_id);

                const product = await this.dataSource.manager.findOne(Product, {
                    where: {
                        id: req.body.product_id,
                        //greater than or equal to quantity
                    },
                    relations: ["vendor", "details"]
                })
                if (!product) {
                    return reject({
                        message: "Product not found or not enough stock",
                        status: 404
                    })
                }

                if (product.vendor.id == req.user.id) {
                    return reject({
                        message: "You cannot order your own product",
                        status: 400
                    })
                }
                console.log("product", product);
                const newOrder = new NewOrder({})
                newOrder.buyer = req.user;
                newOrder.vendor = product.vendor;
                newOrder.product = product;
                newOrder.quantity = req.body.quantity;
                newOrder.shippingAddress = shippingAddress;
                newOrder.final_price = product.details.offered_price * req.body.quantity;

                let promoCode: PromoCode | null;
                let promoCodeUsage: PromoCodeUsage | null;
                //check if promo code is valid
                if (req.body.promo_code) {
                    promoCode = await this.dataSource.manager.findOne(PromoCode, {
                        where: {
                            code: req.body.promo_code,
                            is_active: true,
                            count: MoreThan(0),
                            expiry_date: MoreThan(new Date())
                        }
                    })
                    if (!promoCode) {
                        return reject({
                            message: "Invalid promo code",
                            status: 400
                        })
                    }
                    await this.testPromoCode(promoCode, req.user);
                    // newOrder.final_price -= promoCode.discount;
                    if (promoCode.discount_type == "percentage") {
                        newOrder.final_price -= newOrder.final_price * (promoCode.discount / 100);
                    } else {
                        newOrder.final_price -= promoCode.discount;
                    }

                    promoCode.count -= 1;

                    promoCodeUsage = new PromoCodeUsage({
                        promoCode,
                        user: req.user
                    })

                }

                await this.dataSource.manager.transaction(async manager => {
                    if (promoCode) {
                        await manager.save(PromoCode, promoCode);
                        await manager.save(PromoCodeUsage, promoCodeUsage!);
                    }
                    await manager.save(NewOrder, newOrder);
                    if (cart) {
                        //we know: cart exists, cart.cartItem exists, cart.cartItem.product exists
                        //we don't know: cart.cartItem.quantity < or > newOrder.quantity or == newOrder.quantity
                        //handle all cases
                        if (cart.cartItems[0].quantity > newOrder.quantity) {
                            cart.cartItems[0].quantity -= newOrder.quantity;
                            await manager.save(Cart, cart);
                        } else if (cart.cartItems[0].quantity == newOrder.quantity) {
                            await this.removeCartItem(manager, cart, req.body.product_id);
                        } else {
                            //if cart.cartItem.quantity < newOrder.quantity then remove cart.cartItem as above, but also update product.stock if available, otherwise throw error
                            //we need to cover for cartItem quantity by taking it from product.stock (if available) or throw error
                            const quantityToCover = newOrder.quantity - cart.cartItems[0].quantity;
                            if (product.stock < quantityToCover) {
                                return reject({
                                    message: "Not enough stock",
                                    status: 400
                                })
                            }
                            product.stock -= quantityToCover;
                            await this.removeCartItem(manager, cart, req.body.product_id);
                        }

                    } else {
                        product.stock -= newOrder.quantity;
                    }
                    if(product.stock < 0){
                        return reject({
                            message: "Not enough stock. Please reduce quantity.",
                            status: 400
                        })
                    }
                    await manager.save(Product, product);
                })
                let order = (await this.dataSource.manager.findOne(NewOrder, {
                    where:{
                        id: newOrder.id
                    },
                    relations: ["product", "product.details", "product.colours", "product.sizes", "shippingAddress", "vendor", "buyer"]
                }))!

                // await sendOrderConfirmationEmail(order.buyer.email, order);

                return resolve(newOrder);
            } catch (err:any) {
                console.log(err+" error HEREEEEEE ")
                return reject(err);
            }
        })
    }

//get orders
    async getOrders(req: any, res: Response): Promise<unknown> {

        //const order_status = req.query.status ?? "delivered";
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await this.dataSource.manager.find(NewOrder, {
                    where: {
                        buyer: {
                            id: req.user.id
                        },
                       // order_status
                    },
                    relations: ["product"]
                })
                return resolve(orders);
            } catch (err) {
                return reject(err);
            }
        })
    }

    async getOrder(req: any, res: Response): Promise<unknown> {
        if(!req.params.id){
            return {
                message: "Please provide order id in url /order/:id",
                status: 400
            }
        }
        //by id
        return this.dataSource.manager.findOne(NewOrder, {
            where: {
                id: req.params.id,
            },
            relations: ["product", "product.details", "product.colours", "product.sizes", "shippingAddress", "vendor", "buyer"]
        })
    }

    //get sales (order.vendor)
    async getSales(req: any, res: Response): Promise<unknown> {
        console.log(req+"Here is the request for pending orders \n")
        return new Promise(async (resolve, reject) => {
            
            const order_status = req.query.status ?? "delivered";
            if (!validOrderStatuses.includes(order_status)) {
                return reject({
                    message: "Invalid order status",
                    status: 400
                })
            }
            try {
                const orders = await this.dataSource.manager.find(NewOrder, {
                    where: {
                        vendor: {
                            id: req.user.id
                        },
                        // order_status
                    },
                    relations: ["product"]
                })
                return resolve(orders);
            } catch (err) {
                return reject(err);
            }
        })
    }

    //get all orders (admin)
    async getAllOrders(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await this.dataSource.manager.find(NewOrder, {
                    relations: ["product"]
                })
                return resolve(orders);
            } catch (err) {
                return reject(err);
            }
        })
    }

//     //create shipping address
    async createShippingAddress(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {

                let {error, value} = {error: undefined, value: undefined} as any;
                let t: any = undefined;

                if (req.body.shipping_address_id) {
                    //existing shipping address
                    const shippingAddressSchema = Joi.object({
                        shipping_address_id: Joi.number().required(),
                        isDefault: Joi.boolean().optional(),
                        firstname: Joi.string().optional(),
                        lastname: Joi.string().optional(),
                        address: Joi.string().optional(),
                        address2: Joi.string().optional(),
                        city: Joi.string().optional(),
                        state: Joi.string().optional(),
                        country: Joi.string().optional(),
                        zipCode: Joi.string().optional(),
                        phoneNumber: Joi.string().optional(),
                    })

                    //validate using joi
                    t = shippingAddressSchema.validate(req.body);
                } else {
                    const shippingAddressSchema = Joi.object({
                        firstname: Joi.string().required(),
                        lastname: Joi.string().required(),
                        address: Joi.string().required(),
                        address2: Joi.string().optional(),
                        city: Joi.string().required(),
                        state: Joi.string().required(),
                        country: Joi.string().required(),
                        zipCode: Joi.string().required(),
                        phoneNumber: Joi.string().required(),
                        isDefault: Joi.boolean().optional()
                    })

                    //validate using joi
                    t = shippingAddressSchema.validate(req.body);
                }
                error = t.error;
                value = t.value;
                if (error) {
                    return res.status(400).json({
                        message: error.message
                    })
                }

                let shippingAddress: any = null;

                //only one default shipping address
                const defaultShippingAddress = await this.dataSource.manager.findOne(ShippingAddress, {
                    where: {
                        user: {
                            id: req.user.id
                        },
                        isDefault: true
                    },
                    select: ["id"]
                })

                await this.dataSource.manager.transaction(async manager => {
                    if (defaultShippingAddress) {
                        await manager.update(ShippingAddress, defaultShippingAddress.id, {
                            isDefault: false
                        })
                    }
                    // shippingAddress = await manager.save(ShippingAddress, {
                    //     ...value,
                    //     user: req.user
                    // })

                    if (req.body.shipping_address_id) {
                        shippingAddress = await manager.findOne(ShippingAddress, {
                            where: {
                                id: req.body.shipping_address_id
                            }
                        })
                        if (!shippingAddress) {
                            return reject({
                                message: "Shipping address not found",
                                status: 404
                            })
                        }
                        if (value.isDefault === false) {
                            //cannot set default to false. atleast one shipping address must be default
                            value.isDefault = true;
                        }

                        shippingAddress = {
                            ...shippingAddress,
                            ...value
                        }
                        shippingAddress = await manager.save(ShippingAddress, shippingAddress!)

                    } else {
                        shippingAddress = await manager.save(ShippingAddress, {
                            ...value,
                            user: req.user
                        })
                    }
                })

                if (!shippingAddress) {
                    return reject({
                        message: "Unable to create shipping address",
                        status: 500
                    })
                }


                return resolve(shippingAddress);
            } catch (err) {
                return reject(err);
            }
        })
    }

    //get user's shipping addresses
    async getShippingAddresses(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const shippingAddresses = await this.dataSource.manager.find(ShippingAddress, {
                    where: {
                        user: {
                            id: req.user.id
                        }
                    }
                })
                return resolve(shippingAddresses);
            } catch (err) {
                return reject(err);
            }
        })
    }

// /     //shipping address crud routes

    //validate promo code
    async validatePromoCode(req: any, res: Response): Promise<unknown> {
        const promoCode = await this.dataSource.manager.findOne(PromoCode, {
            where: {
                code: req.body.code
            }
        })


        await this.testPromoCode(promoCode, req.user)

        return (promoCode);

    }

    //confirm order arrival
    async confirmOrderArrival(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const order = await this.dataSource.manager.findOne(NewOrder, {
                    where: {
                        id: req.params.id,
                        buyer: {
                            id: req.user.id
                        }
                    }
                })
                if (!order) {
                    return reject({
                        message: "Order not found",
                        status: 404
                    })
                }

                if (order.order_status === "delivered") {
                    return reject({
                        message: "Order delivery already confirmed.",
                        status: 400
                    })
                }

                order.order_status = "delivered";
                order.deliveredAt = new Date();
                await this.dataSource.manager.save(NewOrder, order);
                return resolve(order);
            } catch (err) {
                return reject(err);
            }
        })
    }

    //set shipping address as default
    async setShippingAddressAsDefault(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const shippingAddress = await this.dataSource.manager.findOne(ShippingAddress, {
                    where: {
                        id: req.params.id,
                        user: {
                            id: req.user.id
                        }
                    }
                })
                if (!shippingAddress) {
                    return reject({
                        message: "Shipping address not found",
                        status: 404
                    })
                }

                //only one default shipping address
                const defaultShippingAddress = await this.dataSource.manager.findOne(ShippingAddress, {
                    where: {
                        user: {
                            id: req.user.id
                        },
                        isDefault: true
                    },
                    select: ["id"]
                })

                await this.dataSource.manager.transaction(async manager => {
                    if (defaultShippingAddress) {
                        await manager.update(ShippingAddress, defaultShippingAddress.id, {
                            isDefault: false
                        })
                    }
                    await manager.update(ShippingAddress, shippingAddress.id, {
                        isDefault: true
                    })
                })

                return resolve(shippingAddress);
            } catch (err) {
                return reject(err);
            }
        })
    }

    //get vendor's earnings (calculated from order.order_status === "delivered")
    async getVendorEarnings(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {


                //seperate select and sum query. first select quantity from order, and earnings from product_detail
                // const vendorEarnings = await this.dataSource.manager.query(`
                //     SELECT SUM(quantity * vendor_earnings) as earnings
                //     from (SELECT quantity, earnings as vendor_earnings
                //           FROM "new_order"
                //                    INNER JOIN "product" ON "new_order"."productId" = "product"."id"
                //                    INNER JOIN "product_detail" ON "product"."id" = "product_detail"."productId"
                //           WHERE order_status = 'delivered'
                //             and product."vendorId" = ${req.user.id}) as s
                // `)
                //
                // const earnings = vendorEarnings[0]?.earnings || 0;
                // return resolve({
                //     earnings
                // });

                // ability to query for using 30d, 7d, 24h, 1h
                const {duration} = req.query;

                const dateAgo = getDateAgo(duration ?? '30d');
                const vendorEarnings = await this.dataSource.manager.query(`
                    SELECT SUM(quantity * vendor_earnings) as earnings
                    from (SELECT quantity, earnings as vendor_earnings
                          FROM "new_order"
                                   INNER JOIN "product" ON "new_order"."productId" = "product"."id"
                                   INNER JOIN "product_detail" ON "product"."id" = "product_detail"."productId"
                          WHERE order_status = 'delivered'
                            and product."vendorId" = ${req.user.id}

                            and new_order."deliveredAt" > '${dateAgo.toISOString()}') as s
                `)

                const earnings = vendorEarnings[0]?.earnings || 0;

                let durationGraph: {
                    date: string,
                    earnings: number
                }[] = []

                //get earnings for each day in the duration for vendor
                if (duration) {
                    durationGraph = await this.dataSource.manager.query(`
                        SELECT date, earnings
                        from (SELECT date, SUM(quantity * vendor_earnings) as earnings
                              from (SELECT quantity, earnings as vendor_earnings, "deliveredAt" as date
                                    FROM "new_order"
                                             INNER JOIN "product" ON "new_order"."productId" = "product"."id"
                                             INNER JOIN "product_detail" ON "product"."id" = "product_detail"."productId"
                                    WHERE order_status = 'delivered'
                                      and product."vendorId" = ${req.user.id}
                                      and new_order."deliveredAt" > '${dateAgo.toISOString()}'
                                    GROUP BY date, quantity, vendor_earnings) as s
                              GROUP BY date) as s2
                        ORDER BY date ASC
                    `)

                }


                //fill in missing dates with 0 earnings
                if (duration) {
                    const dateMap = new Map<string, number>();
                    durationGraph.forEach((value, index) => {
                        dateMap.set(value.date, index);
                    })

                    let date = dateAgo;

                    //if duration is 30d, then fill in 30 days
                    while (date.getTime() < new Date().getTime()) {
                        const dateString = date.toISOString().split('T')[0];
                        if (!dateMap.has(dateString)) {
                            durationGraph.push({
                                date: dateString,
                                earnings: 0
                            })
                        }
                        date.setDate(date.getDate() + 1);
                    }
                }


                return resolve({
                    earnings,
                    duration: duration ?? '30d',
                    durationGraph
                });


            } catch (err) {
                return reject(err);
            }
        })
    }

    private async removeCartItem(manager: EntityManager, cartData: Cart, product_id: any) {
        let cart:Cart =( await manager.findOne(Cart, {
            where: {
                id: cartData.id
            },
            relations: ["cartItems", "cartItems.product"]
        }))!
        //if cart.cartItems.length == 1 then remove entire cart, otherwise remove cart.cartItem
        if (cart.cartItems.length == 1) {
            await manager.remove(CartItem, cart.cartItems.find(cartItem => cartItem.product.id == product_id));
            await manager.remove(Cart, cart);
        }else {
            await manager.remove(CartItem, cart.cartItems.find(cartItem => cartItem.product.id == product_id));
        }
    }

    private async findCart(user_id: any, product_id: any): Promise<Cart | null> {
        if (!user_id || !product_id) {
            return null;
        }
        const cart = await this.dataSource.manager.findOne(Cart, {
            where: {
                buyer: {
                    id: user_id
                },
                cartItems: {
                    product: {
                        id: product_id
                    }
                }
            },
            relations: ["cartItems", "cartItems.product"]
        })
        return cart;
    }

    private async testPromoCode(promoCode: PromoCode | null, user: User | null) {
        let errorMessage: string | undefined = undefined;
        if (!promoCode) {
            errorMessage = "Promo code not found";
        } else if (!user) {
            errorMessage = "Login to validate promo code";
        } else if ((promoCode.expiry_date.getTime() - new Date().getTime()) < 0) {
            errorMessage = "Promo code has expired";
        } else if (!promoCode.is_active) {
            errorMessage = "Promo code is not active";
        } else if (promoCode.count == 0) {
            errorMessage = "Promo code has already been used";
        }

        if (errorMessage) {
            throw  {
                message: errorMessage,
                status: 400
            }
        } else {
            // //check if user has already used promo code
            let usageFound = await AppDataSource.manager.findOne(PromoCodeUsage, {
                where: {
                    user: {
                        id: user!.id
                    },
                    promoCode: {
                        code: promoCode!.code
                    }
                }
            })

            if (usageFound) {
                throw {
                    message: "Promo code has already been used",
                    status: 400
                }
            }
        }
    }
}
