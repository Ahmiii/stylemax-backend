//banner router: upload, delete, get
import {Router} from "express";
import {BannerController} from "../controllers/banner";
import {accessControl, ROLE} from "../middlewares/auth";


export const bannerRouter = Router();

const bannerController = new BannerController();

bannerRouter.post("/",
    accessControl([ROLE.ADMIN]),
    bannerController.upload);

bannerRouter.delete("/",
    accessControl([ROLE.ADMIN]),
    bannerController.delete);

bannerRouter.get("/",
    bannerController.get);
