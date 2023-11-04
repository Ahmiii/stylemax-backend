import {Controller} from "../libs/definitions/controller";
import {ERRORS} from "../../libs/utils/errors";
import {AppDataSource} from "../../libs/data-source";
import {SubCategory} from "../../entity/SubCategory";
import {Product} from "../../entity/Product";
import {Category} from "../../entity/Category";
import {In, MoreThan} from "typeorm";
import {Brand} from "../../entity/Brand";
import {ProductRanges} from "./productRanges";
import {getProductsInOrder} from "./get_products_in_order";
import {validateQueryOrderingParams} from "./validate_query_ordering_params";
import { response } from "express";

export class ProductGet extends Controller {

    async vendor(req: any, res: any): Promise<unknown> {
        let vendor_id = req.query.vendor_id || req.user?.id;

        if (!vendor_id) {
            throw ERRORS.invalidParams("vendor_id is required. Please login or provide vendor_id in query params")
        }


        const value = await validateQueryOrderingParams(req.query);

        return await getProductsInOrder(
            value,
            {
                vendor: {
                    id: vendor_id
                }
            }
        )


    }

    async subCategory(req: any, res: any): Promise<unknown> {
        if (!req.params.sub_category_id) {
            throw ERRORS.invalidParams("sub_category_id is required")
        }

        const subCategory = await AppDataSource.manager.findOne(SubCategory, {
            where: {
                id: req.params.sub_category_id
            }
        })
        if (!subCategory) {
            throw ERRORS.invalidParams("sub category not found")
        }

        return await AppDataSource.manager.find(Product, {
            where: {
                sub_category: {
                    id: req.params.sub_category_id
                }
            }
            ,
            relations: ["details", "sub_category", "brand", "colours", "sizes", "likes", "comments", "comments.user", "favorites"]
        })


    }

    async category(req: any, res: any): Promise<unknown> {
        if (!req.params.category_id) {
            throw ERRORS.invalidParams("category_id is required")
        }

        const category = await AppDataSource.manager.findOne(Category, {
            where: {
                id: req.params.category_id
            }
        })
        if (!category) {
            throw ERRORS.invalidParams("category not found")
        }
        const subCategories = await AppDataSource.manager.find(SubCategory, {
            where: {
                category: {
                    id: req.params.category_id
                }
            }
        })

        const subCategoryIds = subCategories.map((subCategory: any) => subCategory.id)

        return await AppDataSource.manager.find(Product, {
            where: {
                sub_category: {
                    id: In(subCategoryIds)
                }
            },
            relations: ["details", "sub_category", "brand", "colours", "sizes", "likes", "comments", "comments.user", "favorites"]
        })
    }

    async brand(req: any, res: any): Promise<unknown> {
        if (!req.params.brand_id) {
            throw ERRORS.invalidParams("brand_id is required")
        }

        const brand = await AppDataSource.manager.findOne(Brand, {
            where: {
                id: req.params.brand_id
            }
        })

        if (!brand) {
            throw ERRORS.invalidParams("brand not found")
        }

        const products = await AppDataSource.manager.find(Product, {
            where: {
                brand: {
                    id: req.params.brand_id
                }
            },
            relations: ["details", "sub_category", "brand", "colours", "sizes", "likes", "comments", "comments.user", "favorites"]
        });

        const productIds = products.map((product: any) => product.id)

        return {
            products,
            ...await ProductRanges.getAll(productIds)


        }


    }


    async id(req: any, res: any): Promise<unknown> {

        //if id is provided, return product with details
        if (req.params.id) {
            let loggedInUser = req.user;

            let res = await AppDataSource.manager.findOne(Product, {
                where: {
                    id: req.params.id
                },
                relations: ["details", "sub_category", "brand", "colours", "sizes", "likes", "likes.buyer", "comments", "comments.user", "favorites"],
            });
            console.log(response + "the response")

            if(loggedInUser){
                let liked:boolean = res!.likes!.some((like:any) => like.buyer.id === loggedInUser.id);
                if(liked){
                    //@ts-ignore
                    res!.liked = true;
                }
            }

            return res;
        }

        const value = validateQueryOrderingParams(req.query);
        return await getProductsInOrder(value);
    }


