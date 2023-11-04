//@ts-nocheck
import {BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {Product} from "./Product";
import {Cart} from "./Cart";

@Entity()
export class CartItem extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    quantity: number
    //
    // @OneToOne(type => Product, {
    //         cascade: true
    //     }
    // )
    // product: Product

    //single product can be in belong to multiple cartItems, but there can only be on cartItem per product per cart
    @ManyToOne(type => Product, product => product.cartItems)
    product: Product

    @ManyToOne(type => Cart, cart => cart.cartItems)
    cart: Cart


    constructor(data: Partial<CartItem>) {
        Object.assign(this, data)
    }
}
