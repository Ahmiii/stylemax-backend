//handle static content crud using media group and paragraph/media resources

// Path: src\controllers\static_content.ts

import {Controller} from "./libs/definitions/controller";
import {MediaGroup, Paragraph} from "../entity/Models";

export class StaticContentController extends Controller {

    async createStaticContent(req: any, res: any): Promise<any> {
        try {

            //the important thing is paragraph and media resource, if neither is provided, return error
            if (!req.body.paragraphs && (!req.files || req.files['pictures'].length === 0)) {
                throw new Error('either paragraph or picture is required. Neither is provided')
            }


            if (req.body.paragraphs) {
                try {
                    req.body.paragraphs = JSON.parse(req.body.paragraphs)

                } catch (e) {
                    throw new Error('paragraphs must be a valid json array')
                }
            }


            //create media group if media group id is not provided
            const mediaGroupId = req.body.id
            let mediaGroup: MediaGroup | null = null;

            if (!mediaGroupId) {
                if(!req.body.label){
                    throw new Error('label is required for new static content. It will help you remember what the content is about.')
                }
                mediaGroup = new MediaGroup({
                    label: req.body.label,
                    //@ts-ignore
                    paragraphs: [],
                    mediaResources: []
                })
            } else {
                mediaGroup = await this.dataSource.manager.findOne(MediaGroup, {
                    where: {
                        id: mediaGroupId
                    },
                    relations: ['paragraphs']
                })

                if (!mediaGroup) {
                    throw new Error('media group not found')
                }
            }

            console.log(mediaGroup)
            //transaction
            return await this.dataSource.transaction(async transactionalEntityManager => {

                //create paragraph
                const paragraphs: Paragraph[] = []
                if (req.body.paragraphs) {
                    for (const paragraph of req.body.paragraphs) {
                        console.log(paragraph)
                        let newParagraph = new Paragraph({
                            text: paragraph as string,

                        });
                        newParagraph = await transactionalEntityManager.save(newParagraph)
                        paragraphs.push(newParagraph)
                    }
                }
                if(paragraphs && paragraphs.length > 0){
                    mediaGroup!.paragraphs = paragraphs;
                }

                if(req.files && req.files['pictures'].length > 0){
                    mediaGroup!.mediaResources = [...(
                        req.files['pictures'].map((file: any) => {
                            return '/uploads/'+file.filename
                        }
                    ))]
                }


                mediaGroup = await transactionalEntityManager.save(mediaGroup, {reload: true})


                return mediaGroup
            })

        } catch (e) {
            console.log(e)
            if (e instanceof Error) {

               if(e.message.includes('duplicate key value violates unique constraint')){
                   return res.status(400).send({message: 'label already exists'})
               }
                return res.status(400).send({message: e.message})
            }
            return res.status(500).send({message: 'internal server error'})
        }
    }

    async getStaticContent(req: any, res: any): Promise<any> {
        //get by id or label
        try {
            const id = req.query.id
            const label = req.query.label
            let mediaGroup: MediaGroup | null = null;
            if (id) {
                mediaGroup = await this.dataSource.manager.findOne(MediaGroup, {
                    where: {
                        id: id
                    },
                    relations: ['paragraphs']
                })
            } else if (label) {
                mediaGroup = await this.dataSource.manager.findOne(MediaGroup, {
                    where: {
                        label: label
                    },
                    relations: ['paragraphs']
                })
            } else {
                throw new Error('either id or label is required')
            }

            if (!mediaGroup) {
                throw new Error('media group not found')
            }

            return mediaGroup
        }
        catch (e) {
            if (e instanceof Error) {
                return res.status(400).send({message: e.message})
            }
            return res.status(500).send({message: 'internal server error'})
        }
    }

    //get all static content /with pagination
    async getAllStaticContent(req: any, res: any): Promise<any> {
        try {
            return await this.dataSource.manager.find(MediaGroup, {
                relations: ['paragraphs']
            })
        } catch (e) {
            if (e instanceof Error) {
                return res.status(400).send({message: e.message})
            }
            return res.status(500).send({message: 'internal server error'})
        }
    }
}
