import {AppDataSource} from "../../libs/data-source";
import {ERRORS} from "../../libs/utils/errors";
import {EntityManager} from "typeorm";

export async function saveEntityMedia(entity: any, file: any, manager: EntityManager) {

    if (file) {
        entity.picture = `/uploads/${file.filename}`;
        entity = await manager.save(entity);
    } else {
        throw ERRORS.invalidParams('Picture is required')
    }

    return entity;
}
