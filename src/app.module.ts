import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGptModule } from './chat-gpt/chat-gpt.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from './chat/chat.module';
import { SkroutzModule } from './skroutz/skroutz.module';
import { QueueModule } from './queue/queue.module';
import { BullModule } from '@nestjs/bull';
import { TaskhandlerModule } from './taskhandler/taskhandler.module';

import { ChatEntry } from './entities/chatentry.entity';
import { Product } from './entities/product.entity';
import { Chat } from './entities/chat.entity';
import { SuggestedProduct } from './entities/suggestedproduct.entity';

@Module({
  imports: [
    ChatGptModule,
    BullModule.forRoot({
      redis: {
        host: 'redis', // Change to your Redis host
        port: 6379, // Change to your Redis port
      },
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'root',
      database: process.env.DB_NAME || 'nest_db',
      autoLoadEntities: true,
      synchronize: true, // Set to false in production
      entities: [Chat, ChatEntry, Product, SuggestedProduct],
      migrations: ['src/migrations/*.ts']
    }),
    ChatModule,
    SkroutzModule,
    QueueModule,
    TaskhandlerModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
