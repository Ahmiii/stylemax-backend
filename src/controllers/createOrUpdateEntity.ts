import {EntityManager, EntityTarget} from "typeorm";
import {ERRORS} from "../libs/utils/errors";
import {uploadSinglePicture} from "./libs/uploadSinglePicture";

export async function createOrUpdateEntity({
                                               EntityInterface,
                                               entity_data,
                                               manager,
                                               entity_id,
                                               files
                                           }: {
    EntityInterface: EntityTarget<any>,
    entity_data: any,
    manager: EntityManager,
    entity_id?: number,
    files?: any
}) {
    let entity: any;

    //if id is provided, update category
    if (entity_id) {
        entity = await manager.findOne(EntityInterface, {
            where: {
                id: entity_id
            }
        });
        if (!entity) throw ERRORS.notFound("Category not found");
        Object.assign(entity, entity_data);
        await manager.save(entity);
    } else {
        entity = await manager.save(EntityInterface, entity_data);
    }

    if (files && files.pictures) {
        try {
            entity = await uploadSinglePicture(entity!.id, EntityInterface, files.pictures[0], manager);
        } catch (e) {
            if (!entity_id) {
                throw e;
            }
        }
    }

    return entity;

}
