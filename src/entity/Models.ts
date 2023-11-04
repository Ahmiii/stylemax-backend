//@ts-nocheck
import {
    BaseEntity,
    Column,
    Entity,
    JoinTable, ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
    PrimaryGeneratedColumn
} from "typeorm";
import {MediaResource} from "./MediaResource";
import * as crypto from "crypto";
import {Product} from "./Product";
import {User} from "./User";

export function uniqueLabel():string {
    return crypto.randomBytes(10).toString('hex');
}

@Entity()
export class MediaGroup extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    // unique english label
    @Column({
        unique: true,
        default: uniqueLabel()
    })
    label: string

    @OneToMany(type => Paragraph, paragraph => paragraph.mediaGroup, {
        cascade: true,
        onDelete: "CASCADE"
    })
    paragraphs: Paragraph[]



    // //one to many media resources
    // @Column()
    // mediaResources: string[]
    //typeorm postgres media resource: string[]
    @Column(
        {
            type: "simple-array",
            default: []
        }
    )
    mediaResources: string[]

    constructor(data: Partial<MediaGroup>) {
        Object.assign(this, data)
    }

}


@Entity()
export class Paragraph extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    text: string

    @ManyToOne(type => MediaGroup, mediaGroup => mediaGroup.paragraphs)
    @JoinTable()
    mediaGroup: MediaGroup

    constructor(data: Partial<Paragraph>) {
        Object.assign(this, data)
    }
}



//------------------------------ Promo Code model
@Entity()
export class PromoCode extends BaseEntity {

    @PrimaryColumn()
    code: string

    // type of discount [item, order]
    @Column(
        {
            nullable: false,
            type: "enum",
            enum: ['item', 'order'],
            default: 'order' // full order price discount
        }
    )
    discount_method: string

    //fixed or percentage
    @Column(
        {
            nullable: false,
            type: "enum",
            enum: ['fixed', 'percentage'],
            default: 'fixed'
        }
    )
    discount_type: string

    @Column(
        {
            nullable: false
        }
    )
    discount: number



    //created at
    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    createdAt: Date

    @Column(
    //     default is 1 month
        {
            type: "timestamp with time zone",
            default: () => "CURRENT_TIMESTAMP + interval '1 month'"
        }
    )
    expiry_date: Date

    @Column()
    is_active: boolean

    // count allowed uses
    @Column(
        {
            default: 10
        }
    )
    count: number

    //max, min order amount
    @Column(
        {
            nullable: true
        }
    )
    max_price: number

    @Column(
        {
            nullable: true
        }
    )
    min_price: number

    //min, max item quantity
    @Column(
        {
            nullable: true
        }
    )
    max_quantity: number

    @Column(
        {
            nullable: true
        }
    )
    min_quantity: number


    // // specific products (Link to product)
    // @ManyToMany(type => Product, product => product.promoCodes)
    // @JoinTable()
    // products: Product[]
    //
    // //can be used with other promo codes
    // @Column(
    //     {
    //         default: false
    //     }
    // )
    // is_stackable: boolean

    constructor(data: Partial<PromoCode>) {
        Object.assign(this, data)
    }
}


//fields for PromoCodeUsage
//ths table will be used to track promo code usage
//example row
const exampleRow = {
    promoId: 1,
    userId: 1,
}

@Entity()
export class PromoCodeUsage extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToMany(type => PromoCode, promoCode => promoCode.id)
    @JoinTable()
    promoCode: PromoCode

    @ManyToMany(type => User, user => user.id)
    @JoinTable()
    user: User

    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    createdAt: Date

    constructor(data: Partial<PromoCodeUsage>) {
        Object.assign(this, data)
    }
}


//platform fee configuration
//this will be used to calculate platform fee from order total
//take % of order total if order total is greater than min val
//if order total is less than min val, take fixed amount
const examplePlatformFee = {
    min_val: 100,
    fixed_amount: 10,
    percentage: 10
}

@Entity()
export class PlatformFee extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column(
        {
            nullable: false,
            default: 20
        }
    )
    min_val: number

    @Column(
        {
            nullable: false,
            default: 5,
        }
    )
    fixed_amount: number

    @Column(
        {
            nullable: false,
            default: 10,
            type: "float"
        }
    )
    percentage: number

    constructor(data: Partial<PlatformFee>) {
        Object.assign(this, data)
    }
}
