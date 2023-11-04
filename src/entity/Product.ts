//@ts-nocheck
import {BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm"
import {ProductDetail} from "./ProductDetail";
import {Favorite} from "./Favorite";
import {Comment} from "./Comment";
import {Brand} from "./Brand";
import {SubCategory} from "./SubCategory";

import {Like} from "./Like";
import {ProductSize} from "./ProductSize";
import {ProductColour} from "./ProductColour";
import {PRODUCT_STATUS} from "./libs/PRODUCT_STATUS";
import {User} from "./User";
import {PromoCode} from "./Models";
import {ShippingAddress} from "./ShippingAddress";


@Entity()
export class Product extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    label: string

    @Column()
    description: string


    // array of urls column in postgres typeorm
    @Column("text", {array: true, default: []})
    pictures: string[]

    @Column(
        {
            default: 1
        }
    )
    stock: number

    @Column("text", {array: true, default: []})
    tags: string[]





    @ManyToOne(type => User, vendor => vendor.products)
    vendor: User

    @OneToOne(type => ProductDetail, productDetail => productDetail.product, {
        cascade: true
    })
    details: ProductDetail



    @OneToMany(type => NewOrder, order => order.product, {
            cascade: true
        }
    )
    orders: NewOrder[]

    @OneToMany(type => Favorite, favorite => favorite.product, {
            cascade: true
        }
    )
    favorites: Favorite[]

    @ManyToOne(type => SubCategory, category => category.products)
    sub_category: SubCategory

    // same as category for brand
    @ManyToOne(type => Brand, brand => brand.products)
    brand: Brand


    @OneToMany(type => Like, like => like.product, {
            cascade: true
    })
    likes: Like[]

    //comments
    @OneToMany(type => Comment, comment => comment.product, {
            cascade: true

        }
    )
    comments: Comment[]



    // auto generated createdAt, updatedAt columns
    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    createdAt: Date

    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    updatedAt: Date

    @Column({
        default: 0
    })
    share_count: number


    @Column({
        default: "stdrd_no_discount",
        type: "enum",
        enum: ["stdrd_no_discount", "stdrd_25_discount", "stdrd_50_discount", "stdrd_free", "self_delivery"]
    })
    delivery_type: string

    @ManyToMany(type => ProductSize, productSize => productSize.products, {
        cascade: true
    })
    sizes: ProductSize[]

    @ManyToMany(type => ProductColour, productColour => productColour.products, {
        cascade: true
    })
    colours: ProductColour[]





    //product product_status
    @Column({
        default: "public",
        type: "enum",
        enum: Object.values(PRODUCT_STATUS)
    })
    product_status: string


    // product.promoCodes
    //@ts-ignore
    @ManyToMany(type => PromoCode, promoCode => promoCode.products, {
        cascade: true
    })
    promoCodes: PromoCode[]


    constructor(data: Partial<Product>) {
        Object.assign(this, data)
    }
}


//new order entity
@Entity()
export class NewOrder extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number


    @ManyToOne(type => Product, product => product.orders)
    product: Product

    @ManyToOne(type => User, user => user.orders)
    buyer: User

    @ManyToOne(type => User, user => user.sales)
    vendor: User

    @Column({
        default: 1
    })
    quantity: number

    // createdAt
    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    createdAt: Date
    

    @Column({
        default: "pending",
        type: "enum",
        enum: ["pending", "processing", "delivered","dispatched","completed"]
    })
    order_status: string

    //shipping address
    //@ts-ignore
    @ManyToOne(type => ShippingAddress, shippingAddress => shippingAddress.order, {
        nullable: false,
    })
    shippingAddress: ShippingAddress

    //final price
    @Column({
        default: 0
    })
    final_price: number

    //deliveredAt (default null)
    @Column("timestamp with time zone", { default: () => "CURRENT_TIMESTAMP"})
    deliveredAt: Date

    constructor(data: Partial<NewOrder>) {
        Object.assign(this, data)
    }
}





