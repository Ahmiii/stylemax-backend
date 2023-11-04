//@ts-nocheck
//Contact us model
//first_name, last_name, email, phone, message

import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";

@Entity()
export class ContactUs extends BaseEntity {

        @PrimaryGeneratedColumn()
        id: number

        @Column()
        first_name: string

        @Column()
        last_name: string

        @Column()
        email: string

        @Column()
        phone: string

        @Column()
        message: string

        @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
        createdAt: Date

        @Column("timestamp with time zone", {default: () => "CURRENT_TIMESTAMP"})
        updatedAt: Date

        constructor(data: Partial<ContactUs>) {
            Object.assign(this, data)
        }
}
