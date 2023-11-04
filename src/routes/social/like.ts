//like router

import {Router} from "express";

import {LikeController} from "../../controllers/social/like";

import {requireAuth} from "../../middlewares/auth";


const router = Router();

const likeController = new LikeController();

router.post('/', requireAuth, likeController.like);

router.delete('/', requireAuth, likeController.unlike);

router.get('/:product_id',  likeController.getLikes);
router.get('/', requireAuth, likeController.getUserLikes);



export default router;
