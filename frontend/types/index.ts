
export type UserRole = "TEACHER" | "STUDENT";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gender: Gender;
  studentId?: string;
  phone?: string;
  address?: string;
  isProfileComplete: boolean;
}

export interface ClassSummary {
  id: string;
  name: string;
  classCode: string;
  teacherName: string;
  studentCount: number;
  groupNumber?: number | null;
  isClassGrouped?: boolean;
}

export interface ClassDetails extends ClassSummary {
    status?: ClassroomStatus;
    classEndedAt?: string;
    postTestDelayMinutes?: number;
    retentionTestDelayMinutes?: number;
    materials: Material[];
    students: EnrolledStudent[];
    pretest: Quiz;
    posttest: Quiz;
    retentionTest?: Quiz;
    posttestUsesPretestQuestions: boolean;
    teacher: {
        id: string;
        name: string;
    };
}

export interface Material {
    id: string;
    type: 'pdf' | 'docx' | 'youtube';
    title: string;
    url: string;
}

export interface EnrolledStudent {
    id:string;
    name: string;
    studentId?: string;
    gender: Gender;
    pretestStatus: 'TAKEN' | 'NOT_TAKEN';
    pretestScore: number | null;
    posttestScore: number | null;
    retentionScore: number | null;
    groupNumber: number | null;
    groupingRationale: string | null;
}

export interface QuizQuestion {
    id: string;
    text: string;
    options: string[];
    correctAnswerIndex: number;
}

export interface Quiz {
    id: string;
    title: string;
    timeLimitMinutes: number;
    availableFrom?: string;
    questions: QuizQuestion[];
}

export interface GroupNote {
    id: string;
    groupId: number;
    content: string;
    lastUpdated: string;
}

export type ClassroomStatus = 'PRETEST' | 'WAITING_ROOM' | 'MAIN_SESSION' | 'GROUP_SESSION' | 'POSTTEST' | 'ENDED';

export type QuizType = 'PRETEST' | 'POSTTEST' | 'RETENTION_TEST';

export interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  isAI: boolean;
  timestamp: string;
}
