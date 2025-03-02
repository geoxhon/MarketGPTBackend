import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { QueueModule } from 'src/queue/queue.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from 'src/entities/chat.entity';
import { ChatEntry } from 'src/entities/chatentry.entity';

@Module({
  imports:
  [
    QueueModule,
    TypeOrmModule.forFeature([Chat, ChatEntry])
  ],
  controllers: [ChatController],
  providers: [ChatService,]
})
export class ChatModule {}
