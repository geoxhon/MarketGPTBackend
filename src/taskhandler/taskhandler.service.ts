import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from 'src/entities/chat.entity';
import { ChatEntry } from 'src/entities/chatentry.entity';
import { Product } from 'src/entities/product.entity';
import { SuggestedProduct } from 'src/entities/suggestedproduct.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaskhandlerService {
    constructor
    (
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(ChatEntry)
        private readonly chatEntryRepository: Repository<ChatEntry>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(SuggestedProduct)
        private readonly suggestedProductRepository: Repository<SuggestedProduct>
    ) {}
    async getCurrentSuggestedProduct(chat: Chat): Promise<SuggestedProduct>
    {
        try {
            
            const suggestedProduct = await this.suggestedProductRepository.findOne
            ({
                where: {
                    chat: chat,
                },
                order: {
                    createdAt: 'DESC'
                }
            })
            return suggestedProduct;
        } catch (error) {
            console.error('Error fetching chat:', error);
            throw error;
        }
    }
    async getCurrentProduct(chat: Chat): Promise<Product>
    {
        try {
            
            const products = await this.productRepository.find
            ({
                where: {
                    chat: chat,
                },
                order: {
                    id: 'ASC'
                }
            });
            console.log("PRODUCTS");
            const suggestedProducts = await this.suggestedProductRepository.find
            ({
                where: {
                    chat: chat,
                },
                order: {
                    id: 'ASC'
                }
            })
            if (products.length > suggestedProducts.length)
            {
                console.log('return product');
                return products[suggestedProducts.length];
            }
            console.log('retunr null');
            return null;
        } catch (error) {
            console.error('Error fetching chat:', error);
            throw error;
        }
    }

    async fetchChatHistoryOpenAIFormat(chat: Chat): Promise<any[]>
    {
        const history = await this.fetchChatHistory(chat);
        const openAIHistory: any[] = [];
        for (const entry of history)
        {
            openAIHistory.push(entry.toOpenAIMessage());
        }
        return openAIHistory;
    }

    async fetchChatHistory(chat: Chat): Promise<ChatEntry[]>
    {
        try {
            
            const response = await this.chatEntryRepository.find
            ({
                where: {
                    chat: chat,
                },
                order: {
                    createdAt: 'ASC'
                }
            });
            
            return response;
        } catch (error) {
            console.error('Error fetching chat:', error);
            throw error;
        }
    }

    async fetchMostRecentResponse(chat: Chat): Promise<ChatEntry> {
        try {
            
            const response = await this.chatEntryRepository.findOne
            ({
                where: {
                    chat: chat,
                    isUserMessage: true
                },
                order: {
                    createdAt: 'DESC' // ✅ Fetch the most recent entry
                }
            });
            
            return response;
        } catch (error) {
            console.error('Error fetching chat:', error);
            throw error;
        }
    }   
}
