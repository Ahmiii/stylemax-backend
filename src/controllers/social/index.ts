//SocialsController


import {Controller} from "../libs/definitions/controller";
import {Response} from "express";
import {Comment} from "../../entity/Comment";
import {Product} from "../../entity/Product";
import {Favorite} from "../../entity/Favorite";
import * as Joi from "joi";
import {checkBuyer} from "./checkBuyer";

export class SocialsController extends Controller {

    //-----------------comment-----------------
    async comment(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const joi_schema = Joi.object().keys({
                    product_id: Joi.number().required(),
                    comment: Joi.string().required()
                })
                const {error, value} = joi_schema.validate(req.body)
                if (error) {
                    return reject({
                        message: error.details.map((detail: any) => detail.message).join(", "),
                        status: 400
                    })
                }


                const comment = await this.dataSource.manager.save(Comment, {
                    user: {id: req.user.id},
                    product: {id: req.body.product_id},
                    comment: req.body.comment
                })
                return resolve(comment)
            } catch (e: any) {
                let message = "Something went wrong"

                //try to get the error message from the typeorm error
                if (e.message) {
                    //format the error for client
                    if(e.message.includes("duplicate key")) {
                        message = "You have already commented on this product"
                    }
                    if(e.message.includes("null value in column")) {
                        message = "Please provide a comment"
                    }
                }

                return reject({
                    message: message,
                    code: e.code,
                    detail: e.detail
                })
            }
        })
    }

    async getComments(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const comments = await this.dataSource.manager.find(Comment, {
                    where: {
                        product: {
                            id: req.query.product_id
                        }
                    },
                    relations: ["user"]
                })
                return resolve(comments)
            } catch (e: any) {
                return reject({
                    message: e.message,
                    code: e.code,
                    detail: e.detail
                })
            }
        })
    }

    async deleteComment(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            if (!req.user.id) {
                return reject({
                    message: "You are not authorized to delete this comment"
                })
            }
            try {
                let comment = await this.dataSource.manager.findOne(Comment, {
                    where: {
                        id: req.body.comment_id
                    },
                    relations: ["user"]
                })
                if (!comment) {
                    return reject({
                        message: "Comment not found"
                    })
                }
                if (comment.user.id !== req.user.id) {
                    return reject({
                        message: "You are not authorized to delete this comment"
                    })
                }
                await this.dataSource.manager.delete(Comment, {
                    id: req.body.comment_id
                })
                return resolve({
                    message: "Comment deleted successfully"
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

    //-----------------favorite-----------------
    async favorite(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
               await checkBuyer(req.user.id)

                let favorite = await this.dataSource.manager.findOne(Favorite, {
                    where: {
                        buyer: {id: req.user.id},
                        product: {id: req.body.product_id}
                    }
                })
                if (favorite) {
                    return reject({
                        message: "You have already favourited this product",
                        status: 400
                    })

                }
                favorite = await this.dataSource.manager.save(Favorite, {
                    buyer: {id: req.user.id},
                    product: {id: req.body.product_id}
                })
                return resolve(favorite)

            } catch (e: any) {
                if(e.status) {
                    return reject({
                        message: e.message,
                        status: e.status
                    })
                }
                return reject({
                    message: e.message,
                    code: e.code,
                    detail: e.detail
                })
            }
        })
    }

    async unfavorite(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            //favorite product
            try {
                const favorite = await this.dataSource.manager.findOne(Favorite,
                    {
                        where: {
                            buyer: {id: req.user.id},
                            product: {id: req.body.product_id}
                        }
                    })
                if (!favorite) {
                    return reject({
                        message: "You have not favourite-d this product"
                    })
                }
                await this.dataSource.manager.delete(Favorite, {
                    id: favorite.id
                })
                return resolve({
                    message: "Product unfavourited successfully"
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

    async getFavorites(req: any, res: Response): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const favorites = await this.dataSource.manager.find(Favorite, {
                    where: {
                        buyer: {id: req.user.id}
                    },
                    relations: ["product"]
                })
                return resolve(favorites)
            } catch (e: any) {
                return reject({
                    message: e.message,
                    code: e.code,
                    detail: e.detail
                })
            }
        })
    }

    //-----------------share_count-----------------
    async share(req: any, res: Response): Promise<unknown> {
        //POST /share will increase the share_count of a product by 1
        return new Promise(async (resolve, reject) => {
            if (!req.body.product_id) {
                return reject({
                    message: "product_id is required"
                })
            }

            try {
                let product = await this.dataSource.manager.findOne(Product, {
                    where: {
                        id: req.body.product_id
                    }
                })

                if (!product) {
                    return reject({
                        message: "Product not found"
                    })
                }

                product.share_count = product.share_count + 1
                await this.dataSource.manager.save(Product, product)

                return resolve({
                    message: "Product shared successfully"
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

}


