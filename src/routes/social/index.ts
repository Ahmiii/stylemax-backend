//routers for comment, favorite, share_count

import {Router} from "express";
import {requireAuth} from "../../middlewares/auth";
import {SocialsController} from "../../controllers/social";




const commentRouter = Router()
const favoriteRouter = Router()
const shareRouter = Router()

const socialsController = new SocialsController()


//-----------------comment-----------------
commentRouter.post('/', requireAuth, socialsController.comment)

commentRouter.get('/',  socialsController.getComments)

commentRouter.delete('/', requireAuth, socialsController.deleteComment)

//-----------------favorite-----------------
favoriteRouter.post('/', requireAuth, socialsController.favorite)

favoriteRouter.get('/', socialsController.getFavorites)

favoriteRouter.delete('/', requireAuth, socialsController.unfavorite)

//-----------------share_count-----------------
shareRouter.post('/', requireAuth, socialsController.share)


export {commentRouter, favoriteRouter, shareRouter}
