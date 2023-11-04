//admin routes

import {Router} from "express";
import {AdminController} from "../controllers/admin";
import {accessControl, ROLE} from "../middlewares/auth";
import {UserController} from "../controllers/user";
import {StaticContentController} from "../controllers/static_content";
import {handleMultiPartForm, saveMediaToDB} from "../middlewares/handleMultiPartForm";

const router = Router();
const controller = new AdminController();
const userController = new UserController();

router.get("/users", accessControl([
    ROLE.ADMIN
]), userController.getUsers);

//create user
router.post("/users", accessControl([
    ROLE.ADMIN
]), userController.createUser);

//block user
router.post("/users/:id/block", accessControl([
    ROLE.ADMIN
]), controller.blockUser);


 //login --
router.post('/login', controller.login);

//signup --
router.post('/signup', controller.signup);

//set/update admin signup code
router.post('/signup-code', accessControl([
    ROLE.ADMIN
]), controller.setSignupCode);

const staticContentController = new StaticContentController();
//static content
router.post('/static', accessControl([
    ROLE.ADMIN
]),
    handleMultiPartForm(
        "picture",
        [
            {
                name: "picture",
                maxCount: 10
            },
            {
                name: "paragraphs",
                maxCount: 10
            },
            {
                name:"id",
                maxCount: 1
            },
            {
                name: "label",
                maxCount: 1
            }
        ]
    ),
    saveMediaToDB("picture", ["picture"])
    ,staticContentController.createStaticContent);

//get all orders
router.get('/orders', accessControl([
    ROLE.ADMIN
]), controller.getOrders);


router.get('/static',
    staticContentController.getStaticContent);

router.get('/static/all',
    staticContentController.getAllStaticContent);

// admin/promo POST/GET
router.post('/promo', accessControl([
    ROLE.ADMIN
]), controller.createPromoCode);

router.get('/promo', accessControl([
    ROLE.ADMIN
]), controller.getPromoCodes);

//get platform-fee-config
router.get('/platform-fee-config', accessControl([
    ROLE.ADMIN
]), controller.getPlatformFeeConfig);

//post platform-fee-config
router.post('/platform-fee-config', accessControl([
    ROLE.ADMIN
]), controller.createPlatformFeeConfig);

//---------------------------------------------dashboard
//get dashboard data
router.get('/dashboard', accessControl([
    ROLE.ADMIN
]), controller.getDashboardData);


export default router;
