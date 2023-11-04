import {Router} from "express";
import {ContactUsController} from "../controllers/contact";


export const contactRouter = Router();
const controller = new ContactUsController()

contactRouter.get("/message", controller.getMessages.bind(controller))
contactRouter.post("/message", controller.createMessage.bind(controller))

