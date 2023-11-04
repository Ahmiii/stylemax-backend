import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "../entity/User"
// import {Vendor} from "../entity/Vendor";
import {ProductDetail} from "../entity/ProductDetail";
import {NewOrder, Product} from "../entity/Product";
// import {Buyer} from "../entity/Buyer";
import {Favorite} from "../entity/Favorite";
import {CartItem} from "../entity/CartItem";
import {Cart} from "../entity/Cart";
import {Comment} from "../entity/Comment";
import {Coupon} from "../entity/Coupon";
import {Banner} from "../entity/Banner";
import {Category} from "../entity/Category";
import {Brand} from "../entity/Brand";
import {MediaResource} from "../entity/MediaResource";
import {SubCategory} from "../entity/SubCategory";
import {ContactUs} from "../entity/ContactUs";
import {Verification} from "../entity/Verification";
import {Like} from "../entity/Like";
import {ProductColour} from "../entity/ProductColour";
import {ProductSize} from "../entity/ProductSize";
import {ShippingAddress} from "../entity/ShippingAddress";
import {MediaGroup, Paragraph, PlatformFee, PromoCode, PromoCodeUsage} from "../entity/Models";
import {SystemConfig} from "../entity/Config";

export const db_entities = [
    User,
    // Vendor,
    ProductDetail,
    Product,
    // Buyer,
    Favorite,
    Comment,
    Cart,
    CartItem,
    // Order,
    // OrderItem,
    Coupon,
    Banner,
    Brand,
    Category,
    MediaResource,
    SubCategory,
    ContactUs,
    Verification,
    Like,
    ProductColour,
    ProductSize,
    ShippingAddress,
    MediaGroup,
    Paragraph,
    PromoCode,
    PromoCodeUsage,
    PlatformFee,
    NewOrder,
    SystemConfig
]
//todo: move variables to .env file
export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres" || "postgres",
    password: "dexter123",
    database: "mytest2",
    synchronize: true,

    logging: false,
    entities: [...db_entities],

    migrations: [],
    subscribers: []
})
