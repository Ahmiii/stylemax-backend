import {AppDataSource} from "../../libs/data-source";

export class ProductRanges {
    private static async priceRange(product_ids: number[]) {
        if (product_ids.length === 0) {
            return {
                min: 0,
                max: 0
            }
        }
        //by offered_price in product_details
        const result = await AppDataSource.manager.query(`
            SELECT MIN(offered_price) AS min,
                   MAX(offered_price) AS max
            FROM product_detail
            WHERE id IN (${product_ids.join(",")})
        `)
        return result[0]

    }

    private static async colors(product_ids: number[]) {
        if (product_ids.length === 0) {
            return []
        }

        return await AppDataSource.manager.query(`
            select t.label as colour  , count(*) from (
                                                          select p.id, "productColourId", pc.label from product_colour_products_product as pcp
                                                                                                            inner join product p on p.id = pcp."productId"
                                                                                                            inner join product_colour pc on pc.id = pcp."productColourId"
                                                          where p.id in (${product_ids.join(",")})
                                                          group by p.id, "productColourId", pc.label ) as t
            group by t.label
        `)
    }

    private static async brands(product_ids: number[]) {
        if (product_ids.length === 0) {
            return []
        }

        return await AppDataSource.manager.query(`
            SELECT brand.label AS brand,
                   brand.id    AS brand_id,
                   COUNT(*)    AS count
            FROM product
                     INNER JOIN brand ON brand.id = product."brandId"
            WHERE product.id IN (${product_ids.join(",")})
            GROUP BY brand.id
        `)

    }

    private static async sizes(product_ids: number[]) {
        if (product_ids.length === 0) {
            return []
        }
        return await AppDataSource.manager.query(`
            SELECT pc.label AS size,
                   COUNT(*) AS count
            FROM product_size_products_product as pcp
                     INNER JOIN product p on p.id = pcp."productId"
                     INNER JOIN product_size pc on pc.id = pcp."productSizeId"
            WHERE p.id IN (${product_ids.join(",")})
            GROUP BY pc.label
        `)
    }

    private static async styles(product_ids: number[]) {
        if (product_ids.length === 0) {
            return []
        }
        return await AppDataSource.manager.query(`
            SELECT style    AS style,
                   COUNT(*) AS count
            FROM product_detail
            WHERE id IN (${product_ids.join(",")})
            GROUP BY style
        `)
    }

    private static async conditions(product_ids: number[]) {
        if (product_ids.length === 0) {
            return []
        }
        return await AppDataSource.manager.query(`
            SELECT condition AS condition,
                   COUNT(*)  AS count
            FROM product_detail
            WHERE id IN (${product_ids.join(",")})
            GROUP BY condition
        `)
    }

    static async getAll(product_ids: number[]) {
        return {
            // price: await ProductRanges.priceRange(
            //     product_ids
            // ),
            colors: await ProductRanges.colors(
                product_ids
            ),
            brands: await ProductRanges.brands(
                product_ids
            ),
            sizes: await ProductRanges.sizes(
                product_ids
            ),
            styles: await ProductRanges.styles(
                product_ids
            ),
            conditions: await ProductRanges.conditions(
                product_ids
            ),
        }
    }
}
