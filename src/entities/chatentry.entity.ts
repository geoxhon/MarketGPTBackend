import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Chat } from './chat.entity';
import { SuggestedProduct } from './suggestedproduct.entity';


@Entity()
export class ChatEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Chat, () => null, { nullable: true, onDelete: 'CASCADE' })
  chat: Chat | null;

  @ManyToOne(() => SuggestedProduct, () => null, { nullable: true, onDelete: 'CASCADE' })
  suggestedProduct: SuggestedProduct | null;

  @Column({type: 'longtext'})
  message: string;

  @Column()
  isUserMessage: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  toOpenAIMessage() {
    return {
      role: this.isUserMessage ? 'user' : 'assistant',
      content: this.message,
    };
  }

}