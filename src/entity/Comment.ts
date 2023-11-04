//@ts-nocheck
import {BaseEntity, Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Product} from "./Product";
import {Buyer} from "./Buyer";
import {User} from "./User";

@Entity()
export class Comment extends BaseEntity {


    @PrimaryGeneratedColumn()
    id: number

    @Column()
    comment: string

    @ManyToOne(type => Product, product => product.comments)
    product: Product


    @ManyToOne(type => User, user => user.comments)
    user: User

    //created at
    @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
    createdAt: Date

    constructor(data: Partial<Comment>) {
        Object.assign(this, data)
    }
}
