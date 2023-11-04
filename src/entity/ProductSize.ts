//@ts-nocheck
import {BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {SubCategory} from "./SubCategory";
import {Product} from "./Product";

@Entity()
export class ProductSize extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    label: string

    @Column()
    value: string


    @ManyToMany(type => Product, product => product.sizes)
    @JoinTable()
    products: Product[]

    @ManyToOne(type => SubCategory, subCategory => subCategory.sizes)
    subCategory: SubCategory

    constructor(data: Partial<ProductSize>) {
        Object.assign(this, data)
    }
}
