// //@ts-nocheck
// import {BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
// import {Product} from "./Product";
// import {Order} from "./Order";
// import {User} from "./User";
//
// @Entity()
// export class OrderItem extends BaseEntity {
//
//     @PrimaryGeneratedColumn()
//     id: number
//
//     @Column()
//     quantity: number
//
//
//     @Column(
//         {
//             type: "enum",
//             enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
//             default: "pending"
//         }
//     )
//     item_status: string
//
//     @ManyToOne(type => Product, product => product.orderItems)
//     product: Product
//
//     @ManyToOne(type => Order, order => order.orderItems)
//     order: Order
//
//     @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
//     createdAt: Date
//
//     @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
//     updatedAt: Date
//
//     @ManyToOne(type => User, vendor => vendor.orders)
//     vendor: User
//
//     //price of product at time of order
//     @Column({
//         type: "decimal",
//         precision: 10,
//         scale: 2,
//         default: 0
//     })
//     set_price: number
//
//     constructor(data: Partial<OrderItem>) {
//         Object.assign(this, data)
//     }
// }
