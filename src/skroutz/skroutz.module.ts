import { Module } from '@nestjs/common';
import { SkroutzService } from './skroutz.service';
import { HttpModule } from '@nestjs/axios';
import { ChatGptService } from 'src/chat-gpt/chat-gpt.service';

@Module({
  imports:
  [
    HttpModule
  ],
  providers: [SkroutzService],
  exports: [SkroutzService]
})
export class SkroutzModule {}
