import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { EChatState } from 'src/enum/EChatState';

@Entity()
export class Chat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    initial_prompt: string;

    @Column({ type: 'enum', enum: EChatState, default: EChatState.INIT })
    state: EChatState;

}