//product router
import {Router} from "express";
import {ProductController} from "../controllers/product";
import {ROLE, accessControl, requireAuth} from "../middlewares/auth";
import {handleMultiPartForm, saveMediaToDB} from "../middlewares/handleMultiPartForm";
import {ProductSearch} from "../controllers/product/product_search";
import {ProductGet} from "../controllers/product/product_get";

const router = Router();
const controller = new ProductController();
const getController = new ProductGet();
const search_controller = new ProductSearch();

//best sellers
router.get("/bestsellers", getController.bestSelling);

//get vendor's products
router.get("/vendor", getController.vendor);

//by discount
router.get("/discount", getController.discount);

//category by average discount
router.get("/subcategory/discount", getController.subCategoryByDiscount);

//products sorted by discount in subcategory

router.post("/search", search_controller.search);
// router.get("/search", search_controller.searchProducts);
router.get("/", getController.id);

router.get("/:id", getController.id);

router.post("/", accessControl([
    ROLE.VENDOR
]),
    handleMultiPartForm(
        "product",
        [
            {name: 'label', maxCount: 1},
            {name: 'description', maxCount: 1},
            {name: 'stock', maxCount: 1},
            {name: 'pictures', maxCount: 6},
            {
                name: 'category',
                maxCount: 1,
            },
            {
                name: 'tags',
                maxCount: 20,
            }
        ]
    ),
    saveMediaToDB("product")
    ,controller.createProduct);

router.put("/:id", accessControl([
    ROLE.VENDOR
]),
   handleMultiPartForm("product", [
            {name: 'picture', maxCount: 6},
            {name: 'label', maxCount: 1},
            {name: 'description', maxCount: 1},
            {name: 'stock', maxCount: 1}
            ]),
    saveMediaToDB("product"),
    controller.updateProduct);


router.post("/:id/details", accessControl([
    ROLE.VENDOR
]), controller.addProductDetails);


//get product/category/:category_id
router.get("/category/:category_id", getController.category);

router.get('/sub_category/:sub_category_id', getController.subCategory);

//get product/brand/:brand_id
router.get("/brand/:brand_id", getController.brand);

router.post("/status", requireAuth, accessControl([
    ROLE.VENDOR
]), controller.updateStatus);



export default router;
