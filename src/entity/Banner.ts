//@ts-nocheck

// Path: src\entity\Banner.ts

//Banner model keeps track of banners that are displayed on the home page

import {
        
        Entity,
        PrimaryGeneratedColumn,
        Column,
        OneToOne,
        JoinColumn,
        ManyToOne,
        OneToMany,
        ManyToMany,
        BaseEntity
} from "typeorm"


@Entity()
export class Banner extends BaseEntity {

        @PrimaryGeneratedColumn()
        id: number

        @Column(
            // {unique: true}
        )
        label: string

        @Column()
        description: string

        @Column({
                nullable: true
        })
        picture: string

        constructor(data: Partial<Banner>) {
            Object.assign(this, data)
        }
}
