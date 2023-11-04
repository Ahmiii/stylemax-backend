// //@ts-nocheck
// import {BaseEntity, Column, Entity, JoinTable, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
// import {OrderItem} from "./OrderItem";
//
// import {ShippingAddress} from "./ShippingAddress";
// import {User} from "./User";
//
// @Entity()
// export class Order extends BaseEntity {
//
//     @PrimaryGeneratedColumn()
//     id: number
//
//
//
//     @OneToMany(type => OrderItem, orderItem => orderItem.order, {
//         cascade: true
//     })
//     orderItems: OrderItem[]
//
//     @ManyToOne(type => User, buyer => buyer.orders)
//     buyer: User
//
//     @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
//     createdAt: Date
//
//     @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
//     updatedAt: Date
//
//     @Column({
//         type: "enum",
//         enum: ["pending", "processing", "delivered"],
//         default: "pending"
//     })
//     status: string
//
//     //shipping address
//     @ManyToOne(type => ShippingAddress, shippingAddress => shippingAddress.order, {
//         allowNull: false,
//     })
//     shippingAddress: ShippingAddress
//
//     constructor(data: Partial<Order>) {
//         Object.assign(this, data)
//     }
// }
//
//
