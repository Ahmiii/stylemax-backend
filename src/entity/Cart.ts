//@ts-nocheck
import {BaseEntity, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {CartItem} from "./CartItem";
import {User} from "./User";

@Entity()
export class Cart extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number

    @OneToMany(type => CartItem, cartItem => cartItem.cart, {
        cascade: true
    })
    cartItems: CartItem[]

    @OneToOne(type => User, {
            cascade: true
        }
    )
    @JoinColumn()
    buyer: User


    constructor(data: Partial<Cart>) {
        Object.assign(this, data)
    }
}
