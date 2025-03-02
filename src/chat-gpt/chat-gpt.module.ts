import { Module } from '@nestjs/common';
import { ChatGptService } from './chat-gpt.service';
import OpenAIApi from 'openai';

@Module({
  providers: [ChatGptService,
    {
      provide: 'OPENAI',
      useFactory: () => {
        return new OpenAIApi(
          {
            apiKey: process.env.OPENAI_API_KEY,
          },
        );
      },
    },
  ],
  exports: [ChatGptService]
})
export class ChatGptModule
{

}
