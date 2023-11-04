import * as request from "supertest";
import {NewOrder, Product} from "../../src/entity/Product";
import {Cart} from "../../src/entity/Cart";
import {SubCategory} from "../../src/entity/SubCategory";

const baseUrl = `http://127.0.0.1:3000/`;
let accessToken = '';

let product: Product;
let cart: Cart;
describe('Todos endpoint', () => {

    //user/login
    it('should return a 200 product_status code', async () => {
        let response = await request(baseUrl)
            .post('user/login')
            .send({
                email: "ab@mail.com",
                password: "123456",
            })
            .set('Accept', 'application/json');


        accessToken = response.body.access_token;

        response = await request(baseUrl)

            .post('admin/login')
            .send({

            })
            .set('Accept', 'application/json')
            .set('Cookie', [`access_token=${accessToken}`]);
        accessToken = response.body.access_token;


        expect(response.statusCode).toBe(200);
    })

    //create promocode
    //   code: Joi.string().optional(),
    //             discount: Joi.number().required(),
    //             expiry_date: Joi.date().required(),
    //             is_active: Joi.boolean().optional().default(true),
    //             count: Joi.number().optional()

    it('create promocode', async () => {
        const response = await request(baseUrl)
            .post('admin/promo')
            .set('Cookie', [`access_token=${accessToken}`])
            .send({
                discount: 10,
                expiry_date: "2021-09-09"
            })
            .set('Accept', 'application/json');

        expect(response.statusCode).toBe(200);
    })
    //login buyer by sending empty body to /buyer/login with access token

    // let subCategory2:SubCategory;
    //
    // //create sub category and create sub category with parent_subcategory = previous sub category
    // it('create category/sub/sub2', async () => {
    //
    //
    //     const response2 = await request(baseUrl)
    //         .post('subcategory')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({
    //             label: "sub2",
    //             description: "desc",
    //             parent_subcategory: {
    //                 id: 1
    //             }
    //         })
    //         .set('Accept', 'application/json');
    //
    //      subCategory2 = response2.body;
    //
    //     expect(response2.statusCode).toBe(200);
    //
    // })

    let colour = {
        id: 6
    };
    let size = {
        id: 6
    }

    //create brand/colour/size
//     it('create brand/colour/size', async () => {
//
//
// //
// //post sub_category sizes and colours
// //         subCategoryRouter.post("/:sub_category/colours", accessControl([
// //             ROLE.ADMIN
// //         ]), subcontroller.createColour);
// //
// //         subCategoryRouter.post("/:sub_category/sizes", accessControl([
// //             ROLE.ADMIN
// //         ]), subcontroller.createSize);
//
//         const response2 = await request(baseUrl)
//     .post(`subcategory/17/colours`)
//     .set('Cookie', [`access_token=${accessToken}`])
//     .send({
//         colours: [
//             {
//                 label: "colour1",
//                 value: "red"
//             }
//             ]
//     })
//     .set('Accept', 'application/json');
//
//         colour = response2.body;
//         console.log(colour)
//
//         const response3 = await request(baseUrl)
//     .post(`subcategory/17/sizes`)
//     .set('Cookie', [`access_token=${accessToken}`])
//     .send({
//         sizes: [
//             {
//                 label: "size1",
//                 value: "S"
//             }
//         ]
//     })
//     .set('Accept', 'application/json');
//
//         size = response3.body;
//         expect(response2.statusCode).toBe(200);
//     })

    // create product
    it('create  product', async () => {

        console.log(accessToken)


        //@ts-ignore
        colour = [{
            id: 6,
        }]
        //@ts-ignore
        size = [{
            id: 6,
        }]
        function randomeString(length: number) {
            let result = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() *
                    charactersLength));
            }
            return result;
        }
        const response = await request(baseUrl)
            .post('product')
            .set('Cookie', [`access_token=${accessToken}`])
            .set('Content-Type', 'multipart/form-data')
            .field('name', 'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN'+randomeString(5))
            .field('description', 'test')
            .field('sub_category', JSON.stringify(17))
            .field('brand', JSON.stringify({id: 2}))
            .field('quantity_type', 'single')
            .field('price', 100)
            .field('offeredPrice', 90)
            .field('currency', 'USD')
            .field('sizes', JSON.stringify(size))
            .field('condition', 'New')
            .field('style', 'Casual')
            .field('colours', JSON.stringify(colour))
            .field('material', 'Cotton')
            .field('label', 'test')
            .field('stock', 3)
            .field('tags', JSON.stringify(['tag1', 'tag2']))

            .attach('pictures', 'C:/Users/ahmad/Desktop/aa.webp')
            .expect(200);

        product = response.body;

            console.log("....................................................................................")
            console.log("....................................................................................")
            console.log("....................................................................................")
            console.log("....................................................................................")
            console.log(response.body)

            console.log("....................................................................................")
            console.log("....................................................................................")
            console.log("....................................................................................")
            console.log("....................................................................................")
            console.log("....................................................................................")
            console.log("....................................................................................")
            console.log("....................................................................................")
            console.log("....................................................................................")
        expect(response.statusCode).toBe(200);
    })
