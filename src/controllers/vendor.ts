import {Request, Response} from "express";

import {Product} from "../entity/Product";
import {Controller} from "./libs/definitions/controller";
import {DataSource} from "typeorm";
import {User} from "../entity/User";
import {ERRORS} from "../libs/utils/errors";
import {generateToken, setToken} from "../libs/utils";
import {AppDataSource} from "../libs/data-source";

export class VendorController extends Controller {

    constructor(dataSource: DataSource = AppDataSource) {
        super(dataSource);
    }

    async login(req: any, res: Response): Promise<unknown> {
        if (req.user) {
            const user =  await this.dataSource.manager
                .findOne<User>(
                    User,
                    {
                        where: {
                            id: req.user.id
                        }
                    }
                )

            if(!user) throw ERRORS.UserNotFound();
            if(!user.isVerified){
                throw new Error('Please verify your email. Check your email for verification link');
            }
            if (user) {
                setToken(user, res);
                return user;
            }
        }

        throw ERRORS.UserNotFound();
    }


}
export async function createVendor( user: User, products: Product[] = [] as Product[]): Promise<User> {
    const id = user.id;
    return await AppDataSource.manager.transaction(async transactionalEntityManager => {
        //if vendor already exists, return the vendor
        let vendor = await transactionalEntityManager.findOne(User, {
                where: {
                    id
                }
            }
        );
        user.role = 'vendor';
        await transactionalEntityManager.save(user);


        return user;
    });
}
