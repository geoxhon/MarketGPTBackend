import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Chat } from './chat.entity';


@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    searchKeyphrase: string;

    @Column('simple-array')
    searchCriteria: string[];

    @Column('simple-array')
    filterIds: number[];

    @Column({ type: 'int', nullable: true })
    priceMin: number;

    @Column({ type: 'int', nullable: true })
    priceMax: number;

    @ManyToOne(() => Chat, () => null, { nullable: true, onDelete: 'CASCADE' })
    chat: Chat | null;

    @Column({ type: 'int', nullable: true })
    skroutzProductId: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}