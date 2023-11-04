import {Controller} from "./libs/definitions/controller";
import {SubCategory} from "../entity/SubCategory";
import {ERRORS} from "../libs/utils/errors";
import * as Joi from "joi";
import {ProductColour} from "../entity/ProductColour";
import {ProductSize} from "../entity/ProductSize";
import {Category} from "../entity/Category";
import {In, Not} from "typeorm";
import {uploadSinglePicture} from "./libs/uploadSinglePicture";
import {Product} from "../entity/Product";

export class SubCategoryController extends Controller {

    //get sub_category colours
    async getColours(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const subCategory = await this.dataSource.manager.findOne(SubCategory, {
                    where: {
                        id: req.params.sub_category
                    },
                    relations: ['colours']
                });
                if (!subCategory) return reject(ERRORS.notFound('SubCategory'));

                return resolve(subCategory.colours);
            } catch (e) {
                return reject(e);
            }
        })
    }

    //get sub_category sizes
    async getSizes(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const subCategory = await this.dataSource.manager.findOne(SubCategory, {
                    where: {
                        id: req.params.sub_category
                    },
                    relations: ['sizes']
                });
                if (!subCategory) return reject(ERRORS.notFound('SubCategory'));

                return resolve(subCategory.sizes);
            } catch (e) {
                return reject(e);
            }
        })
    }

    //post sub_category sizes and colours
    async createColour(req: any, res: any): Promise<unknown> {
        const schema = Joi.object().keys({
            //     {label, value, hex}[]
            colours: Joi.array().items(Joi.object().keys({
                label: Joi.string().required(),
                value: Joi.string().required()
            }).required()).required()

        });

        const {error, value} = schema.validate(req.body);

        if (error) {
            throw (ERRORS.invalidParams(error.details));
        }

        return new Promise(async (resolve, reject) => {
            try {
                const colour_vals = req.body.colours;
                const subCategory = await this.dataSource.manager.findOne(SubCategory, {
                    where: {
                        id: req.params.sub_category
                    },
                    relations: ['colours']
                });
                if (!subCategory) return reject(ERRORS.notFound('SubCategory'));

                const colours = subCategory.colours;
                let new_colours = colour_vals.filter((colour: {
                    label: string;
                    value: string;
                }) => {
                    const colour_exists = colours.find((c) => c.label === colour.label);
                    if (!colour_exists) {
                        return colour;
                    }
                })

                new_colours = new_colours.map((colour: {
                    label: string;
                    value: string;
                }) => {
                    return new ProductColour({
                        label: colour.label,
                        value: colour.value,
                        subCategory: subCategory
                    })
                })
                await this.dataSource.manager.save(new_colours);
                return resolve(new_colours);
            } catch (e) {
                return reject(e);
            }
        })
    }

    //post sub_category sizes
    async createSize(req: any, res: any): Promise<unknown> {
        const schema = Joi.object().keys({
            //     {label, value, hex}[]
            sizes: Joi.array().items(Joi.object().keys({
                label: Joi.string().required(),
                value: Joi.string().required()
            }).required()).required()

        });

        const {error, value} = schema.validate(req.body);

        if (error) {
            throw (ERRORS.invalidParams(error.details));
        }

        return new Promise(async (resolve, reject) => {
            try {
                const size_vals = req.body.sizes;
                const subCategory = await this.dataSource.manager.findOne(SubCategory, {
                    where: {
                        id: req.params.sub_category
                    },
                    relations: ['sizes']
                });
                if (!subCategory) return reject(ERRORS.notFound('SubCategory'));

                const sizes = subCategory.sizes;
                let new_sizes = size_vals.filter((size: {
                    label: string;
                    value: string;
                }) => {
                    const size_exists = sizes.find((s) => s.label === size.label);
                    if (!size_exists) {
                        return size;
                    }
                })

                new_sizes = new_sizes.map((size: {
                    label: string;
                    value: string;
                }) => {
                    return new ProductSize({
                        label: size.label,
                        value: size.value,
                        subCategory: subCategory
                    })
                })
                await this.dataSource.manager.save(new_sizes);
                return resolve(new_sizes);
            } catch (e) {
                return reject(e);
            }
        })
    }

    //add sub_category to category
    async addSubCategory(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const schema = Joi.object().keys({
                    label: Joi.string().required(),
                    description: Joi.string().required(),
                    parent_subcategory_id: Joi.number().optional(),
                    category_id: Joi.number()
                });

                const {error, value} = schema.validate(req.body);
                if (error) {
                    throw (ERRORS.invalidParams(error.details));
                }

                const {parent_subcategory_id, label, description, category_id} = value;

                if (parent_subcategory_id) {
                    let res = await this.addChildSubCategory(
                        {
                            parent_subcategory_id,
                            label,
                            description,
                            category_id,
                            pictures: req.files.pictures
                        }
                    );
                    return resolve(res);
                }
                const cat_id = req.body.category_id;

                if (!cat_id) return reject(ERRORS.invalidParams('Category id is required'));


                const category = await this.dataSource.manager.findOne(Category, {
                    where: {
                        id: cat_id
                    },
                    relations: ['subCategories']
                });
                if (!category) return reject(ERRORS.notFound('Category'));

                if (category.subCategories.length > 0) {
                    const alreadyExists = category.subCategories.find((subCategory) => subCategory.label === label);
                    if (alreadyExists) return reject(ERRORS.invalidParams('SubCategory already exists'));
                }

                let subCategory = new SubCategory({
                    label,
                    description
                })


                subCategory.category = category;
                await this.dataSource.transaction(async manager => {
                    await manager.save(subCategory);
                    if (req.files && req.files.pictures) {
                        subCategory = await uploadSinglePicture(subCategory.id, SubCategory, req.files.pictures[0], manager);
                    }
                })

                subCategory.category = category;
                return resolve(subCategory);
            } catch (e: any) {
                //typeorm error
                //unique constraint

                if (e.code === '23505') {
                    return reject(ERRORS.invalidParams('SubCategory already exists'));
                }

                return reject(e
                );
            }
        })
    }


    //update subcategory
    async updateSubCategory(req: any, res: any): Promise<unknown> {
        //only update label and description
        return new Promise(async (resolve, reject) => {
            try {
                const schema = Joi.object().keys({
                    label: Joi.string().optional(),
                    description: Joi.string().optional(),

                });

                const {error, value} = schema.validate(req.body);

                if (error) {
                    throw (ERRORS.invalidParams(error.details));
                }

                const subCategory = await this.dataSource.manager.findOne(SubCategory, {
                    where: {
                        id: req.params.sub_category
                    }
                });

                if (!subCategory) return reject(ERRORS.notFound('No Valid SubCategory found'));

                if (req.body.label) subCategory.label = req.body.label;
                if (req.body.description) subCategory.description = req.body.description;

                await this.dataSource.manager.save(subCategory);

                return resolve(subCategory);
            } catch (e) {
                return reject(e);
            }
        })
    }

    ////delete sub_category colour by id
    // subCategoryRouter.delete("/:sub_category/colours/:colour", accessControl([
    //     ROLE.ADMIN
    // ]), subcontroller.deleteColour);
    //
    async deleteColour(req: any, res: any): Promise<unknown> {
        //find colour, check for associations if none delete
        return new Promise(async (resolve, reject) => {
            try {
                const colour = await this.dataSource.manager.findOne(ProductColour, {
                    where: {
                        id: req.params.colour
                    },
                    loadRelationIds: true
                });

                if (!colour) return reject(ERRORS.notFound('Colour'));

                if (colour.products.length > 0) return reject(ERRORS.invalidParams('Product listings exist for this colour. Delete them first.'));


                await this.dataSource.manager.remove(colour);

                return resolve(colour);
            } catch (e) {
                return reject(e);
            }
        })
    }

    // //delete sub_category size by id
    // subCategoryRouter.delete("/:sub_category/sizes/:size", accessControl([
    //     ROLE.ADMIN
    // ]), subcontroller.deleteSize);
    //
    async deleteSize(req: any, res: any): Promise<unknown> {
        //find size, check for associations if none delete
        return new Promise(async (resolve, reject) => {
            try {
                const size = await this.dataSource.manager.findOne(ProductSize, {
                    where: {
                        id: req.params.size
                    },
                    loadRelationIds: true
                });

                if (!size) return reject(ERRORS.notFound('Size'));

                if (size.products.length > 0) return reject(ERRORS.invalidParams('Product listings exist for this size. Delete them first.'));

                await this.dataSource.manager.remove(size);

                return resolve(size);
            } catch (e) {
                return reject(e);
            }
        })
    }

    //addPicture
    async addPicture(req: any, res: any): Promise<unknown> {
        //handle req.files.picture
        return new Promise(async (resolve, reject) => {
            try {

                if (!req.params.sub_category) return reject(ERRORS.invalidParams('SubCategory id is required'));

                const result = await uploadSinglePicture(req.params.sub_category, SubCategory, req.files.pictures[0]);

                return resolve(result);
            } catch (e) {
                return reject(e);
            }
        })
    }

    //cascade delete subcategory
    async deleteSubCategory(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const subCategory = await this.dataSource.manager.findOne(SubCategory, {
                    where: {
                        id: req.params.sub_category
                    }
                })

                if (!subCategory) return reject(ERRORS.notFound('SubCategory'));

                const childSubCategories = await this.dataSource.manager.find(SubCategory, {
                    where: {
                        parent_subcategory: {
                            id: req.params.sub_category
                        }
                    },
                    relations: ['colours', 'sizes']
                })

                if (childSubCategories.length > 0) return reject(ERRORS.invalidParams('SubCategory has children. Delete them first'));

                //check if subcategory has products
                const products = await this.dataSource.manager.find(Product, {
                    where: {
                        sub_category: {
                            id: req.params.sub_category
                        }
                    }
                })

                if (products.length > 0) return reject(ERRORS.invalidParams('SubCategory has products. Delete them first'));


                await this.dataSource.manager.remove(subCategory);

                return resolve({message: 'SubCategory deleted successfully'});
            } catch (e) {

                return reject(e);
            }
        })

    }

    //get children subcategories
    async getChildSubCategories(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!req.params.sub_category) return reject(ERRORS.invalidParams('SubCategory id is required'));

                const subCategories = await this.dataSource.manager.find(SubCategory, {
                    where: {
                        parent_subcategory: {
                            id: req.params.sub_category
                        }
                    },
                    relations: ['children']
                })

                if (!subCategories) return reject(ERRORS.notFound('SubCategory'));

                return resolve(subCategories);
            } catch (e) {
                return reject(e);
            }
        })

    }

    //get subcategory
    async getSubCategory(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!req.params.sub_category) return reject(ERRORS.invalidParams('SubCategory id is required'));

                const subCategory = await this.dataSource.manager.findOne(SubCategory, {
                    where: {
                        id: req.params.sub_category
                    },
                    relations: ['parent_subcategory', 'colours', 'sizes', 'children']
                })

                if (!subCategory) return reject(ERRORS.notFound('SubCategory'));

                return resolve(subCategory);
            } catch (e) {
                return reject(e);
            }
        })

    }

    //get subcategories (all) - with pagination
    async getSubCategories(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            //pagination
            try {
                const {page, limit} = req.query;
                const subCategories = await this.dataSource.manager.find(SubCategory, {
                    relations: ['parent_subcategory', 'colours', 'sizes', 'children'],
                    skip: page ? page : 0,
                    take: limit ? limit : 20
                })

                if (!subCategories) return reject(ERRORS.notFound('No SubCategories found'));

                return resolve(subCategories);
            } catch (e) {
                return reject(e);
            }
        })

    }

    private addChildSubCategory(param: {
        parent_subcategory_id: any;
        description: any;
        label: any,
        category_id: number,
        pictures?: any
    }) {
        //parent_subcategory is {id: string} object
        //parent_subcategory refers to the parent_subcategory sub_category
        return new Promise(async (resolve, reject) => {
            try {
                const {parent_subcategory_id, label, description} = param;
                console.log(param);
                const parent_sub_category = await this.dataSource.manager.findOne(SubCategory, {
                    where: {
                        id: parent_subcategory_id,
                        category: {
                            id: param.category_id
                        }
                    },
                    relations: ['parent_subcategory', 'category', 'children']
                });

                if (!parent_sub_category) return reject(ERRORS.notFound('No Valid Parent SubCategory found. Possible issues: 1. Either, no such subcategory exists. 2. There is a child of the parent subcategory with the same label as the new subcategory'));

                if (parent_sub_category.parent_subcategory) return reject(ERRORS.invalidParams('Two levels of subcategories are not allowed! Category  -> subcategory1 -> subcategory2'));


                let subCategory = new SubCategory({
                    label: label,
                    description: description,
                    category: parent_sub_category.category
                })

                subCategory.parent_subcategory = parent_sub_category;

                await this.dataSource.transaction(async manager => {
                    await manager.save(subCategory);
                    if (param.pictures && param.pictures.length > 0) {
                        subCategory = await uploadSinglePicture(subCategory.id, SubCategory, param.pictures[0], manager);
                    }
                })
                subCategory.category = parent_sub_category.category
                return resolve(subCategory);
            } catch (e) {
                return reject(e);
            }
        })
    }

}


