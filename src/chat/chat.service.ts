import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

const SYSTEM_PROMPT = `You are "Ask Rahat" — an AI assistant representing Mottakin Rahat, a passionate full-stack developer and AI enthusiast.

About Rahat:
- Full-stack developer specializing in Next.js, NestJS, TypeScript, and AI integrations
- Builds beautiful, production-grade web applications
- Passionate about open source, portfolio projects, and sharing knowledge through his blog
- Loves working with modern tools: Prisma, PostgreSQL, Gemini AI, TailwindCSS

Your role:
- Answer questions about Rahat's skills, projects, and blog posts in a warm, professional tone
- Keep responses concise but helpful (2-4 sentences unless a longer answer is needed)
- If asked something outside Rahat's portfolio/professional context, politely redirect
- Never fabricate project details — say "I'm not sure about that specific detail, but you can check the projects section!"
- Always maintain a friendly, developer-to-developer conversational tone`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

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

    // Save user message first
    await this.prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: dto.message },
    });

    const apiKey =
      this.config.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;

    let assistantReply: string;

    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is missing in environment variables. Operating in fallback mode.',
      );
      assistantReply =
        "Hi! I'm Ask Rahat. It looks like I'm having trouble connecting to my brain right now. Please check back soon or explore the portfolio directly!";
    } else {
      try {
        const contents = [
          {
            role: 'user',
            parts: [
              { text: `${SYSTEM_PROMPT}\n\nVisitor Message: ${dto.message}` },
            ],
          },
        ];

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
              },
            }),
          },
        );

        if (!response.ok) {
          const errText = await response.text();
          this.logger.error(`Gemini API Error: ${errText}`);
          assistantReply =
            "Hi! I'm Ask Rahat. I couldn't process that right now, but feel free to explore the portfolio or email Rahat!";
        } else {
          interface GeminiResponse {
            candidates?: Array<{
              content?: {
                parts?: Array<{ text?: string }>;
              };
            }>;
          }
          const data = (await response.json()) as GeminiResponse;
          assistantReply =
            data.candidates?.[0]?.content?.parts?.[0]?.text ??
            "I'm sorry, I couldn't generate a response. Please try again!";
        }
      } catch (error) {
        this.logger.error('Gemini API fetch error', error);
        assistantReply =
          "Hi! I'm Ask Rahat. It looks like I'm having trouble connecting to my brain right now. Please check back soon or explore the portfolio directly!";
      }
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
