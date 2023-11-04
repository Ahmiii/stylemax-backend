import {Controller} from "./libs/definitions/controller";
import {Product} from "../entity/Product";
import {AppDataSource} from "../libs/data-source";
import * as Joi from "joi";
import {ProductDetail} from "../entity/ProductDetail";
import {ERRORS} from "../libs/utils/errors";
import {Brand} from "../entity/Brand";
import {SubCategory} from "../entity/SubCategory";
import {validateProductStatus, PRODUCT_STATUS, isValidProductStatus} from "../entity/libs/PRODUCT_STATUS";
import {PlatformFee} from "../entity/Models";
interface ShippingResult {
    shippingFee: number;
    earnings: number;
    platformProfit: number;
}

export function calculateEarnings(params: {
    offeredPrice: number;
    shippingOption: string;
    platformConfig: {
        min_val: number;
        fixed_amount: number;
        percentage: number;
    };
}): ShippingResult {
    const commissionPercentage: number = params.platformConfig.percentage / 100;
    let sellingFee: number = commissionPercentage * params.offeredPrice;
    if(params.offeredPrice < params.platformConfig.min_val){
        sellingFee = params.platformConfig.fixed_amount;
    }
    let shippingFee: number = 20; // Standard shipping fee
    let earnings: number;

    if (params.shippingOption === "stdrd_free") {
        earnings = params.offeredPrice - sellingFee - shippingFee;
    } else if (params.shippingOption === "stdrd_no_discount") {
        earnings = params.offeredPrice - sellingFee - shippingFee;
    } else if (params.shippingOption === "stdrd_25_discount") {
        shippingFee = 0.25 * shippingFee;
        earnings = params.offeredPrice - sellingFee - shippingFee;
    } else if (params.shippingOption === "stdrd_50_discount") {
         shippingFee = 0.5 * shippingFee;
        earnings = params.offeredPrice - sellingFee - shippingFee;
    } else if (params.shippingOption === "self_delivery") {
        earnings = params.offeredPrice - sellingFee;
    } else {
        // Invalid shipping option
        throw new Error("Invalid shipping option");
    }




    return {
        shippingFee,
        earnings,
        platformProfit: sellingFee
    };
}


/**
 * Get methods defined in ProductGet controller at ./product/product_get.ts
 */
export class ProductController extends Controller {


    private helper = {
        validateProductDetailProps: function (value: any) {
            const schema = Joi
                .object()
                .keys({
                    price: Joi.number().required(),
                    offeredPrice: Joi.number().required(),
                    currency: Joi.string().required(),

                    brand: Joi.string().required(),
                    condition: Joi.string().required(),
                    style: Joi.string().required(),

                    material: Joi.string().required(),
                    quantity_type: Joi.string().optional()
                })
                .unknown(true)
                .required()
            const result = schema
                .validate(value);
            if (result.error) {
                throw result.error;
            }
        },
        validateProductProps: function (req: any) {

            const schema = Joi
                .object()
                .keys({
                    label: Joi.string().required(),
                    description: Joi.string().required(),
                    // pictures: Joi.array().required(),
                    stock: Joi.number().required(),
                    tags: Joi.string().required(),
                    sub_category: Joi.string().required(),
                    brand: Joi.string().required(),
                    colours: Joi.string().required(),
                    sizes: Joi.string().required(),
                    delivery_type: Joi.string().default("stdrd_no_discount"),
                    status: Joi.string().default("draft")
                })
                .unknown(true)
                .required()
            const result = schema
                .validate(req.body);
            if (result.error) {
                throw result.error;
            }
            if (!req.files['pictures']) {
                throw ERRORS.invalidParams([{
                    message: `Your input: pictures -> ${req.files['pictures']} |`
                }, {
                    message: "Please make sure you have a 'pictures' key in your request form data. AND make sure that image files exists on your system."
                }])
            }

            return result;
        }
    }

    async updateProduct(req: any, res: any): Promise<unknown> {

        let product = await vendorOwnsProduct(req.user.id, req.params.id);
        const update: any = {};

        if (req.files && req.files['pictures']) {
            update["pictures"] = req.files['pictures'].map((file: any) => {
                return `/uploads/${file.filename}`
            });
        }

        if (req.body.label) {
            update["label"] = req.body.label;
        }

        if (req.body.description) {
            update["description"] = req.body.description;
        }

        if (req.body.stock) {
            update["stock"] = req.body.stock;
        }

        if (req.body.category) {
            update["sub_category"] = await AppDataSource.manager.findOne(SubCategory, {
                where: {
                    id: req.body.sub_category
                }
            })
        }

        try {
            await AppDataSource.manager.update(Product, {
                id: req.params.id
            }, update);
            //@ts-ignore
            product = {
                ...product,
                //@ts-ignore
                label: update.label || product.label,
                //@ts-ignore
                description: update.description || product.description,
                //@ts-ignore
                stock: update.stock || product.stock,
                //@ts-ignore
                pictures: update.pictures || product.pictures
            }
        } catch (e) {
            throw e;
        }

        return product;
    }

