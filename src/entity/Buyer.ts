// //typeorm Buyer model, Buyer.id = User.id
// //@ts-nocheck
//
// import {
//     Entity,
//     PrimaryGeneratedColumn,
//     Column,
//     OneToOne,
//     JoinColumn,
//     OneToMany,
//     PrimaryColumn,
//     BaseEntity
// } from "typeorm"
// import {User} from "./User"
// import {Favorite} from "./Favorite";
// import {Rating} from "./Rating";
// import {Comment} from "./Comment";
// import {Order} from "./Order";
// import {Cart} from "./Cart";
//
// @Entity()
// export class Buyer extends BaseEntity {
//
//     @PrimaryColumn()
//     id: number
//
//     @OneToOne(type => User)
//     @JoinColumn()
//     user: User
//
//
//
//
//
//     constructor(data: Partial<Buyer>) {
//         Object.assign(this, data)
//     }
//
//
// }
