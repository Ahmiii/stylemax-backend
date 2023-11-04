// //typeorm Vendor model, Vendor.id = User.id
// //@ts-nocheck
// import {
//     Entity,
//     PrimaryGeneratedColumn,
//     Column,
//     OneToOne,
//     JoinColumn,
//     OneToMany,
//     ManyToMany,
//     PrimaryColumn, BaseEntity
// } from "typeorm"
// import {User} from "./User"
// import {Product} from "./Product";
// import {Order} from "./Order";
// import {Coupon} from "./Coupon";
// import {Collection} from "./Collection";
//
// @Entity()
// export class Vendor extends BaseEntity {
//
//     @PrimaryColumn()
//     id: number
//
//     @OneToOne(type => User, {
//         cascade: true
//     })
//     @JoinColumn()
//     user: User
//
//
//
//     //collection
//     @OneToMany(type => Collection, collection => collection.vendor, {
//         cascade: true
//     })
//     collections: Collection[]
//
//     //coupon
//     @OneToMany(type => Coupon, coupon => coupon.vendor, {
//             cascade: true
//         }
//     )
//     coupons: Coupon[]
//
//     constructor(data: Partial<Vendor>) {
//         Object.assign(this, data)
//     }
// }
