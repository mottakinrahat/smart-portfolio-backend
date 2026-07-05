import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

const SYSTEM_PROMPT = `You are "Ask Rahat" — an AI assistant representing Mottakin Rahat, a passionate full-stack developer and AI enthusiast.

About Rahat:
- Full-stack developer specializing in Next.js, NestJS, TypeScript, and AI integrations
- Builds beautiful, production-grade web applications
- Passionate about open source, portfolio projects, and sharing knowledge through his blog
- Loves working with modern tools: Prisma, PostgreSQL, OpenAI, TailwindCSS

Your role:
- Answer questions about Rahat's skills, projects, and blog posts in a warm, professional tone
- Keep responses concise but helpful (2-4 sentences unless a longer answer is needed)
- If asked something outside Rahat's portfolio/professional context, politely redirect
- Never fabricate project details — say "I'm not sure about that specific detail, but you can check the projects section!"
- Always maintain a friendly, developer-to-developer conversational tone`;

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY') ?? '',
    });
  }

  /** Create a new chat session */
  async createSession() {
    const session = await this.prisma.chatSession.create({ data: {} });
    return { sessionId: session.id, createdAt: session.createdAt };
  }

  /** Send a user message and get an AI reply */
  async sendMessage(sessionId: string, dto: SendMessageDto) {
    // Verify session exists
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
    });

    if (!session) {
      throw new NotFoundException(`Chat session "${sessionId}" not found`);
    }

    // Build message history for context (last 20 messages)
    const history = session.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Save user message first
    await this.prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: dto.message },
    });

    // Call OpenAI
    let assistantReply: string;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history,
          { role: 'user', content: dto.message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      assistantReply =
        completion.choices[0]?.message?.content ??
        "I'm sorry, I couldn't generate a response. Please try again!";
    } catch (error) {
      this.logger.error('OpenAI API error', error);

      // Graceful fallback if API key is missing / quota exceeded
      assistantReply =
        "Hi! I'm Ask Rahat. It looks like I'm having trouble connecting to my brain right now. Please check back soon or explore the portfolio directly!";
    }

    // Save assistant reply
    const assistantMessage = await this.prisma.chatMessage.create({
      data: { sessionId, role: 'assistant', content: assistantReply },
    });

    return {
      reply: assistantReply,
      messageId: assistantMessage.id,
      sessionId,
    };
  }

  /** Get full session with message history */
  async getSession(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) {
      throw new NotFoundException(`Chat session "${sessionId}" not found`);
    }

    return session;
  }

  /** Delete a session and all its messages */
  async deleteSession(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Chat session "${sessionId}" not found`);
    }

    await this.prisma.chatSession.delete({ where: { id: sessionId } });

    return { message: `Session "${sessionId}" deleted successfully` };
  }
}
