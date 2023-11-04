//get, post, put, delete category routes

import {Router} from "express";
import {ROLE, accessControl} from "../middlewares/auth";

const router = Router();
import {CategoryController} from "../controllers/category";
import {SubCategoryController} from "../controllers/subcategory";
import {handleMultiPartForm, saveMediaToDB} from "../middlewares/handleMultiPartForm";

const controller = new CategoryController();
const subcontroller = new SubCategoryController()

router.get("/:id", controller.getCategories);

router.get("/", controller.getCategories);

router.post("/", accessControl([
        ROLE.ADMIN
    ]), handleMultiPartForm(),
    saveMediaToDB(), controller.createCategory);



router.delete("/:id", accessControl([
    ROLE.ADMIN
]), controller.deleteCategory);



const subCategoryRouter = Router();


//get sub_category by id
subCategoryRouter.get("/:sub_category", subcontroller.getSubCategory);

//get all sub_categories
subCategoryRouter.get("/", subcontroller.getSubCategories);

//get child sub_categories
subCategoryRouter.get("/:sub_category/children", subcontroller.getChildSubCategories);

//get sub_category colours
subCategoryRouter.get("/:sub_category/colours", subcontroller.getColours);

//get sub_category sizes
subCategoryRouter.get("/:sub_category/sizes", subcontroller.getSizes);

//post sub_category sizes and colours
subCategoryRouter.post("/:sub_category/colours", accessControl([
    ROLE.ADMIN
]), subcontroller.createColour);

subCategoryRouter.post("/:sub_category/sizes", accessControl([
    ROLE.ADMIN
]), subcontroller.createSize);

//post sub_category
subCategoryRouter.post("/", accessControl([
    ROLE.ADMIN
]), handleMultiPartForm(),
    saveMediaToDB(), subcontroller.addSubCategory);

subCategoryRouter.put("/:sub_category", accessControl([
    ROLE.ADMIN
]), subcontroller.updateSubCategory);

//delete sub_category colour by id
subCategoryRouter.delete("/colours/:colour", accessControl([
    ROLE.ADMIN
]), subcontroller.deleteColour);

//delete sub_category size by id
subCategoryRouter.delete("/sizes/:size", accessControl([
    ROLE.ADMIN
]), subcontroller.deleteSize);


//delete colours
// subCategoryRouter.delete("/colours", accessControl([
//     ROLE.ADMIN
// ]), subcontroller.deleteColours);

//delete sizes
// subCategoryRouter.delete("/sizes", accessControl([
//     ROLE.ADMIN
//     ]), subcontroller.deleteSizes);

router.post("/:category/picture", accessControl([
        ROLE.ADMIN
    ]),
    handleMultiPartForm(),
    saveMediaToDB(),
    controller.addPicture);

subCategoryRouter.post("/:sub_category/picture", accessControl([
        ROLE.ADMIN
    ]),
    handleMultiPartForm(),
    saveMediaToDB(),
    subcontroller.addPicture);

// sub_category
subCategoryRouter.delete("/:sub_category", accessControl([
    ROLE.ADMIN
]), subcontroller.deleteSubCategory);


export {router as categoryRouter, subCategoryRouter};