    async bestSelling(req: any, res: any): Promise<unknown> {
        const query: any = {
            stock: MoreThan(0)
        }

        if (req.query.category_id) {
            query.sub_category = {
                category: {
                    id: req.query.category_id
                }
            }
        }

        if (req.query.sub_category_id) {
            query.sub_category = {
                id: req.query.sub_category_id
            }
        }

        //popularity score = (likes + comments + shares) / (time since posted)
        const products = await AppDataSource.manager.find(Product, {
            where: query,
            relations: ["likes", "comments", "details", "brand", "sub_category", "sub_category.category", "colours", "sizes"]
        })

        if(!products.length || products.length === 0){
            //return products by created date
            return await AppDataSource.manager.find(Product, {
                where: query,
                relations: ["likes", "comments", "details", "brand", "sub_category", "sub_category.category", "colours", "sizes"],
                order: {
                    createdAt: "DESC"
                }
            })
        }


        const productIds = products.map(product => product.id)
        const orders = await AppDataSource.manager.query(`
            SELECT "productId", COUNT(*) as count FROM new_order 
            WHERE new_order."productId" IN (${productIds.join(",")}) GROUP BY "productId"
        `)

        //if product has no orders, set its order count to 0, otherwise set it to the order count
        const productScores = products.map(product => {
            const order = orders.find((order:any) => order.productId === product.id)
            const orderCount = order ? order.count : 0
            console.log(`(product.likes.length , product.comments.length , product.share_count : ${product.likes.length} , ${product.comments.length} , ${product.share_count}) * orderCount : ${orderCount}`)
            const score =
                (1 +(product.likes.length * 10)
                    + (product.comments.length * 3)
                    + (product.share_count * 5)
                ) * (orderCount || 0.5)
            return {
                ...product,
                score
            }
        })

        //use order count as weight (order count has much more weight than likes and comments)
        if(!productScores.length || productScores.length === 0){
            return await AppDataSource.manager.find(Product, {
                where: query,
                relations: ["likes", "comments", "details", "brand", "sub_category", "sub_category.category", "colours", "sizes"],
                order: {
                    createdAt: "DESC"
                }
            })
        }
        return productScores.sort((a, b) => b.score - a.score)
    }


    //get by discount
    //percentage discount calculated from product.details.price and product.details.offered_price where product.details.price > product.details.offered_price
    async discount(req: any, res: any): Promise<unknown> {
        const discountedProducts = await this.getDiscountedProducts({
            category_id: req.query.category_id,
            sub_category_id: req.query.sub_category_id
        });

        return discountedProducts.sort((a, b) => b.discount - a.discount)
    }

    private async getDiscountedProducts({
        category_id,
        sub_category_id
                                        }:{
        category_id?: string,
        sub_category_id?: string
    }) {
        const query: any = {
            stock: MoreThan(0)
        }

        if (category_id) {
            query.sub_category = {
                category: {
                    id: category_id
                }
            }
        }

        if (sub_category_id) {
            query.sub_category = {
                id: sub_category_id
            }
        }

        const products = await AppDataSource.manager.find(Product, {
            where: query,
            relations: ["details", "brand", "sub_category", "sub_category.category", "colours", "sizes"]
        })

        const productIds = products.map(product => product.id)
        let productDiscounts;
        let error;
        try{
            productDiscounts = await AppDataSource.manager.query(`
            SELECT "productId", "price", "offered_price" FROM product_detail WHERE product_detail."productId" IN (${productIds.join(",")}) AND product_detail."price" > product_detail."offered_price"
        `)
        }catch (err){
            error = err;
        }

        if(error){
           throw {
                message: "An error occurred while fetching discounted products",
                code: 500
           }
        }


        const productDiscountsMap = productDiscounts.reduce((acc: any, productDiscount: any) => {
            acc[productDiscount.productId] = productDiscount
            return acc
        }, {})

        return products.map(product => {
            const productDiscount = productDiscountsMap[product.id]
            if (!productDiscount) {
                return {
                    ...product,
                    discount: 0
                }
            }
            const discount = Math.round(((productDiscount.price - productDiscount.offered_price) / productDiscount.price) * 100)
            return {
                ...product,
                discount
            }
        });
    }

    async subCategoryByDiscount(req: any, res: any): Promise<unknown> {

        const discountedProducts = await this.getDiscountedProducts({});

        const subCategories = discountedProducts.reduce((acc: any, product: any) => {
            const subCategory = product.sub_category
            if (!acc[subCategory.id]) {
                acc[subCategory.id] = {
                    sub_category: subCategory,
                    discounts: []
                }
            }
            acc[subCategory.id].discounts.push(product.discount)
            return acc
        }, {})

        const subCategoryDiscounts = Object.values(subCategories).map((subCategory: any) => {
            const averageDiscount = subCategory.discounts.reduce((acc: number, discount: number) => acc + discount, 0) / subCategory.discounts.length
            return {
                ...subCategory,
                averageDiscount
            }
        })

        return subCategoryDiscounts.sort((a, b) => b.averageDiscount - a.averageDiscount)
    }

}



