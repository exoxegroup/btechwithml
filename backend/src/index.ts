import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import classRoutes from './routes/classRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import materialRoutes from './routes/materialRoutes';
import quizRoutes from './routes/quizRoutes';
import groupRoutes from './routes/groupRoutes';
import aiRoutes from './routes/aiRoutes';
import aiTestRoutes from './routes/ai-test-routes';
import chatRoutes from './routes/chatRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import aiGroupingRoutes from './routes/aiGroupingRoutes';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'https://biolearn.onrender.com', 
  'https://btechwithml.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  next();
});

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Presence tracking
const onlineUsers = new Map<string, Set<string>>(); // classId -> Set of userIds
const socketUserMap = new Map<string, { classId: string; userId: string }>();

// Socket.io connection handling
io.on('connection', (socket) => {
  // Join class or group room
  socket.on('join_room', (data: { classId: string; groupId?: number; userId?: string }) => {
    const { classId, groupId, userId } = data;
    if (groupId) {
      const roomName = `group_${classId}_${groupId}`;
      socket.join(roomName);
    } else {
      const roomName = `class_${classId}`;
      socket.join(roomName);
    }
    
    // Track online users
    if (userId && classId) {
      if (!onlineUsers.has(classId)) {
        onlineUsers.set(classId, new Set());
      }
      onlineUsers.get(classId)!.add(userId);
      socketUserMap.set(socket.id, { classId, userId });
      
      // Broadcast updated online users list
      const onlineUserIds = Array.from(onlineUsers.get(classId)!);
      io.to(`class_${classId}`).emit('users:online', { onlineUsers: onlineUserIds });
    }
  });

  // Handle note updates for shared notes
  socket.on('note:update', async (data: {
    classId: string;
    groupId: number;
    content: string;
    userId: string;
  }) => {
    try {
      const { classId, groupId, content, userId } = data;
      
      // Save the note content to the database
      const updatedNote = await prisma.groupNote.upsert({
        where: {
          classId_groupId: {
            classId: classId,
            groupId: groupId
          }
        },
        update: {
          content: content,
          updatedAt: new Date()
        },
        create: {
          classId: classId,
          groupId: groupId,
          content: content
        }
      });

      // Broadcast the updated content to all members in the group
      const roomName = `group_${classId}_${groupId}`;
      socket.to(roomName).emit('note:updated', {
        content: updatedNote.content,
        updatedAt: updatedNote.updatedAt,
        updatedBy: userId
      });
    } catch (error) {
      console.error('Error updating note:', error);
      socket.emit('note:error', { error: 'Failed to update note' });
    }
  });

  // Handle chat messages
  socket.on('chat:message', async (data: {
    classId: string;
    groupId?: number;
    message: string;
    userId: string;
    userName: string;
  }) => {
    try {
      const { classId, groupId, message, userId, userName } = data;
      
      if (!message || !message.trim()) {
        socket.emit('chat:error', { error: 'Message cannot be empty' });
        return;
      }

      // Save message to database
      const savedMessage = await prisma.chatMessage.create({
        data: {
          classId,
          groupId: groupId || null,
          senderId: userId,
          text: message,
          isAI: false,
          timestamp: new Date()
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });

      // Determine room name for broadcasting
      const roomName = groupId ? `group_${classId}_${groupId}` : `class_${classId}`;
      
      // Broadcast message to all users in the room
      io.to(roomName).emit('chat:message:received', {
        id: savedMessage.id,
        text: savedMessage.text,
        timestamp: savedMessage.timestamp,
        sender: {
          id: savedMessage.sender.id,
          name: savedMessage.sender.name,
          role: savedMessage.sender.role
        },
        classId: savedMessage.classId,
        groupId: savedMessage.groupId
      });
    } catch (error) {
      console.error('Error sending chat message:', error);
      socket.emit('chat:error', { error: 'Failed to send message' });
    }
  });

  // Handle chat history request
  socket.on('chat:history', async (data: {
    classId: string;
    groupId?: number;
    limit?: number;
  }) => {
    try {
      const { classId, groupId, limit = 50 } = data;
      
      const messages = await prisma.chatMessage.findMany({
        where: {
          classId,
          groupId: groupId || null
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'asc'
        },
        take: limit
      });

      socket.emit('chat:history:loaded', messages);
    } catch (error) {
      console.error('Error loading chat history:', error);
      socket.emit('chat:error', { error: 'Failed to load chat history' });
    }
  });

  // Handle typing indicators
  socket.on('chat:typing', (data: {
    classId: string;
    groupId?: number;
    userName: string;
    isTyping: boolean;
  }) => {
    const { classId, groupId, userName, isTyping } = data;
    const roomName = groupId ? `group_${classId}_${groupId}` : `class_${classId}`;
    
    socket.to(roomName).emit('chat:typing:indicator', {
      userName,
      isTyping
    });
  });



  // Handle teacher controls
  socket.on('teacher:start-class', async (data: { classId: string }) => {
    try {
      const { classId } = data;
      if (!classId) throw new Error("Class ID is missing");
      
      // Update class status in database
      await prisma.class.update({
        where: { id: classId },
        data: { status: 'MAIN_SESSION' }
      });

      // Broadcast state change to all users in the class
      io.to(`class_${classId}`).emit('class:state-changed', { 
        status: 'MAIN_SESSION',
        message: 'Class has started' 
      });
    } catch (error) {
      console.error('Error starting class:', error);
      socket.emit('teacher:error', { error: `Failed to start class: ${(error as Error).message}` });
    }
  });

  socket.on('teacher:activate-groups', async (data: { classId: string }) => {
    try {
      const { classId } = data;
      if (!classId) throw new Error("Class ID is missing");
      
      // Update class status in database
      await prisma.class.update({
        where: { id: classId },
        data: { status: 'GROUP_SESSION' }
      });

      // Broadcast state change to all users in the class
      io.to(`class_${classId}`).emit('class:state-changed', { 
        status: 'GROUP_SESSION',
        message: 'Group session activated' 
      });
    } catch (error) {
      console.error('Error activating groups:', error);
      socket.emit('teacher:error', { error: `Failed to activate groups: ${(error as Error).message}` });
    }
  });

  socket.on('teacher:end-class', async (data: { classId: string, retentionDelayMinutes?: number }) => {
    try {
      const { classId, retentionDelayMinutes } = data;
      if (!classId) throw new Error("Class ID is missing");
      
      // Update class status in database
      await prisma.class.update({
        where: { id: classId },
        data: { 
          status: 'POSTTEST',
          classEndedAt: new Date(),
          retentionTestDelayMinutes: retentionDelayMinutes
        }
      });

      // Broadcast state change to all users in the class
      io.to(`class_${classId}`).emit('class:state-changed', { 
        status: 'POSTTEST',
        message: 'Class ended - post-test available',
        classEndedAt: new Date(),
        retentionDelayMinutes
      });
    } catch (error) {
      console.error('Error ending class:', error);
      socket.emit('teacher:error', { error: `Failed to end class: ${(error as Error).message}` });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove user from online users tracking
    const userData = socketUserMap.get(socket.id);
    if (userData) {
      const { classId, userId } = userData;
      
      if (onlineUsers.has(classId)) {
        onlineUsers.get(classId)!.delete(userId);
        
        // Broadcast updated online users list
        const onlineUserIds = Array.from(onlineUsers.get(classId)!);
        io.to(`class_${classId}`).emit('users:online', { onlineUsers: onlineUserIds });
      }
      
      socketUserMap.delete(socket.id);
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
// Mount quiz routes BEFORE teacher-only routes to avoid middleware conflicts
app.use('/api', quizRoutes);                // Quiz routes at /api (they already include /classes/:classId/quiz)
// Register teacher-only routes with specific prefixes to avoid interference
app.use('/api', groupRoutes);        // Group routes under /api (includes /classes and /groups)
app.use('/api', aiGroupingRoutes);  // AI grouping routes at /api (they already include /classes/:classId)
app.use('/api/ai-tests', aiTestRoutes);     // AI test routes under /api/ai-tests

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.BACKEND_PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔄 Socket.io server ready`);
});

server.on('error', (err) => {
  console.error('Server listen error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});