    async createProduct(req: any, res: any): Promise<unknown> {
        const result = this.helper.validateProductProps(req);
        this.helper.validateProductDetailProps(req.body);

        const tags = JSON.parse(req.body.tags)


        const {label, description, stock, delivery_type} = result.value;
        let brand:Brand|undefined;
        // get pictures from request.files
        const pictures = req.files['pictures'].map((file: any) => {
            return `/uploads/${file.filename}`
        });

        let brandData = JSON.parse(req.body.brand)
        if(brandData.newBrand){
            brand = new Brand({
                label: brandData.newBrand,
                description:""
            })
        }else {
            let brand_id = brandData.id;
            //@ts-ignore
            brand = await AppDataSource.manager.findOne(Brand, {
                where: {
                    id: brand_id
                }
            })
        }


        if (!brand) {
            throw new Error("brand not found")
        }

        let product = new Product({
            label,
            description,
            stock,
            tags,
            pictures,
            brand: brand ?? undefined,
            vendor: req.user.id,
            delivery_type,
            product_status: validateProductStatus(req.body.product_status)
        });

        await this.dataSource.manager.transaction(async (transactionalEntityManager) => {
          try{
              await transactionalEntityManager.save(brand);
              const cats = req.body.sub_category;

              const subCat = await transactionalEntityManager.findOne(SubCategory, {
                  where: {
                      id: cats
                  },
                  relations: ["colours", "sizes"]
              })

              if (!subCat) {
                  throw new Error("sub category not found")
              }

              product.sub_category = subCat;

              if (!(req.body.colours || req.body.sizes)) {
                  throw new Error("colours and sizes must be sent.")
              }
              const colours = JSON.parse(req.body.colours);
              const sizes = JSON.parse(req.body.sizes);

              //verify if structure of colours and sizes is correct [{id:1},{id:2}]
              if (!Array.isArray(colours) || !Array.isArray(sizes)) {
                  throw new Error("colours and sizes must be an array")
              }

              colours.forEach((colour: any) => {
                  if (!colour.id) {
                      throw new Error("colour id not found. Must send array of {id: some_id}")
                  }
              })

              sizes.forEach((size: any) => {
                  if (!size.id) {
                      throw new Error("size id not found. Must send array of {id: some_id}")
                  }
              })

              //check if colours and sizes exist in sub category
              const subCatColours = subCat.colours.map((colour: any) => colour.id);
              const subCatSizes = subCat.sizes.map((size: any) => size.id);


              colours.forEach((colour: any) => {
                  if (!subCatColours.includes(parseInt(colour.id))) {
                      throw new Error("colour not found in sub category")
                  }
              })

              sizes.forEach((size: any) => {
                  if (!subCatSizes.includes(parseInt(size.id))) {
                      throw new Error("size not found in sub category")
                  }
              })

              // we have colour ids and size ids
              // we need to get the colour and size objects
              // and add them to the product

              // @ts-ignore
              product.colours = colours.map((colour: any) => {
                  return {
                      id: colour.id
                  }
              })

              // @ts-ignore
              product.sizes = sizes.map((size: any) => {
                  return {
                      id: size.id
                  }
              })

              product = await transactionalEntityManager.save(product);


              await this.createProductDetails({
                  value: req.body,
                  productId: product.id,
                  transactionalEntityManager
              })
              //@ts-ignore
              product = await transactionalEntityManager.findOne(Product, {
                      where: {
                          id: product.id
                      },
                      relations: ["details", "sub_category", "brand"]
                  }
              )
          }catch (e) {
              throw e;
          }
        })


        return product;
    }


//     -------------------------------------------------------------PRIVATE MEMBERS

    async addProductDetails(req: any, res: any): Promise<unknown> {

        await vendorOwnsProduct(req.user.id, req.params.id);

        return await this.createProductDetails({
            value: req.body,
            productId: req.params.id
        });
    }


    async updateStatus(req: any, res: any): Promise<unknown> {

        if (!req.body.product_id) {
            throw new Error("product id not sent")
        }
        if (!req.body.product_status) {
            throw new Error("product_status not sent")
        }
        if (!isValidProductStatus(req.body.product_status)) {
            throw new Error("invalid product_status")
        }
        await vendorOwnsProduct(req.user.id, req.body.product_id);
        const product = await AppDataSource.manager.findOne(Product, {
            where: {
                id: req.body.product_id
            }
        });

        if (!product) {
            throw new Error("Product not found");
        }

        product.product_status = req.body.product_status;
        return await AppDataSource.manager.save(product);

    }

    private async createProductDetails({
                                           value,
                                           productId,
                                           transactionalEntityManager = undefined
                                       }: {
        value: any,
        productId: any,
        transactionalEntityManager?: any
    }) {
        this.helper.validateProductDetailProps(value);
        const {
            price,
            offeredPrice,
            currency,
            style,
            condition,
            material,
            quantity_type = "single"
        } = value;

        if (!transactionalEntityManager) {
            transactionalEntityManager = this.dataSource.manager;
        }
        const product = await transactionalEntityManager.findOne(Product, {
            where: {
                id: productId
            }
        });
        if (!product) {
            throw new Error("Product not found");
        }

        const platformConfig = await transactionalEntityManager.findOne(PlatformFee, {
            where: {

            }
        })

        const {earnings, platformProfit, shippingFee} = calculateEarnings({
            offeredPrice,
            shippingOption: product.delivery_type,
            platformConfig
        })

        const productDetail = new ProductDetail({
            price,
            product,
            condition,
            style,
            earnings,
            material,
            offered_price: offeredPrice,
            currency,
            shipping_fee: shippingFee,
            platform_fee: platformProfit,
            quantity_type
        });


        await transactionalEntityManager.save(productDetail);

        return productDetail;
    }
}


export async function vendorOwnsProduct (vendorId: any, productId: any): Promise<Product> {

    const product = await AppDataSource.manager.findOne(Product, {
        where: {
            id: productId,
            vendor: {
                id: vendorId
            }
        },
        relations: ["vendor", "sub_category"]
    })

    if (!product) {
        throw  ERRORS.invalidParams("Product does not exist OR you do not own this product");
    }
    //@ts-ignore
    return {...product};
}
