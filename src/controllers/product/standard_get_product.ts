import {AppDataSource} from "../../libs/data-source";
import {Product} from "../../entity/Product";
import {ProductRanges} from "./productRanges";

import {StandardQueryOrderingParams} from "./standard_query_ordering_params";
import {In, MoreThan} from "typeorm";

export async function standardGetProduct(where: any, {
    sort,
    order,
    filter,
    page, limit, offset, my_products = false
}: StandardQueryOrderingParams & { my_products?: boolean }) {


    //category and sub_category are required
    let required_where:any = undefined;

    if(Array.isArray(where)){
        required_where = where.find((where: any) => where.sub_category) || required_where;

        if(required_where){
            where = where.map((where: any) => {
                if(!where.sub_category){
                    return {
                        ...where,
                        sub_category: required_where.sub_category,
                        stock: MoreThan(0)
                    }
                }
            })
        }
    }else {
        where = {...where,
        stock: MoreThan(0)
        }
    }



    const [productsAll, total] = await AppDataSource.manager.findAndCount(Product, {
        where,
        relations: ["details", "sub_category", "brand", "colours", "sizes", "likes", "comments", "comments.user", "favorites"],
        loadEagerRelations: true,
        order: {
            [sort]: order
        },
        skip: offset,
        take: limit
    });


    const productIds = productsAll.map((product: any) => product.id)


    console.log("productIds", productIds)
    return {
        products:productsAll,
        total,
        page,
        limit,
        sort,
        order,
        filter,
        pages: Math.ceil(total / limit),
        ...await ProductRanges.getAll(productIds)
    }


}
