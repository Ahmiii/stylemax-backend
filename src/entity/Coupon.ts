//@ts-nocheck
import {BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Vendor} from "./Vendor";
import {User} from "./User";

@Entity()
export class Coupon extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    couponName: string

    @Column()
    couponDescription: string

    @Column()
    couponStartDate: Date

    @Column()
    couponEndDate: Date

    @Column()
    couponDiscount: number


    @ManyToOne(type => User, vendor => vendor.coupons)
    vendor: User

    constructor(data: Partial<Coupon>) {
        Object.assign(this, data)
    }
}
