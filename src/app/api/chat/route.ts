import { Metadata, getContext } from '@/services/context'
import type { PineconeRecord } from '@pinecone-database/pinecone'
import { Message, StreamData } from 'ai'
import { openai } from '@ai-sdk/openai';
import { CoreMessage, streamText, convertToCoreMessages } from 'ai';


// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, withContext }: { messages: CoreMessage[], withContext: boolean } = await req.json();
    // Get the last message
    const lastMessage = messages[messages.length - 1]

    // Get the context from the last message
    const context = withContext ? await getContext(lastMessage?.content as string, '', 3000, 0.8, false) : ''

    // Get the chunks of text from the context
    const docs = (withContext && context.length > 0) ? (context as PineconeRecord[]).map(match => (match.metadata as Metadata).chunk) : [];

    // Join all the chunks of text together, truncate to the maximum number of tokens, and return the result
    const contextText = docs.join("\n").substring(0, 3000)
        
    const prompt = `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${contextText}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      `

    const sanitizedMessages = messages.map((message: any) => {
      const { createdAt, id, ...rest } = message;
      return rest;
    });

    // Create a StreamData object to store the context data
    const data = new StreamData();   

    const result = await streamText({
      model: openai("gpt-4o"),
      system: prompt,
      messages: convertToCoreMessages(sanitizedMessages.filter((message: Message) => message.role === 'user')),
      onFinish: async () => {
        // Append the context to the StreamData object
        data.append({ context });
        
        // Ensure to close the StreamData object
        data.close();        
      }
    });

    // Use toDataStreamResponse with the StreamData object
    return result.toDataStreamResponse({
      data
    });
  } catch (e) {
    throw (e)
  }
}