import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { ollamaService } from '../utils/ollama';

const prisma = new PrismaClient();

interface AIQueryRequest {
  prompt: string;
  context?: string;
  classId?: string;
  groupId?: string | number;
}

export const getAIResponse = async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, context, classId, groupId } = req.body as AIQueryRequest;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Build context for the AI
    let fullContext = '';
    
    // Add grouping context if classId is present
    if (classId) {
      try {
        // Fetch class level rationale
        const classData = await prisma.class.findUnique({
          where: { id: classId },
          select: { groupingRationale: true }
        });

        if (classData?.groupingRationale) {
           fullContext += `Class Grouping Strategy: ${classData.groupingRationale}\n\n`;
        }

        // Fetch student specific rationale if user is a student
        if (req.user?.role === 'STUDENT') {
          const enrollment = await prisma.studentEnrollment.findUnique({
            where: {
              classId_studentId: {
                classId,
                studentId: req.user.id
              }
            },
            select: { groupingRationale: true, groupNumber: true }
          });

          if (enrollment?.groupingRationale) {
            fullContext += `Student's Group Rationale: ${enrollment.groupingRationale}\n`;
            if (enrollment.groupNumber) {
              fullContext += `Note: The user is in Group ${enrollment.groupNumber}.\n`;
            }
            fullContext += `\n`;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch grouping rationale for AI context:', err);
      }
    }

    if (context) {
      fullContext += `Context: ${context}\n\n`;
    }
    
    // Add user role context using authenticated user
    const userRole = req.user!.role.toLowerCase();
    fullContext += `User is a ${userRole} in this educational platform. `;
    
    // Add educational focus
    fullContext += `Please provide helpful, educational responses appropriate for a classroom setting. `;
    fullContext += `Keep responses concise and focused on the topic.\n\n`;
    fullContext += `User query: ${prompt}`;

    const response = await ollamaService.generate(fullContext, {
      temperature: 0.7,
      num_predict: 1000
    });

    if (!response) {
      return res.status(500).json({ error: 'I could not generate a response. Please try again.' });
    }

    // Log the AI interaction for analytics
    try {
      await prisma.chatMessage.create({
        data: {
          classId: req.body.classId || 'global',
          groupId: req.body.groupId || null,
          senderId: req.user!.id,
          text: prompt,
          isAI: true,
          timestamp: new Date()
        }
      });
    } catch (logError) {
      console.error('Error logging AI interaction:', logError);
    }

    res.json({ response });
  } catch (error) {
    console.error('AI API Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('Authorization')) {
        return res.status(500).json({ error: 'AI service configuration error' });
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return res.status(429).json({ error: 'AI service quota exceeded' });
      }
    }
    
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
};
