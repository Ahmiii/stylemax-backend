//key-value pairs
//typeorm SystemConfig model
import {BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class SystemConfig {


        @PrimaryColumn({
            unique: true,
            default: "default"
        })
        key?: string;

        @Column()
        value?: string;

        constructor(params: Partial<SystemConfig>) {
            Object.assign(this, params);
        }
}
