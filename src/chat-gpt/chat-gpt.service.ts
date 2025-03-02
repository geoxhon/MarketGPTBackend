import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import OpenAIApi from 'openai';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources';
import { File } from '@web-std/file';
import path from 'path';
import * as fs from 'fs';

// Define a type for message objects
type Message = {
  text: string;
  ai?: boolean; // Indicate if the message is from the AI
};

@Injectable()
export class ChatGptService {

    private openai: OpenAIApi = new OpenAIApi
        ({
            apiKey: process.env.OPENAI_API_KEY
        })

    /**
     * Make a request to ChatGPT to generate a response based on a prompt and message history.
     * @param prompt_template - The prompt template to use
     * @param messages - An array of messages representing the conversation history
     * @returns A string containing the generated response
     */
    async chatGptRequest(prompt_template: string, variables: Record<string, string>, messages: any[]): Promise<string> {
        try {
        // Convert message history to the format expected by the OpenAI API
        const history = messages;

        // Make a request to the ChatGPT model
        console.log('Processing GPT Request');
        const completion: ChatCompletion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
            {
                role: 'system',
                content: this.loadAndProcessTemplate(prompt_template, variables),
            },
            ...history,
            ],
            temperature: 0.5,
            max_tokens: 1000,
        });
        console.log('Finished GPT Request');
        // Extract the content from the response
        const [content] = completion.choices.map((choice) => choice.message.content);
        console.log(content);
        return content;
        } catch (e) {
        // Log and propagate the error
        console.error(e);
        throw new ServiceUnavailableException('Failed request to ChatGPT');
        }
    }

    /**
     * Generate a response to an image-related prompt using the ChatGPT Vision model.
     * @param text - The text prompt
     * @param url - The URL of the image
     * @returns A string containing the generated response
     */
    async chatGptVision(text: string, url: string): Promise<string> {
        try {
        // Make a request to the ChatGPT Vision model
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4-vision-preview',
            messages: [
            {
                role: 'user',
                content: [
                { type: 'text', text },
                { type: 'image_url', image_url: { url, detail: 'high' } },
                ],
            },
            ],
            temperature: 0.5,
            max_tokens: 1000,
        });

        // Extract the content from the response
        const [content] = completion.choices.map((choice) => choice.message.content);

        return content;
        } catch (e) {
        // Log and propagate the error
        console.error(e);
        throw new ServiceUnavailableException('Unable to recognize image');
        }
    }

    /**
     * Generate an image based on a text prompt using the OpenAI DALL-E model.
     * @param text - The text prompt for image generation
     * @returns A URL pointing to the generated image
     */
    async generateImage(text: string): Promise<string> {
        try {
        // Make a request to the DALL-E model for image generation
        const { data } = await this.openai.images.generate({
            model: 'dall-e-3',
            prompt: text,
            response_format: 'url',
        });

        // Return the URL of the generated image
        return data[0].url;
        } catch (e) {
        // Log and propagate the error
        console.error(e);
        throw new ServiceUnavailableException('Failed to generate image');
        }
    }

    /**
   * Reads a prompt template from a file and replaces placeholders with actual values.
   * @param templateName - Name of the template file (without `.tpl` extension)
   * @param variables - An object containing values to replace in the template
   * @returns The processed prompt as a string
   */
    private loadAndProcessTemplate(templateName: string, variables: Record<string, string>): string {
        try {
          // Read the template file
          const templatePath = path.join('src/templates/prompts', `${templateName}.tpl`);
          let prompt = fs.readFileSync(templatePath, 'utf8');
    
          // Replace variables like %variable% with their actual values
          Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`%${key}%`, 'g'); // Match all occurrences of %variable%
            prompt = prompt.replace(regex, value);
          });
    
          return prompt;
        } catch (error) {
          console.error(`Error loading prompt template: ${templateName}`, error);
          throw new ServiceUnavailableException('Failed to load prompt template');
        }
      }
}