import {AppDataSource} from "../../libs/data-source";
import {User} from "../../entity/User";

export async function checkBuyer(id: number) {
    if(!id) {
        throw {
            message: "Please Login as Buyer to perform this action. You are not authorized to favorite this product",
            status: 400
        }
    }
    let buyerExists = await AppDataSource.manager.findOne(User, {
        where: {
            id
        }
    })

    if (!buyerExists) {
        throw {
            message: "Please Login as Buyer to perform this action. You are not authorized to favorite this product",
            status: 400
        }
    }
}
