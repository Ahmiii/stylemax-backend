
import {AppDataSource, db_entities} from "./libs/data-source"
import buyer from "./routes/buyer";
import user from "./routes/user";
import vendor from "./routes/vendor";
import product from "./routes/product"; 
import admin from "./routes/admin";
import {bannerRouter} from "./routes/banner";
import brand from "./routes/brand";
import {categoryRouter, subCategoryRouter} from "./routes/category";
import {start_server} from "./libs/start_server";
import {contactRouter} from "./routes/contact";
import verify from "./routes/verify";
import {commentRouter, favoriteRouter, shareRouter} from "./routes/social";
import * as dotenv from 'dotenv'
dotenv.config();


AppDataSource.initialize().then(async () => {

    start_server(
        {
            host: "localhost" as any,
            port: parseInt("3003" as any),
            routers: [
                {'buyer': buyer},
                {'vendor': vendor},
                {'user': user},
                {'product': product},
                {'admin': admin},
                {'banner': bannerRouter},
                {'category': categoryRouter},
                {'subcategory': subCategoryRouter},
                {'brand': brand},
                {'contact-us': contactRouter},
                {'verify': verify},
                {'cart': require('./routes/cart').default},
                {'order': require('./routes/order').default},
                {'like': require('./routes/social/like').default},
                {'comment': commentRouter},
                {'favorite': favoriteRouter},
                {'share': shareRouter},
                
            ],
            db_entities
        }
    )
    ;

}).catch(error => console.log(error))
