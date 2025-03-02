import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGptModule } from 'src/chat-gpt/chat-gpt.module';
import { Chat } from 'src/entities/chat.entity';
import { ChatEntry } from 'src/entities/chatentry.entity';
import { Product } from 'src/entities/product.entity';
import { QueueModule } from 'src/queue/queue.module';
import { SkroutzModule } from 'src/skroutz/skroutz.module';
import { TaskhandlerProcessor } from './taskhandler.processor';
import { TaskhandlerService } from './taskhandler.service';
import { SuggestedProduct } from 'src/entities/suggestedproduct.entity';

@Module({
    imports:
    [
        QueueModule,
        ChatGptModule,
        SkroutzModule,
        TypeOrmModule.forFeature([Chat, ChatEntry, Product, SuggestedProduct])
    ],
    providers: [TaskhandlerProcessor, TaskhandlerService]
})
export class TaskhandlerModule {}
