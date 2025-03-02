import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Chat } from 'src/entities/chat.entity';
import { ChatGptService } from 'src/chat-gpt/chat-gpt.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatEntry } from 'src/entities/chatentry.entity';
import { EChatState } from 'src/enum/EChatState';
import { Product } from 'src/entities/product.entity';
import { SkroutzService } from 'src/skroutz/skroutz.service';
import { TaskhandlerService } from './taskhandler.service';
import { SuggestedProduct } from 'src/entities/suggestedproduct.entity';

@Processor('chatQueue')
export class TaskhandlerProcessor {
  constructor(
    private readonly chatGptService: ChatGptService,
    private readonly skroutzService: SkroutzService,
    private readonly taskHandlerService: TaskhandlerService,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(ChatEntry)
    private readonly chatEntryRepository: Repository<ChatEntry>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(SuggestedProduct)
    private readonly suggestedProductRepository: Repository<SuggestedProduct>
  ) {}

  @Process('processChat')
  async handleChatJob(job: Job<any>) {
    console.log(`Processing job with ID: ${job.id}`);
    const chat: Chat = job.data.chat;

    // Process until the chat is marked as FINISHED.
    let breakLoop = false;
    while (chat.state !== EChatState.FINISHED && !breakLoop) {
      switch (chat.state) {
        case EChatState.INIT:
          await this.handleInitState(chat);
          break;
        case EChatState.FOLLOW_UP:
          await this.handleFollowUpState(chat);
          break;
        case EChatState.QUERY_FILTERS:
          await this.handleQueryFiltersState(chat);
          break;
        case EChatState.SEARCH_PRODUCTS:
          await this.handleSearchProductsState(chat);
          break;
        case EChatState.COMPARE_PRODUCTS:
          await this.handleCompareProductsState(chat);
          break;
        case EChatState.SUGGEST_PRODUCT:
          await this.handleSuggestProductState(chat);
          break;
        default:
          console.warn('Unknown state encountered. Finishing chat processing.');
          chat.state = EChatState.FINISHED;
          await this.chatRepository.save(chat);
      }
    }

    return { status: 'completed', result: `Processed message: ${job.data.message}` };
  }

  private async handleInitState(chat: Chat): Promise<void> {
    const variables = { user_prompt: chat.initial_prompt };
    const response = JSON.parse(
      await this.chatGptService.chatGptRequest('initDialogue', variables, [])
    );

    if (response.nextAction === 'FOLLOW_UP') {
      chat.state = EChatState.FOLLOW_UP;
      await this.saveChatEntry(chat, response.followUpQuestion);
    } else if (response.nextAction === 'QUERY_FILTERS') {
      chat.state = EChatState.QUERY_FILTERS;
      await this.createProducts(chat, response.products);
    }
    await this.chatRepository.save(chat);
  }

  private async handleFollowUpState(chat: Chat): Promise<void> {
    try {
      const userPrompt = await this.taskHandlerService.fetchMostRecentResponse(chat);
      if (!userPrompt) {
        // No user response available – exit processing for now.
        return;
      }
      const history = await this.taskHandlerService.fetchChatHistoryOpenAIFormat(chat);
      const response = JSON.parse(
        await this.chatGptService.chatGptRequest('followUp', { user_prompt: userPrompt.message }, history)
      );

      if (response.nextAction === 'FOLLOW_UP') {
        chat.state = EChatState.FOLLOW_UP;
        await this.saveChatEntry(chat, response.followUpQuestion);
      } else if (response.nextAction === 'QUERY_FILTERS') {
        chat.state = EChatState.QUERY_FILTERS;
        await this.createProducts(chat, response.products);
      }
      await this.chatRepository.save(chat);
    } catch (error) {
      console.error('Error handling FOLLOW_UP state:', error);
    }
  }

  private async handleQueryFiltersState(chat: Chat): Promise<void> {
    console.log('Handling QUERY_FILTERS state');
    try {
      const currentProduct = await this.taskHandlerService.getCurrentProduct(chat);
      if (!currentProduct) {
        console.log('No current product found. Finishing chat.');
        chat.state = EChatState.FINISHED;
        await this.chatRepository.save(chat);
        return;
      }

      const skroutzResponse = await this.skroutzService.fetchCategoryIdAndFilters(currentProduct.searchKeyphrase);
      currentProduct.skroutzProductId = skroutzResponse.categoryId;

      const history = await this.taskHandlerService.fetchChatHistoryOpenAIFormat(chat);
      const variables = {
        product: currentProduct.searchKeyphrase,
        filters: JSON.stringify(skroutzResponse.filters),
        criteria: JSON.stringify(currentProduct.searchCriteria)
      };

      const response = JSON.parse(
        await this.chatGptService.chatGptRequest('queryFilters', variables, history)
      );

      if (response.nextAction === 'SEARCH_PRODUCTS') {
        currentProduct.filterIds = response.filterIds;
        chat.state = EChatState.SEARCH_PRODUCTS;
      }
      await this.productRepository.save(currentProduct);
      await this.chatRepository.save(chat);
    } catch (error) {
      console.error('Error handling QUERY_FILTERS state:', error);
    }
  }

