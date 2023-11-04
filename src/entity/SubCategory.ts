//@ts-nocheck
//category entity typeorm/postgres
// Path: src\entity\Category.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    JoinColumn,
    ManyToMany,
    JoinTable,
    ManyToOne,
    BaseEntity
} from "typeorm";
import {Product} from "./Product";
import {Category} from "./Category";
import {ProductColour} from "./ProductColour";
import {ProductSize} from "./ProductSize";


@Entity()
export class SubCategory extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    label: string

    @Column()
    description: string



    @OneToMany(type => Product, product => product.sub_category, {
        cascade: true
    })
    @JoinTable()
    products: Product[]

    @ManyToOne(type => Category, category => category.subCategories)
    category: Category

    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    createdAt: Date

    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    updatedAt: Date

    // child subcategories
    @OneToMany(type => SubCategory, subCategory => subCategory.parent_subcategory, {
        onDelete: "CASCADE",
        nullable: true
    })
    children: SubCategory[];

    //relate to product colour and size subcategory.colours and subcategory.sizes
    @OneToMany(type => ProductColour, productColour => productColour.subCategory)
    colours: ProductColour[]

    @OneToMany(type => ProductSize, productSize => productSize.subCategory)
    sizes: ProductSize[]


    // parent_subcategory subcategory
    @ManyToOne(type => SubCategory, subCategory => subCategory.children, {
        onDelete: "CASCADE",
        nullable: true
    })
    parent_subcategory: SubCategory;

    @Column(
        {
            //random image url
            default: "https://picsum.photos/200/300"
        }
    )
    picture: string

    constructor(data: Partial<SubCategory>) {
        Object.assign(this, data)
    }
}
