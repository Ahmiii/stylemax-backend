//@ts-nocheck
//typeorm entity to store key:string and value:Blob in postgres

import { Blob } from "buffer";
import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";

@Entity()
export class MediaResource extends BaseEntity  {

        @PrimaryGeneratedColumn()
        id: number

        @Column()
        key: string

        @Column("bytea")
        value: Blob

    constructor(data: Partial<MediaResource>) {
        Object.assign(this, data)
    }
}
