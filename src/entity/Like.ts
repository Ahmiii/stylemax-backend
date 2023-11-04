// @ts-nocheck
import {BaseEntity, Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {Product} from "./Product";
import {User} from "./User";

@Entity()
export class Like extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(type => User, buyer => buyer.likes)
    buyer: User

    @ManyToOne(type => Product, product => product.likes)
    product: Product


    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    createdAt: Date

    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    updatedAt: Date

    constructor(data: Partial<Like>) {
        Object.assign(this, data)
    }

}

