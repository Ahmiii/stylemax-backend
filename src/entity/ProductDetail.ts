//@ts-nocheck
//typeorm for product details
import {BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm"
import {Product} from "./Product"


@Entity()
export class ProductDetail extends BaseEntity {

        @PrimaryGeneratedColumn()
        id: number

        @Column()
        price: number

        @Column()
        offered_price: number

        // earnings: number
        //allow float
        @Column({
            type: "float",
            default: 0
        })
        earnings: number

        @Column({
            type: "float",
            default: 0
        })
        shipping_fee: number

        @Column({
            type: "float",
            default: 0
        })
       platform_fee: number



        @Column()
        currency: string

        // @Column()
        // size: string
        //product sizes -> ProductSize
        @Column()
        condition: string

        @Column()
        style: string


        @Column()
        material: string

        // enum for quantity_type (single, multiple)
        @Column({
            type: "enum",
            enum: ["single", "multiple"],
            default: "single"
        })
        quantity_type: string


        @ManyToOne(type => Product, product => product.details)
        product: Product

        constructor(data: Partial<ProductDetail>) {
            Object.assign(this, data)
        }

}

