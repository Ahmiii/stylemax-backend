//@ts-nocheck
import {BaseEntity, Column, Entity, JoinTable, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";
import {NewOrder} from "./Product";

@Entity()
export class ShippingAddress extends BaseEntity {

    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    firstname?: string

    @Column()
    lastname?: string

    @Column(
        {
            nullable:false
        }
    )
    address?: string

    @Column({
        nullable: true
    })
    address2?: string

    @Column()
    city?: string

    @Column()
    state?: string

    @Column()
    country?: string

    @Column()
    zipCode?: string

    @Column()
    phoneNumber?: string

    @Column(
        {
            default: false
        }
    )
    isDefault?: boolean

    //@ts-ignore
    @ManyToOne(type => User, user => user.shippingAddresses)
    user?: User

    //one to many with order
    @OneToMany(type => NewOrder, order => order.shippingAddress)
    @JoinTable()
    orders?: NewOrder[]

    constructor(data: Partial<ShippingAddress>) {
        Object.assign(this, data)
    }
}


