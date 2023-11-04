//@ts-nocheck
import {BaseEntity, Column, Entity, JoinTable, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Product} from "./Product";

@Entity()
export class Brand extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        unique: true
    })
    label: string

    @Column()
    description: string

    @Column({
        nullable: true
    })
    logo: string


    @OneToMany(type => Product, product => product.brand, {
        cascade: true
    })
    @JoinTable()
    products: Product[]

    constructor(data: Partial<Brand>) {
        Object.assign(this, data)
    }
}
