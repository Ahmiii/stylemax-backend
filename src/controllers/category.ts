//category controller

import {Controller} from "./libs/definitions/controller";
import {Category} from "../entity/Category";
import {ERRORS} from "../libs/utils/errors";
import * as Joi from "joi";
import {SubCategory} from "../entity/SubCategory";

import {uploadSinglePicture} from "./libs/uploadSinglePicture";
import {createOrUpdateEntity} from "./createOrUpdateEntity";

export class CategoryController extends Controller {

    async getCategories(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            const id = req.params.id;
            try {
                if (id) {
                    const category = await this.dataSource.manager.findOne(Category, {
                        where: {
                            id: id
                        },
                        relations: ['subCategories', "subCategories.parent_subcategory", "subCategories.colours", "subCategories.sizes"]
                    });

                    if (!category) throw ERRORS.notFound("Category not found")
                    return resolve(category);
                }
                const categories = await this.dataSource.manager.find(Category, {

                    relations: ['subCategories', "subCategories.parent_subcategory", "subCategories.colours", "subCategories.sizes"]
                });
                return resolve(categories);
            } catch (e) {
                return reject(e);
            }
        })
    }

    //get category by id
    async getCategoryById(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const category = await this.dataSource.manager.findOne(Category, {
                    where: {
                        id: req.params.id
                    },
                    relations: ['subCategories', "subCategories.parent_subcategory", "subCategories.colours", "subCategories.sizes"]
                });
                return resolve(category);
            } catch (e) {
                return reject(e);
            }
        })
    }

    //get all subcategories of a category
    async getSubCategories(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const subCategories = await this.dataSource.manager.find(SubCategory, {
                    where: {
                        category: {
                            id: req.params.id
                        }
                    },
                    relations: ['parent', "colours", "sizes", "category"]
                });
                return resolve(subCategories);
            } catch (e) {
                return reject(e);
            }
        })
    }

    async createCategory(req: any, res: any): Promise<unknown> {
        const schema = Joi.object().keys({
            label: Joi.string().required(),
            description: Joi.string().required(),
            subCategories: Joi.array().items(Joi.object().keys({
                label: Joi.string().required(),
                description: Joi.string().required(),
            }).required()).optional(),
            id: Joi.number().optional()
        });

        const {error, value} = schema.validate(req.body);

        if (error) {
            throw (ERRORS.invalidParams(error.details));
        }

        const category_data: any = {
            label: value.label,
            description: value.description,
        }

        if (value.subCategories) {
            category_data['subCategories'] = value.subCategories;
        }

        return new Promise(async (resolve, reject) => {
            try {
                await this.dataSource.transaction(async manager => {
                    const category = await createOrUpdateEntity({
                        EntityInterface: Category,
                        entity_data: category_data,
                        manager,
                        entity_id: value.id,
                        files: req.files
                    });
                    return resolve(category);
                })
            } catch (e) {
                return reject(e);
            }
        })
    }


    async deleteCategory(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                const category = await this.dataSource.manager.findOne(Category, {
                    where: {
                        id: req.params.id
                    }
                });

                if (!category) throw ERRORS.notFound("Category not found")


                await this.dataSource.manager.delete(Category, {
                    id: req.params.id
                });
                return resolve(category);
            } catch (e) {
                return reject(e);
            }
        })
    }

    async addPicture(req: any, res: any): Promise<unknown> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!req.params.category) {
                    return reject(ERRORS.invalidParams("category id is required"));
                }

                const result = await uploadSinglePicture(req.params.category, Category, req.files.pictures[0])
                return resolve(result);
            } catch (e: any) {
                return reject(e);
            }
        })
    }


}
