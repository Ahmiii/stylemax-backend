//brand crud operations (create, update, delete for admin)

import {Router} from "express";
import {ROLE, accessControl, requireAuth} from "../middlewares/auth";

const router = Router();
import {BrandController} from "../controllers/brand";
import * as multer from "multer";
import {handleMultiPartForm, saveMediaToDB} from "../middlewares/handleMultiPartForm";

const controller = new BrandController();

router.get("/", controller.getBrands);

router.get("/:id", controller.getBrands);

router.post("/", requireAuth,
  handleMultiPartForm(
      "brand",
      [
          {name: 'label', maxCount: 1},
          {name: 'description', maxCount: 1},
          {name: 'logo', maxCount: 1},
          {name: 'id', maxCount: 1}
      ])
    ,saveMediaToDB("logo", ["logo"])
    ,controller.createBrand);



//add logo to brand
router.post("/:id/logo", accessControl([
    ROLE.ADMIN,
    ROLE.VENDOR
]),
    handleMultiPartForm(
        "brand",
        [
            {name: 'logo', maxCount: 1},
        ]
    ),
    saveMediaToDB("logo", ["logo"])
    ,controller.addLogo);

router.delete("/:id", accessControl([
    ROLE.ADMIN
]), controller.deleteBrand);

export default router;
