import {Controller} from "../libs/definitions/controller";
import {ProductRanges} from "./productRanges";
import {ILike, In, Raw} from "typeorm";
import {getProductsInOrder} from "./get_products_in_order";
import {validateQueryOrderingParams} from "./validate_query_ordering_params";
import {Product} from "../../entity/Product";

function fuzziFy(str: string):string[]{
    let temp = [];
    temp.push(str.charAt(0).toUpperCase() + str.slice(1)); //capitalise first letter
    temp.push(str.toUpperCase()); //capitalise all letters
    temp.push(str.toLowerCase()); //lowercase all letters
    temp.push(str.charAt(0).toLowerCase() + str.slice(1)); //lowercase first letter
    return temp;
}

function fuzziFyStrings(style: any[]) {
    let temp = style.slice(); // create a copy of the array
    const originalStyleLength = style.length;
    //also, add multiple capitalised versions of each style in temp
    for (let i = 0; i < originalStyleLength; i++) {
        const temp2 = fuzziFy(style[i]);
        temp = temp.concat(temp2);
    }
    return temp;
}

export class ProductSearch extends Controller {

    async search(req: any, res: any) {
        let skip = true;
        const query = req.body;
        const {
            brand, tags,
            colour, size, price, style,
            condition,
            sub_category_id,
            product_status,
            my_products,
            category_id
        } = query;
        const searchQuery: any = {
            details: {},
            colours: {},
            sizes: {}
        };


        // if (filter) {
        //     searchQuery['label'] = filter;
        // }

        if(product_status){
            searchQuery['product_status'] = product_status;
        }

        if(my_products){
            if(!req.user){
                throw new Error("You must be logged in to view your products");
            }
            searchQuery['vendor'] = {
                id: req.user.id
            }

        }


        if (brand) {
            skip = false;
            //check if either brand is an int or an array of ints
            //otherwise, throw an error "You are probably trying to find brands by LABEL, not ID. Please send {brand: ID} or {brand: [ID1, ID2]}."
            if(isNaN(brand)){
                if(brand.forEach){
                    brand.forEach((brandId: any) => {
                        if(isNaN(brandId)){
                            throw new Error("You are probably trying to find brands by LABEL, not ID. Please send {brand: ID} or {brand: [ID1, ID2]}.");
                        }
                    })
                }else {
                    skip = true;
                }


            }

            if(!skip){
                if (Array.isArray(brand)) {
                    searchQuery['brand'] = {
                        id: In(brand)
                    }
                }else {
                    searchQuery['brand'] = brand;
                }
            }

        }
        if (tags) {
            if (Array.isArray(tags)) {
                searchQuery['tags'] = In(tags);
            }
        }
        if (colour) {
            if (Array.isArray(colour)) {
                searchQuery['colours'].label = In(fuzziFyStrings(colour));
            } else {
                searchQuery.colours.label = In(fuzziFy(colour));
            }

        }
        if (size) {
            if (Array.isArray(size)) {
                searchQuery.sizes.label = In(fuzziFyStrings(size));
            } else {
                searchQuery.sizes.label = In(fuzziFy(size));
            }

        }
        if (price) {
            let temp = {
                min: -1,
                max: 999999999
            };
            let tempSet = false;

            if (price.min > 0) {
                tempSet = true;
                temp.min = price.min;
            }
            if (price.max) {
                tempSet = true;
                temp.max = price.max;
            }

            if (tempSet) {
                console.log("SEARCHING BY PRICE RANGE");
                // searchQuery['details']['offered_price'] = price;
                //     typeorm raw query to handle price range
                searchQuery['details']['offered_price'] = Raw(alias => `${alias} BETWEEN ${price.min ?? 0} AND ${price.max ?? 999999999}`);
            } else {
                searchQuery['details']['offered_price'] = price;
            }


        }
        if (style) {

            if (Array.isArray(style)) {
                searchQuery['details']['style'] = In(fuzziFyStrings(style));
            } else {
                searchQuery['details']['style'] = In(fuzziFy(style));
            }

        }
        if (condition) {
            if (Array.isArray(condition)) {
                searchQuery['details']['condition'] = In(fuzziFyStrings(condition));
            } else {
                searchQuery['details']['condition'] = In(fuzziFy(condition));
            }
        }

        if (sub_category_id) {
            if (Array.isArray(sub_category_id)) {
                searchQuery['sub_category'] = {
                    id: In(sub_category_id)
                }
            } else {

                searchQuery['sub_category'] = {
                    id: sub_category_id
                }
            }
        }

        if(category_id){
            if(! searchQuery['sub_category']){
                searchQuery['sub_category'] = {};
            }
            if(Array.isArray(category_id)){


                searchQuery['sub_category'].category =
                    {
                        id: In(category_id)
                    }
            }else {
                searchQuery['sub_category'].category =
                    {
                        id: category_id
                    }

            }
        }

        //if any field in searchQuery is null, short circuit
        for (let key in searchQuery) {
            if (searchQuery.hasOwnProperty(key)) {
                if (searchQuery[key] === null) {
                    return {
                        products: [],
                        ranges: ProductRanges.getAll([])
                    }
                }
            }
        }


        const value = validateQueryOrderingParams(req.body);


        return await getProductsInOrder(value, searchQuery, my_products);

    }

}
