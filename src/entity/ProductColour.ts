//@ts-nocheck
import {BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {SubCategory} from "./SubCategory";
import {Product} from "./Product";

@Entity()
export class ProductColour extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    label: string

    @Column()
    value: string



    // product.colours
    @ManyToMany(type => Product, product => product.colours)
    @JoinTable()
    products: Product[]


    @ManyToOne(type => SubCategory, subCategory => subCategory.colours)
    subCategory: SubCategory

    constructor(data: Partial<ProductColour>) {
        Object.assign(this, data)
    }
}


