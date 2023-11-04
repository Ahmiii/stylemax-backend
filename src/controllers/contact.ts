//contact us controller


import {Controller} from "./libs/definitions/controller";
import * as Joi from "joi";
import {ContactUs} from "../entity/ContactUs";

export  class ContactUsController extends Controller {
    async getMessages(req: any, res: any): Promise<unknown> {
        return await this.dataSource.manager.find(ContactUs)
    }

    async createMessage(req: any, res: any): Promise<unknown> {
        const schema = Joi.object().keys({
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone: Joi.string().required(),
            message: Joi.string().required()
        })

        const {error, value} = schema.validate(req.body)
        if (error) {
            throw error
        }

        const contactUs = new ContactUs(value)
        return await this.dataSource.manager.save(contactUs)

    }
}
