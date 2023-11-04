//cart controller (referenced in cart router)
import {Response} from "express";
import {Cart} from "../entity/Cart";
import {CartItem} from "../entity/CartItem";
import {Product} from "../entity/Product";
import {Controller} from "./libs/definitions/controller";
import {User} from "../entity/User";
import {ERRORS} from "../libs/utils/errors";

function formatTypeOrmError(error: any) {
    //duplicate key error
    if (error.code === "23505") {
        return {
            message: "Already exists",
            status: 400
        }
    }

    return {
        message: error.message,
        code: error.code,
        detail: error.detail
    }
}

export class CartController extends Controller {
    //router.post("/", requireVerifiedUser, controller.createCart);
    //
    // router.get("/", requireVerifiedUser, controller.getCart);
    //
    // router.post("/:id", requireVerifiedUser, controller.addToCart);
    //
    // router.delete("/:id?cart_item='some_item_id'", requireVerifiedUser, controller.removeFromCart);
    //
    // router.put("/:id", requireVerifiedUser, controller.updateCart);
    //
    // router.delete("/", requireVerifiedUser, controller.clearCart);

    async createCart(req: any, res: Response): Promise<unknown> {
        const buyer = await this.dataSource.manager.findOne(User, {
            where: {
                id: req.user.id
            }
        })

        if (!buyer) {
            return res.status(404).json({
                message: "Buyer not found"
            })
        }

        // console.log(buyer);
        try {
            const cart = await this.dataSource.manager.save(Cart, {
                buyer: buyer
            });

            return res.status(201).json(cart);

        } catch (e) {
            return res.status(400).json(formatTypeOrmError(e))
        }

    }

    async getCart(req: any, res: Response): Promise<unknown> {
        const cart = await this.dataSource.manager.findOne(Cart, {
            where: {
                buyer: {
                    id: req.user.id
                }
            },
            relations: ["cartItems", "cartItems.product", "cartItems.product.brand", "cartItems.product.sub_category", "cartItems.product.details"]
        })

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            })
        }

        return res.status(200).json(cart);
    }

    async addToCart(req: any, res: Response): Promise<unknown> {
        if (!req.body.product_id || !req.body.quantity) {
            return res.status(400).json({
                message: "product_id and quantity are required"
            })
        }

        return new Promise(async (resolve, reject) => {
            const query: any = {
                buyer: {
                    id: req.user.id
                }
            }

            if (req.body.cart_id) {
                query.cart_id = req.body.cart_id
            }

            let cart: Cart | any = undefined;
            let carts = await this.dataSource.manager.find(Cart, {
                where: query
            })

            if (carts.length == 1) {
                cart = carts[0];
            } else if (carts.length > 1) {

                return reject({
                    message: "Multiple carts found. Please specify cart_id in request body.",
                    status: 400
                })
            }

            if (!cart) {
                try {
                    if (req.body.cart_id) {
                        return reject({
                            message: "Cart not found",
                            status: 404
                        })
                    }
                    cart = await this.dataSource.manager.save(Cart, {
                        buyer: req.user.id
                    })
                } catch (err: any) {
                    return reject({
                        message: err.message,
                        status: 500
                    })
                }

            }

            const product = await this.dataSource.manager.findOne(Product, {
                where: {
                    id: req.body.product_id
                },
                relations: ["vendor"]
            })

            if (!product) {
                return reject({
                    message: "Product not found",
                    status: 404
                })
            }
            if (product.vendor.id === req.user.id) {
                return reject({
                    message: "You cannot buy your own product",
                    status: 400
                })
            }


            if (!product) {

                return reject({
                    message: "Product not found",
                    status: 404
                })
            }


            let cart_item: CartItem;
            cart = await this.dataSource.manager.findOne(Cart, {
                //@ts-ignore
                where: {
                    buyer: {
                        id:req.user.id
                    },
                    id: cart.id
                },
                relations: ["cartItems", "cartItems.product"]
            })

            if (cart.cartItems.length > 0) {
                cart_item = cart.cartItems.find((item: CartItem) => item.product.id == product.id);
            }

            await this.dataSource.manager.transaction(async transactionalEntityManager => {
                try {

                    if (product.stock < req.body.quantity) {
                        return res.status(400).json({
                            message: "Product stock is not enough"
                        })
                    }

                    //@ts-ignore
                    product.stock -= req.body.quantity;

                    await transactionalEntityManager.save(product);

                    if (!cart) {
                        return reject({
                            message: "Cart not found",
                            status: 404
                        })
                    }


                    if (cart_item) {
                        cart_item.quantity += parseInt(req.body.quantity);
                    } else {
                        cart_item = new CartItem({
                            cart: cart,
                            product: product,
                            quantity: req.body.quantity
                        })
                    }

                    cart_item = await transactionalEntityManager.save(cart_item);


                    cart = await transactionalEntityManager.findOne(Cart, {
                        where: {
                            buyer: req.user.id,
                            id: cart.id
                        },
                        relations: ["cartItems", "cartItems.product"],
                        select: {
                            cartItems: {
                                id: true,
                                quantity:true,
                                product: {
                                    id: true,
                                    label: true,
                                    pictures: true,
                                    stock: true
                                }
                            }
                        }
                    })



                    return resolve(cart);
                } catch (err: any) {
                    let message = formatTypeOrmError(err);

                    return reject({
                        message,
                        status: 500
                    })
                }


            })
        })

    }

    async removeFromCart(req: any, res: Response): Promise<unknown> {

        const cart = await this.dataSource.manager.findOne(Cart, {
            where: {
                buyer: {
                    id: req.user.id
                },
                id: req.params.id
            }
        })

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            })
        }

        const query: any = {}
        if (req.body.cart_item_id) {
            query.id = req.body.cart_item_id;
        } else if (req.body.product_id) {
            query.product = {
                id: req.body.product_id
            }
        } else {
            throw ERRORS.invalidParams("One of 'cart_item_id' or 'product_id' is required!")
        }
        const cartItem = await this.dataSource.manager.findOne(CartItem, {
            where: query,
            relations: ["product"]
        })

        if (!cartItem) {
            return res.status(404).json({
                message: "Cart item not found"
            })
        }

        //transaction for updating product stock
        return await this.dataSource.transaction(async transactionalEntityManager => {
            cartItem.product.stock += cartItem.quantity;
            await transactionalEntityManager.save(cartItem.product);
            await transactionalEntityManager.remove(cartItem);

            return {
                message: "Cart item removed",
                status: 200
            }
        })


    }

    async clearCart(req: any, res: Response): Promise<unknown> {
        // DELETE /:id
        const cart = await this.dataSource.manager.findOne(Cart, {
            where: {
                buyer: {
                    id: req.user.id
                },
                id: req.params.id
            },
            relations: ["cartItems", "cartItems.product"]
        })

        if (!cart) {
            console.log("Cart not found")
            return res.status(404).json({
                message: "Cart not found"
            })
        }

        if (cart.cartItems.length > 0) {
            return await this.dataSource.transaction(async transactionalEntityManager => {
                for (let cartItem of cart.cartItems) {
                    cartItem.product.stock += cartItem.quantity;
                    await transactionalEntityManager.save(cartItem.product);
                    await transactionalEntityManager.remove(cartItem);
                }

                return {
                    message: "Cart cleared"
                }
            })
        }
        await this.dataSource.manager.remove(cart);

        return res.status(200).json({
            message: "Cart cleared"
        })
    }

}
