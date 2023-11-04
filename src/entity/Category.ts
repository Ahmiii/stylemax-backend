//@ts-nocheck
//category entity typeorm/postgres
// Path: src\entity\Category.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    JoinColumn,
    ManyToMany,
    JoinTable,
    BaseEntity
} from "typeorm";
import {SubCategory} from "./SubCategory";

@Entity()
export class Category extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        unique: true
    })
    label: string

    @Column()
    description: string



    //subcategories are one to many with category
    @OneToMany(type => SubCategory, subcategory => subcategory.category, {
        cascade: true
    })
    @JoinTable()
    subCategories: SubCategory[]

    //category picture
    @Column(
        {
            //random image url
            default: "https://picsum.photos/200/300"
        }
    )
    picture: string


    constructor(data: Partial<Category>) {
        Object.assign(this, data)
    }
}
