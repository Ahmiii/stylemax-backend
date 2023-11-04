//@ts-nocheck
import {BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {Product} from "./Product";
import {User} from "./User";

@Entity()
export class Favorite extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number


    @ManyToOne(type => User, buyer => buyer.favorites)
    buyer: User

    @ManyToOne(type => Product, product => product.favorites)
    product: Product

    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    createdAt: Date

    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    updatedAt: Date

    constructor(data: Partial<Favorite>) {
        Object.assign(this, data)
    }
}
