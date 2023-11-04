import {Router} from "express";
import {AppDataSource} from "./data-source";
import {MediaResource} from "../entity/MediaResource";

export function getUploadRouter() {
    return Router().get('/:key', async (req: any, res: any) => {
        const key = req.params.key;
        let mediaResource = await AppDataSource.manager.findOne(MediaResource, {
            where: {
                key: key
            }
        });
        if (!mediaResource) {
            const default_key = "product_n44qlkdx4gc2h78xv6sv6";
            mediaResource = await AppDataSource.manager.findOne(MediaResource, {
                where: {
                    key: default_key
                }
            });

            if (!mediaResource) {
                //@ts-ignore
                mediaResource = (await AppDataSource.manager.find(MediaResource))[0];
            }

        }
        res.set('Content-Type', 'image/jpeg');
        return res.send(mediaResource!.value);
    });
}
