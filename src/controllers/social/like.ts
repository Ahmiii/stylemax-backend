//like controller

import {Controller} from "../libs/definitions/controller";
import {Response} from "express";
import {Like} from "../../entity/Like";
import {Product} from "../../entity/Product";
import {checkBuyer} from "./checkBuyer";

export class LikeController extends Controller {

    async like(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {

                await checkBuyer(req.user.id)

                if (!req.body.product_id) {
                    return reject({
                        message: "Please provide a product id",
                        status: 400
                    })
                }
                //check if buyer has liked the product
                const like = await this.dataSource.manager.findOne(Like, {
                    where: {
                        buyer: {
                            id: req.user.id
                        },
                        product: {
                            id: req.body.product_id
                        }
                    }
                })
                if (like) {
                    return res.status(400).json({
                        message: "You already liked this product"
                    })
                }

                let product = await this.dataSource.manager.findOne(Product, {
                    where: {
                        id: req.body.product_id
                    }
                })

                if (!product) {
                    return reject({
                        message: "Product not found",
                        status: 404
                    })
                }


                const newLike = await this.dataSource.manager.save(Like, {
                    buyer: {
                        id: req.user.id
                    },
                    product: {id: req.body.product_id}
                })
                return resolve(newLike)
            } catch (e: any) {
                return reject({
                    message: e.message,
                    code: e.code,
                    detail: e.detail
                })
            }
        })
    }

    async unlike(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const like = await this.dataSource.manager.findOne(Like, {
                    where: {
                        buyer: {id: req.user.id},
                        product: {id: req.body.product_id}
                    }
                })
                if (!like) {
                    return reject({
                        message: "Like not found",
                        status: 404
                    });
                }
                await this.dataSource.manager.delete(Like, like.id)
                return resolve({
                    message: "Unlike successful"
                })
            } catch (e: any) {
                return reject({
                    message: e.message,
                    code: e.code,
                    detail: e.detail
                })
            }
        })
    }

    async getLikes(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const likes = await this.dataSource.manager.find(Like, {
                    where: {
                        product: {
                            id: req.params.product_id
                        }
                    },
                    relations: ['product', 'buyer']

                })

                let loggedInUser = req.user;

                if (loggedInUser) {
                    for (let i = 0; i < likes.length; i++) {
                        let like = likes[i];
                        if (like.buyer.id === loggedInUser.id) {
                            // @ts-ignore
                            like.liked = true;
                        }
                    }
                }


                return resolve(likes)
            } catch (e: any) {
                return reject({
                    message: e.message,
                    code: e.code,
                    detail: e.detail
                })
            }
        })
    }

    //getUserLikes
    async getUserLikes(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const likes = await this.dataSource.manager.find(Like, {
                    where: {
                        buyer: {
                            id: req.user.id
                        }
                    },
                    relations: ['product']
                })
                return resolve(likes)
            } catch (e: any) {
                return reject({
                    message: e.message,
                    code: e.code,
                    detail: e.detail
                })
            }
        })
    }
}
