import {User} from "../entity/User";
import {setToken} from "../libs/utils";
import {Controller} from "./libs/definitions/controller";

import {ERRORS} from "../libs/utils/errors";

export class BuyerController extends Controller {

    async login(req: any, res: any): Promise<unknown> {
        if(req.user){
            const user = await this.dataSource.manager
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
            if(user){
                //@ts-ignore
                user["access_token"] = setToken(user, res);
                return user;
            }
        }
        throw ERRORS.UserNotFound();
    }

    async signup(req: any, res: any): Promise<unknown> {
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
                //@ts-ignore
                user["access_token"] = setToken(user, res);
                return user;
            }
        }
        throw ERRORS.UserNotFound();
    }

    async getBuyerById(req: any, res: any): Promise<unknown> {
        if(!req.params.id) throw ERRORS.invalidParams()
        const buyersRepository = await this.dataSource.getRepository(User);
        const buyer = await buyersRepository.findOne({
            where: {
                id: parseInt(req.params.id)
            },
        });
        return res.send(buyer);
    }

    async getAllBuyers(req: any, res: any): Promise<unknown> {
        const buyersRepository = await this.dataSource.getRepository(User);
        const buyers = await buyersRepository.find({
            relations: ["user"],
            loadEagerRelations: true
        });
        return res.send(buyers);
    }


}
