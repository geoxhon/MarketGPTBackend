import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from 'src/entities/chat.entity';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ChatEntry } from 'src/entities/chatentry.entity';
import { EChatState } from 'src/enum/EChatState';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(ChatEntry)
        private readonly chatEntryRepository: Repository<ChatEntry>,
        @InjectQueue('chatQueue') private readonly chatQueue: Queue
    ) {}

    async createChat(initialPrompt: string) {
        const chat = this.chatRepository.create
        ({
            id: uuidv4(),
            initial_prompt: initialPrompt,
        });
        const message = this.chatEntryRepository.create
        ({
            id: uuidv4(),
            message: initialPrompt,
            isUserMessage: true,
            chat: chat
        });

        await this.chatRepository.save(chat);
        await this.chatEntryRepository.save(message);
        const job = await this.chatQueue.add('processChat', { chat: chat });
        return { message: 'Chat entry created', chatId: chat.id };
    }

    async fetchChat(chat_id: string) {
        try {
            const chat = await this.chatRepository.findOne({
                where: { id: chat_id }, // Ensure chat entries are also fetched
            });

            if (!chat) {
                throw new NotFoundException('Chat not found');
            }

            const chatHistory = await this.chatEntryRepository.find({
                where: {chat: chat},
                order: 
                {
                    createdAt: "ASC"
                },
                relations: ['suggestedProduct']
            });

            return {chatData: chat, chatHistory: chatHistory};
        } catch (error) {
            console.error('Error fetching chat:', error);
            throw error;
        }
    }
    
    async replyChat(chat_id: string, prompt: string)
    {
        const chat = await this.chatRepository.findOne({
            where: { id: chat_id }, // Ensure chat entries are also fetched
        });
        if (!chat) throw new NotFoundException("No chat found for provided id");
        if (chat.state != EChatState.FOLLOW_UP) throw new ForbiddenException("Cannot reply to current state");
        const message = this.chatEntryRepository.create
        ({
            id: uuidv4(),
            message: prompt,
            isUserMessage: true,
            chat: chat
        });
        await this.chatEntryRepository.save(message);

        const job = await this.chatQueue.add('processChat', { chat: chat });
        return { message: 'Chat entry created', chatId: chat.id };
    }
}