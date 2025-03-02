import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from 'src/entities/chat.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
    ) {}

    @Post()
    async createChat(@Body('initial_prompt') initialPrompt: string) {
        return this.chatService.createChat(initialPrompt);
    }

    @Get('/:chatId')
    async fetchChat(@Param('chatId') chatId: string) {
        return await this.chatService.fetchChat(chatId);
    }

    @Post('/:chatId/reply')
    async replyChat(@Param('chatId') chatId: string, @Body('prompt') prompt: string) {
        return await this.chatService.replyChat(chatId, prompt);
    }
}