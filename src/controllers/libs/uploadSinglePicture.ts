//create a generic function to handle upload of single picture for any entity
import {EntityManager, EntityTarget} from "typeorm";
import {ERRORS} from "../../libs/utils/errors";
import {AppDataSource} from "../../libs/data-source";

import {saveEntityMedia} from "./saveEntityMedia";

export async function uploadSinglePicture(
    entity_id: string | number,
    entity_type: EntityTarget<{
    picture: string;
    id: string
}>, file: any, transaction_manager?: EntityManager):Promise<any> {
    return new Promise(async (resolve, reject) => {
        const manager = transaction_manager || AppDataSource.manager;
        try {
            if (!entity_id) return reject(ERRORS.invalidParams('Entity id is required'));

            let entity = await manager.findOne(entity_type, {
                where: {
                    id: entity_id as any
                }
            })

            if (!entity) return reject(ERRORS.notFound('Entity'));

            entity = await saveEntityMedia(entity, file, manager);
            return resolve(entity);
        } catch (e) {
            return reject(e);
        }
    })

}
