// import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
// import { TelegramService } from 'src/telegram/telegram.service';

// @Injectable()
// export class SessionService {
//   private readonly logger = new Logger(SessionService.name);
//   constructor(
//     @Inject(forwardRef(() => TelegramService))
//     private telegramService: TelegramService,
//   ) {
//     console.log('[SessionService] Initialized');
//   }
//   private sessions = new Map<
//     string,
//     {
//       userId: string;
//       lastActivity: Date;
//       currentNode: string;
//       timeoutRef: NodeJS.Timeout;
//       currentFlow: string;
//       botpressSessionId?: string;
//     }
//   >();

//   setBotpressSessionId(userId: string, botpressSessionId: string): void {
//     this.logger.log(
//       `Setting Botpress sessionId for user ${userId}: ${botpressSessionId}`,
//     );
//     const session = this.sessions.get(userId);
//     if (session) {
//       session.botpressSessionId = botpressSessionId;
//       this.sessions.set(userId, session);
//     } else {
//       this.logger.warn(
//         `Attempted to set Botpress sessionId for non-existent session: ${userId}`,
//       );
//     }
//   }

//   // Get Botpress sessionId
//   getBotpressSessionId(userId: string): string | undefined {
//     return this.sessions.get(userId)?.botpressSessionId;
//   }

//   trackActivity(
//     userId: string,
//     currentNode: string,
//     currentFlow: string = 'complete-loan-flow-telegram.flow.json',
//     botpressSessionId?: string,
//   ) {
//     console.log(
//       `[SessionService] Tracking activity for user ${userId} on node ${currentNode}`,
//     );
//     const now = new Date();

//     // Your existing implementation, but add preservation of botpressSessionId
//     const existingSession = this.sessions.get(userId);
//     const existingBotpressSessionId = existingSession?.botpressSessionId;

//     // Clear existing timeout
//     if (existingSession) {
//       clearTimeout(existingSession.timeoutRef);
//     }

//     // Set new timeout
//     const timeoutRef = setTimeout(() => {
//       this.handleInactivity(userId);
//     }, 30 * 1000);

//     console.log(
//       `[SessionService] Setting timeout for ${userId} - will fire in 30 seconds`,
//     );

//     this.sessions.set(userId, {
//       userId,
//       lastActivity: now,
//       currentNode,
//       currentFlow,
//       timeoutRef,
//       botpressSessionId: botpressSessionId || existingBotpressSessionId,
//     });

//     this.logger.log(
//       `Session state for ${userId}: ${JSON.stringify(this.sessions.get(userId))}`,
//     );

//     console.log(
//       `[SessionService] Session updated for ${userId}, total active sessions: ${this.sessions.size}`,
//     );
//   }

//   private async handleInactivity(userId: string) {
//     console.log(
//       `[${new Date().toISOString()}] Inactivity detected for user ${userId}`,
//     );
//     const session = this.sessions.get(userId);
//     if (!session) {
//       console.log(`No session found for user ${userId}`);
//       return;
//     }
//     console.log(
//       `[SessionService] Session removed for ${userId}, total active sessions: ${this.sessions.size}`,
//     );
//     try {
//       console.log(
//         'userId && session.currentNode && session.currentFlow parameters in sendFollowUpMessage',
//         userId,
//         session.currentNode,
//         session.currentFlow,
//         session.botpressSessionId,
//       );

//       await this.telegramService.sendFollowUpMessage(
//         userId,
//         session.currentNode,
//         session.currentFlow,
//         session.botpressSessionId,
//       );
//       console.log(`Follow-up prompt sent successfully to ${userId}`);
//     } catch (error) {
//       console.error(`Error sending follow-up to ${userId}:`, error);
//     }
//   }

//   getSession(userId: string) {
//     return this.sessions.get(userId);
//   }

//   clearSession(userId: string) {
//     const session = this.sessions.get(userId);
//     if (session?.timeoutRef) {
//       clearTimeout(session.timeoutRef);
//     }
//     this.sessions.delete(userId);
//     this.logger.log(`Session cleared for user ${userId}`);
//   }
// }
