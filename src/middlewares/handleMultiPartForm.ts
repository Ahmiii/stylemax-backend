import * as multer from "multer";
//store buffer in MediaResource table
import {MediaResource} from "../entity/MediaResource";
import {Request} from "express";
import {AppDataSource} from "../libs/data-source";
import * as crypto from "crypto";

export function handleMultiPartForm(
    prefix: string = 'banner',
    fields: { name: string, maxCount: number }[] = [
        {name: 'picture', maxCount: 1},
        {name: 'label', maxCount: 1},
        {name: 'description', maxCount: 1}]
) {
    return multer({
        storage: multer.memoryStorage()
    }).fields(fields);
}

export function saveMediaToDB(prefix:string="image", upload_keys:string[] = ["picture", "pictures"]) {
    return async (req:any, res:any, next:any) =>{
        const files = req.files;
        const stored_keys:any = []
        if(!files) {
            return next(

            )
        }

        function unique_key() {
            return crypto.randomBytes(10).toString('hex');
        }
        //@ts-ignore
        const keys = Object.keys(files).filter(key => upload_keys.includes(key));
        // randomize keys
        const promises = keys.map(key => {

            files[key].forEach((file:any) => {
                const name = prefix + "-" + unique_key() + "." + file.originalname.split('.').pop()
                const mediaResource = new MediaResource({
                    key: name,
                    value: file.buffer
                });
                stored_keys.push(mediaResource.key);
                return mediaResource.save();
            })
        });
        await Promise.all(promises);
        // modify req.body to include the ids of the media resources
        req.files.pictures = stored_keys.map((key:any) => {
            return {
                filename: key
            }
        });

        next();
    }
}


//current usage
//have to pass both as middleware
//router.post(route_name, handleMultiPartForm("product", [
//             {name: 'picture', maxCount: 6},
//             {name: 'label', maxCount: 1},
//             {name: 'description', maxCount: 1},
//             {name: 'stock', maxCount: 1}
//             ]),
//     saveMediaToDB("product"), controller_method)
export function handleMultiPartFormAndSaveToDB(
    prefix: string = "picture",
    uploadKeys: string[] = ["picture"],
    fields: { name: string; maxCount: number }[] = [
        { name: "picture", maxCount: 1 },
        { name: "label", maxCount: 1 },
        { name: "description", maxCount: 1 },
    ]
) {
    const upload = multer({
        storage: multer.memoryStorage(),
    }).fields(fields);

    return async (req: any, res: any, next: any) => {
        upload(req, res, async (err: any) => {
            if (err) {
                console.log("ERROR..................... ", err);
                return next(err);
            }

            const files = req.files;
            const storedKeys: string[] = [];

            if (!files) {
                return next();
            }

            function uniqueKey() {
                return crypto.randomBytes(10).toString("hex");
            }

            const keys = Object.keys(files).filter((key) => uploadKeys.includes(key));
            console.log("HEHEHEH ", keys);
            const promises = keys.map((key) => {
                files[key].forEach((file: any) => {
                    const name = prefix + "-" + uniqueKey() + "." + file.originalname.split(".").pop();
                    const mediaResource = new MediaResource({
                        key: name,
                        value: file.buffer,
                    });
                    storedKeys.push(mediaResource.key);
                    return mediaResource.save();
                });
            });

            await Promise.all(promises);

            req.files.picture = storedKeys.map((key: any) => {
                return {
                    filename: key,
                };
            });

            next();
        });
    };
}
