import {Controller} from "./libs/definitions/controller";
import {Brand} from "../entity/Brand";
import * as Joi from "joi";
import {ERRORS} from "../libs/utils/errors";

function singlePictureExists(req: any) {
return req.files && req.files['pictures'] && req.files['pictures'][0]
}

export class BrandController extends Controller {

    getBrands(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const query: any = {}
                if (req.params.label) {
                    query['label'] = req.params.label
                }
                if (req.params.description) {
                    query['description'] = req.params.description
                }
                if (req.params.id) {
                    query['id'] = req.params.id
                }
                const brands = await this.dataSource.manager.find(Brand, {
                    where: query
                });
                return resolve(brands);
            } catch (e) {
                return reject(e);
            }
        })
    }

    //     router.post("/", accessControl([
    //     ROLE.ADMIN
    // ]), controller.createBrand);
    //
    // router.put("/:id", accessControl([
    //     ROLE.ADMIN
    // ]), controller.updateBrand);
    //
    // router.delete("/:id", accessControl([
    //     ROLE.ADMIN
    // ]), controller.deleteBrand);

    async createBrand(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {

            try {
                const schema = Joi.object().keys({
                    label: Joi.string().optional(),

                    description: Joi.string().optional(),
                    logo: Joi.any().optional(),
                    id: Joi.number().optional()
                });






                const {error, value} = schema.validate(req.body);

                if (error) {
                    return reject(ERRORS.invalidParams(error.details));
                }

                // // accept {id, at least one of the following: label, description, logo} OR {label, description, logo}
                //validate value
                if (value.id) {
                    if (!value.label && !value.description && !singlePictureExists(req)) {
                        return reject(ERRORS
                            .invalidParams("At least one of the following fields must be present: label, description, logo. Make sure that you are sending logo as multipart formdata!"));
                    }
                } else {
                    if (!value.label || !value.description) {
                        return reject(ERRORS
                            .invalidParams("All of the following fields must be present: label, description, logo. Make sure that you are sending logo as multipart formdata!"));
                    }
                }
                let url = null;
                const brandData: any = {
                    label: req.body.label,
                    description: req.body.description,
                }

                if (singlePictureExists(req)) {
                    url = `/uploads/${req.files['pictures'][0].filename}`; // construct URL to uploaded file
                    brandData['logo'] = url;
                }

                let brand: Brand | null;
                if (req.body.id) {
                    brand = await this.dataSource.manager.findOne(Brand, {
                        where: {
                            id: req.body.id
                        }
                    });
                    if (!brand) return reject(ERRORS.notFound('Brand'));
                    Object.assign(brand, brandData);
                    await this.dataSource.manager.save(brand);
                } else {
                    brand = new Brand(brandData);
                    await this.dataSource.manager.save(brand);

                }

                return resolve(brand);
            } catch (e) {
                return reject(e);
            }
        })
    }


    //add/overwrite logo for brand
    async addLogo(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                // console.log("IN ROUTE");
                const schema = Joi.object().keys({
                    id: Joi.number().required(),
                });

                const {error, value} = schema.validate(req.params);

                if (error) {
                    return reject(ERRORS.invalidParams(error.details));
                }

                let url = null;

                console.log(req.files);
                if (req.files && req.files['pictures'] && req.files['pictures'][0]) {
                    console.log("IN IF");
                    url = `/uploads/${req.files['pictures'][0].filename}`; // construct URL to uploaded file
                    console.log(url)

                }
                if (!url) return reject(ERRORS.invalidParams('logo'));

                const brand = await this.dataSource.manager.findOne(Brand, {
                    where: {
                        id: req.params.id
                    }
                });
                if (!brand) return reject(ERRORS.notFound('Brand'));
                brand.logo = url!;
                await this.dataSource.manager.save(brand);
                return resolve(brand);
            } catch (e) {
                console.log("HEHEHEHE");
                return reject(e);
            }
        })
    }

    async deleteBrand(req: any, res: any): Promise<unknown> {
        const schema = Joi.object().keys({
            id: Joi.number().required(),
        });

        const {error, value} = schema.validate(req.params);

        if (error) {
            throw (ERRORS.invalidParams(error.details));
        }

        return new Promise(async (resolve, reject) => {
            try {
                console.log("IN ROUTE");
                console.log(req.params.id)
                let brand = await this.dataSource.manager.findOne(Brand, {
                    where: {
                        id: req.params.id
                    },


                })
                if (!brand) return reject(ERRORS.notFound('Brand'));
                await this.dataSource.manager.delete(Brand, brand);
                return resolve(req.params);
            } catch (e:any) {
                //if contains 'violates foreign key constraint'
                if (e?.message?.includes('violates foreign key constraint')) {
                    return reject(ERRORS.invalidParams('Brand is in use by other entities.'));
                }
                return reject(e);
            }
        })

    }
}