//
//     it('login buyer', async () => {
//         const response = await request(baseUrl)
//             .post('buyer/login')
//             .set('Cookie', [`access_token=${accessToken}`])
//             .set('Accept', 'application/json');
//
//         accessToken = response.body.access_token;
//         expect(response.statusCode).toBe(200);
//     })


    test('Login another user', async ()=> {
        const response = await request(baseUrl)
            .post('user/login')
            .send({
                email: "ab3@mail.com",
                password: "123456",
            })
            .set('Accept', 'application/json');

        accessToken = response.body.access_token;
        expect(response.statusCode).toBe(200);
    })


    // //add product to cart
    // test('add product to cart', async () => {
    //
    //     const response = await request(baseUrl)
    //         .post('cart/product')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({
    //             product_id: product.id,
    //             quantity: 1
    //         })
    //         .expect(200);
    //
    //
    //     cart = response.body;
    //     expect(response.statusCode).toBe(200);
    // })

    let productBeforeOrder:Product|null = null;
    let cartBeforeOrder:Cart|null = null;

    it('get product before order', async () => {
        const response = await request(baseUrl)
            .get(`product/${product.id}`)
            .set('Cookie', [`access_token=${accessToken}`])
            .set('Accept', 'application/json');

        productBeforeOrder = response.body;
        expect(response.statusCode).toBe(200);
    })

    it('get cart before order', async () => {
        const response = await request(baseUrl)
            .get(`cart`)
            .set('Cookie', [`access_token=${accessToken}`])
            .set('Accept', 'application/json');

        cartBeforeOrder = response.body;
        expect(response.statusCode).toBe(200);
    });

    let order:NewOrder|null = null;
    //create order
    test('create order', async () => {
        const response = await request(baseUrl)
            .post('order')
            .set('Cookie', [`access_token=${accessToken}`])
            .send({
              product_id: product.id,
                quantity: 2,
                promo_code: '10s3h4ftmtsnm0jt8trxh'
            })
            .expect(200);

        order = response.body;
        expect(response.statusCode).toBe(200);
    });


    // // /:id/item to remove product from cart
    // test('clear cart', async () => {
    //     const response = await request(baseUrl)
    //         .delete(`cart/${cart.id}/item`)
    //         .send(
    //             {
    //                 product_id: product.id
    //             }
    //         )
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .expect(200);
    //
    //     expect(response.statusCode).toBe(200);
    // })
