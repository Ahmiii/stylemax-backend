//banner controller: upload, delete, get
import {Controller} from "./libs/definitions/controller";
import {Banner} from "../entity/Banner";
import {ERRORS} from "../libs/utils/errors";
import * as Joi from "joi";
import {handleMultiPartForm} from "../middlewares/handleMultiPartForm";

const multer = require('multer');


export class BannerController extends Controller {

    async upload(req: any, res: any): Promise<unknown> {
        const upload = handleMultiPartForm()


        return new Promise((resolve, reject) => {
            upload(req, res, async (err: any) => {
                if (err) {
                    // console.log(err)
                    return reject(err)
                } else {
                    const url = `/uploads/${req.files['picture'][0].filename}`; // construct URL to uploaded file


                    const schema = Joi.object().keys({
                        label: Joi.string().required(),
                        description: Joi.string().required(),
                    });

                    const {error, value} = schema.validate(req.body);

                    if (error) {
                        return reject(ERRORS.invalidParams(error.details));
                    }

                    const banner = new Banner({
                        picture: url,
                        label: req.body.label,
                        description: req.body.description,
                    });
                    await this.dataSource.manager.save(banner);
                    return resolve(banner)

                }
            });
        })
    }

    async delete(req: any, res: any): Promise<unknown> {
        const banner = await this.dataSource.manager.findOne(Banner, {
            where: {
                id: req.body.id
            }
        });
        if (!banner) throw ERRORS.BannerNotFound();
        await this.dataSource.manager.remove(banner);
        return banner;
    }

    async get(req: any, res: any): Promise<unknown> {
        return await this.dataSource.manager.find(Banner);
    }
}
