//@ts-nocheck
//Verification entity

import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, BaseEntity, ManyToOne} from "typeorm";
import {User} from "./User";

@Entity()
export class Verification extends BaseEntity {

        @PrimaryGeneratedColumn()
        id: number

        @Column({
            unique: true
        })
        code: string


        @Column({nullable: true})
        email: string

        @Column({nullable: true})
        phone: string

        @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
        createdAt: Date



        @ManyToOne(type => User, user => user.verification)
        user: User

        //type of verification, e.g. email, phone, account
        @Column({
            type: "enum",
            enum: ["email", "phone", "account"],
            default: "account"
        })
        type: string

        constructor(data: Partial<Verification>) {
            Object.assign(this, data)
        }
}