// /:id/clear to clear cart
    // test('clear cart', async () => {
    //     const response = await request(baseUrl)
    //         .delete(`cart/${cart.id}`)
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .expect(200);
    //
    //     expect(response.statusCode).toBe(200);
    // })

    // order/ POST
    // test('order', async () => {
    //     const response = await request(baseUrl)
    //         .post('order')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({
    //             cart_id: cart.id,
    //             address_id: 1,
    //             payment_method: 'COD'
    //         })
    //         .expect(200);
    //
    //     expect(response.statusCode).toBe(200);
    // })

    // like product
    // test('like product', async () => {
    //     const response = await request(baseUrl)
    //         .post('like')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({
    //             product_id: product.id
    //         })
    //         .expect(200);
    //
    //     expect(response.statusCode).toBe(200);
    // })

    // unlike product
    // test('unlike product', async () => {
    //     const response = await request(baseUrl)
    //         .delete('like')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({
    //             product_id: product.id
    //         })
    //         .expect(200);
    //
    //     expect(response.statusCode).toBe(200);
    // })

    // /:id GET
    // test('get product LIKES by id', async () => {
    //     const response = await request(baseUrl)
    //         .get(`like/${product.id}`)
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .expect(200);
    //
    //     console.log(response.body)
    //     expect(response.statusCode).toBe(200);
    // })

    // ------------- routes in social/index.ts -------------

    // //add comment to product
    // test('comment', async () => {
    //     const response = await request(baseUrl)
    //         .post('comment')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({
    //             product_id: product.id,
    //             comment: 'test comment'
    //         })
    //         .expect(200);
    //
    //     expect(response.statusCode).toBe(200);
    // })
    //

    //signin vendor
    // test('signin vendor', async () => {
    //     const response = await request(baseUrl)
    //         .post('buyer/login')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({})
    //         .expect(200);
    //
    //     accessToken = response.body.access_token;
    //     expect(response.statusCode).toBe(200);
    // })


    // //add product to favorites
    // test('favorite', async () => {
    //     const response = await request(baseUrl)
    //         .post('favorite')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({
    //             product_id: 30
    //         })
    //         .expect(200);
    //
    //     expect(response.statusCode).toBe(200);
    // })
    //
    // //share product
    // test('share', async () => {
    //     const response = await request(baseUrl)
    //         .post('share')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({
    //             product_id: product.id
    //         })
    //         .expect(200);
    //
    //     expect(response.statusCode).toBe(200);
    // })

    //login admin
    // test('login admin', async () => {
    //     const response = await request(baseUrl)
    //         .post('admin/login')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({})
    //         .expect(200);
    //
    //     accessToken = response.body.access_token;
    //     expect(response.statusCode).toBe(200);
    // })

    //post /category/subcategory_id/colours
    // test('add colour to subcategory', async () => {
    //     const response = await request(baseUrl)
    //         .post('subcategory/2/colours')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({
    //             colours: [{
    //                 label: 'test colour',
    //                 value: 'ORANGU'
    //             }, {
    //                 label: 'Purple',
    //                 value: 'PURPLE'
    //             }]
    //         })
    //         .expect(200);
    //
    //     expect(response.statusCode).toBe(200);
    // })

    //post /category/subcategory_id/sizes
    // test('add size to subcategory', async () => {
    //     const response = await request(baseUrl)
    //         .post('subcategory/2/sizes')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({
    //             sizes: [{
    //                 label: 'test size',
    //                 value: 'ORANGU'
    //             }, {
    //                 label: 'Purple',
    //                 value: 'PURPLE'
    //             }]
    //         })
    //         .expect(200);
    //
    //     expect(response.statusCode).toBe(200);
    // })


    //bulk create category -> subcategories -> colours, sizes

    const standardizer = (colour:{label:string, value:string}) => {
        //swap label and value
        const {label, value} = colour;
        colour.label = value;
        colour.value = label;
        return colour;
    }


    const data = [
        {
            label: 'test category',
            subcategories: [
                {
                    label: 'test subcategory',
                    colours: [
                        {
                            label: 'orange',
                            value: 'Orange',
                        },
                        {
                            label: 'purple',
                            value: 'Purple',
                        }],
                    sizes: [
                        {
                            label: 'small',
                            value: 'Small',
                        },
                        {
                            label: 'medium',
                            value: 'Medium',
                        },
                    ]

                }
            ]
        }]

    const sizes = [
        {
            label: 'sm',
            value: 'Small',
        },
        {
            label: 'md',
            value: 'Medium',
        },
        {
            label: 'lg',
            value: 'Large',
        },
        {
            label: 'xl',
            value: 'Extra Large',
        },
        {
            label: 'xxl',
            value: 'Extra Extra Large',
        }
    ]
        .map(standardizer)
    const colours = [
        {
            label: 'red',
            value: 'Red',
        },
        {
            label: 'orange',
            value: 'Orange',
        },
        {
            label: 'yellow',
            value: 'Yellow',
        },
        {
            label: 'green',
            value: 'Green',
        },
        {
            label: 'blue',
            value: 'Blue',
        },
        {
            label: 'purple',
            value: 'Purple',
        }
        ]
        .map(standardizer)
    const subCategories:SubCategory[] = [];


    //login admin
    // test('login admin', async () => {
    //     const response = await request(baseUrl)
    //         .post('admin/login')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({})
    //         .expect(200);
    //
    //     accessToken = response.body.access_token;
    //     expect(response.statusCode).toBe(200);
    // })
    //
    // console.log(colours, sizes);

    //fetch /category to get all categories with subcategories,
    //then add colours and sizes to each subcategory
    // test('fetch categories', (done) => {
    //     request(baseUrl)
    //         .get('category')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({})
    //         .expect(200)
    //         .then(async (response) => {
    //             console.log(response.body)
    //             const categories:Category[] = response.body;
    //             for (let i = 0; i < categories.length; i++) {
    //                 const category = categories[i];
    //                 for (let j = 0; j < category.subCategories.length; j++) {
    //                     const subcategory = category.subCategories[j];
    //                     subCategories.push(subcategory);
    //                 }
    //             }
    //             for (let i = 0; i < subCategories.length; i++) {
    //                 const subcategory = subCategories[i];
    //                 await request(baseUrl)
    //                     .post(`subcategory/${subcategory.id}/colours`)
    //                     .set('Cookie', [`access_token=${accessToken}`])
    //                     .send({
    //                         colours: colours
    //                     })
    //                     .expect(200);
    //                 await request(baseUrl)
    //                     .post(`subcategory/${subcategory.id}/sizes`)
    //                     .set('Cookie', [`access_token=${accessToken}`])
    //                     .send({
    //                         sizes: sizes
    //                     })
    //                     .expect(200);
    //
    //             }
    //         })
    //         .then(() => done())
    // })

    //delete all sizes in sizes array at /subcategory/sizes
    // test('delete all sizes', (done) => {
    //     request(baseUrl)
    //         .delete('subcategory/sizes')
    //         .set('Cookie', [`access_token=${accessToken}`])
    //         .send({
    //             sizes: sizes
    //         })
    //         .expect(200)
    //         .then(() => done())
    // })
})





// return {
//   label: 'test subcategory',
//   colours: [
//     {
//       label: 'orange',
//       value: 'Orange',
//     },
//     {
//       label: 'purple',
//       value: 'Purple',
//     }],
//   sizes: [
//     {
//       label: 'small',
//       value: 'Small',
//     },
//     {
//       label: 'medium',
//       value: 'Medium',
//     },
//   ]
// }
//use a library to generate random data