  private async handleSearchProductsState(chat: Chat): Promise<void> {
    console.log('Handling SEARCH_PRODUCTS state');
    try {
      const currentProduct = await this.taskHandlerService.getCurrentProduct(chat);
      if (!currentProduct) {
        chat.state = EChatState.FINISHED;
        await this.chatRepository.save(chat);
        return;
      }

      // Fetch products from Skroutz using the current product's filters.
      const skroutzResponse = await this.skroutzService.fetchAllProductsByFilters(
        currentProduct.skroutzProductId,
        currentProduct.filterIds,
        currentProduct.priceMin,
        currentProduct.priceMax
      );

      const history = await this.taskHandlerService.fetchChatHistoryOpenAIFormat(chat);
      const bestProducts = [];
      const searchedProductNames = [];

      // Process products in chunks of 10 until we collect 10 suggestions.
      for (let i = 0; i < skroutzResponse.length && bestProducts.length < 10; i += 10) {
        const chunk = skroutzResponse.slice(i, i + 10);
        const variables = {
          keyphrase: currentProduct.searchKeyphrase,
          criteria: JSON.stringify(currentProduct.searchCriteria),
          products: JSON.stringify(chunk),
          already_suggested: JSON.stringify(searchedProductNames)
        };

        const suggestedProduct = JSON.parse(
          await this.chatGptService.chatGptRequest('compareProducts', variables, history)
        );
        searchedProductNames.push(suggestedProduct.product_name);
        bestProducts.push(suggestedProduct);
      }

      // Compare the final set of suggested products.
      const finalChunk = bestProducts.slice(0, 10);
      const variables = {
        keyphrase: currentProduct.searchKeyphrase,
        criteria: JSON.stringify(currentProduct.searchCriteria),
        products: JSON.stringify(finalChunk)
      };

      const suggestedProduct = JSON.parse(
        await this.chatGptService.chatGptRequest('compareSuggestedProducts', variables, history)
      );

      await this.suggestedProductRepository.save(
        this.suggestedProductRepository.create({
          skroutzProductId: suggestedProduct.productId,
          product_name: suggestedProduct.productName,
          presentation: suggestedProduct.presentation,
          chat
        })
      );

      chat.state = EChatState.SUGGEST_PRODUCT;
      await this.chatRepository.save(chat);
    } catch (error) {
      console.error('Error handling SEARCH_PRODUCTS state:', error);
    }
  }

  private async handleCompareProductsState(chat: Chat): Promise<void> {
    // Placeholder if additional logic is needed for comparing products.
    console.log('Handling COMPARE_PRODUCTS state');
    chat.state = EChatState.FINISHED;
    await this.chatRepository.save(chat);
  }

  private async handleSuggestProductState(chat: Chat): Promise<void> {
    console.log('Handling SUGGEST_PRODUCT state');
    try {
      const product = await this.taskHandlerService.getCurrentSuggestedProduct(chat);
      const skroutzResponse = await this.skroutzService.getProductDetails(product.skroutzProductId);
      product.weburl = skroutzResponse.webUrl;
      product.images = skroutzResponse.productImages;
      await this.suggestedProductRepository.save(product);

      await this.saveChatEntry(chat, product.presentation, product);
      // Optionally, reset state if you want to loop back to filtering.
      chat.state = EChatState.QUERY_FILTERS;
      await this.chatRepository.save(chat);
    } catch (error) {
      console.error('Error handling SUGGEST_PRODUCT state:', error);
    }
  }

  // Helper method to create and save a chat entry.
  private async saveChatEntry(
    chat: Chat,
    message: string,
    suggestedProduct?: SuggestedProduct
  ): Promise<void> {
    const chatEntry = this.chatEntryRepository.create({
      message,
      isUserMessage: false,
      chat,
      suggestedProduct: suggestedProduct || null
    });
    await this.chatEntryRepository.save(chatEntry);
  }

  // Helper method to create and save products from the ChatGPT response.
  private async createProducts(chat: Chat, productsData: any[]): Promise<void> {
    for (const productData of productsData) {
      const product = this.productRepository.create({
        searchKeyphrase: productData.searchKeyphrase,
        searchCriteria: productData.searchCriteria,
        priceMin: productData.priceMin,
        priceMax: productData.priceMax,
        skroutzProductId: 0,
        filterIds: [],
        chat
      });
      await this.productRepository.save(product);
    }
  }
}