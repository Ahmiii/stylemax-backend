//ignore file ts
//@ts-nocheck
import {BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm"
import {Comment} from "./Comment";
import {NewOrder, Product} from "./Product";
import {Favorite} from "./Favorite";
import {Verification} from "./Verification";

@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({unique: true})
    email: string

    @Column()
    password: string

    @Column({default: "user"})
    role: string

    @Column({default: false})
    isAdmin: boolean

    @Column({default: false})
    isVerified: boolean

    @OneToMany(type => Comment, comment => comment.user, {
            cascade: true
        }
    )
    comments: Comment[]

    //oauth accounts table will be linked to this table

    @OneToMany(type => Product, product => product.vendor, {
        cascade: true
    })
    products: Product[]


    //vendor and buyer are linked to the same table Order
    @OneToMany(type => NewOrder, order => order.buyer, {
            cascade: true
    })
    orders: NewOrder[]

    @OneToMany(type => NewOrder, order => order.vendor, {
            cascade: true
    })
    sales: NewOrder[]



    @OneToMany(type => Favorite, favorite => favorite.buyer, {
            cascade: true
        }
    )
    favorites: Favorite[]

    @OneToMany(type => Verification, verification => verification.user, {
            cascade: true
    })
    verifications: Verification[]



    //blocked_till is the date when the user will be unblocked, default is yesterday
    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP", nullable: true})
    blocked_till: Date

    @Column({nullable: true})
    picture: string


    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    createdAt: Date


    constructor(data: Partial<User>) {
        Object.assign(this, data)
    }

}




