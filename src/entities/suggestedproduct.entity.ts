import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Chat } from './chat.entity';


@Entity()
export class SuggestedProduct {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    product_name: string;

    @ManyToOne(() => Chat, () => null, { nullable: true, onDelete: 'CASCADE' })
    chat: Chat | null;

    @Column({ type: 'int', nullable: true })
    skroutzProductId: number;

    @Column({ type: 'longtext', nullable: true })
    presentation?: string;

    @Column({ type: 'simple-array', nullable: true })
    images?: string[]

    @Column({ nullable: true })
    weburl?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}