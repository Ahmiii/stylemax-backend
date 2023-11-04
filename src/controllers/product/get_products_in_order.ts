import {ILike} from "typeorm";
import {standardGetProduct} from "./standard_get_product";

export async function getProductsInOrder(value: {
    page: number,
    limit: number,
    sort: string,
    order: string,
    sort_type: string,
    filter: string,

}, extraWhere = {},my_products?: boolean) {

    const SORT_TYPES = {
        date_asc: {
            sort: 'createdAt',
            order: 'ASC'
        },
        date_desc: {
            sort: 'createdAt',
            order: 'DESC'
        },
        price_asc: {
            sort: 'details',
            order: {
                offered_price: 'ASC'
            }
        },
        price_desc: {
            sort: 'details',
            order: {
                offered_price: 'DESC'
            }
        }
    }
    const {page, limit, filter, sort_type} = value;
    let {sort, order} = value;
    const offset = (page - 1) * limit;

    // @ts-ignore
    if (sort_type !== 'none' && SORT_TYPES[sort_type]) {
        // @ts-ignore
        sort = SORT_TYPES[sort_type].sort;
        // @ts-ignore
        order = SORT_TYPES[sort_type].order;

    }
    let where: any = {}
    if (filter && filter.length > 0) {
        where = [
            {
                label: ILike(`%${filter}%`)
            },
            {
                description: ILike(`%${filter}%`)
            },
            {
                brand: {
                    label: ILike(`%${filter}%`)
                }
            },
            {
                ...extraWhere
            }
        ]

    } else if (extraWhere) {
        where = extraWhere;
    }
    return await standardGetProduct(where, {
        sort, order, offset, limit, page, filter, my_products:!!my_products
    });
}
