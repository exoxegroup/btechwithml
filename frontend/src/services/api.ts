import { ClassSummary, Quiz, QuizType } from '../types';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Error handling helper
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'An unknown error occurred';
    
    try {
      const errorData = JSON.parse(errorText);
      // Handle both 'message' and 'error' fields from backend
      errorMessage = errorData.message || errorData.error || errorMessage;
       
       // If there's detailed information in the 'details' field, include it
       if (errorData.details && errorData.details.message) {
         errorMessage = errorData.details.message;
       }
    } catch (parseError) {
      errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
    }
    
    console.log('Final error message:', errorMessage);
    throw new Error(errorMessage);
  }
  
  console.log('Response ok, parsing JSON...');
  const data = await response.json();
  console.log('Parsed data:', data);
  return data;
};

// AI Grouping Interfaces
export interface AIGroup {
  id?: string;
  name: string;
  groupName?: string;
  studentIds: string[];
  averageScore?: number;
  genderBalance?: number;
}

export interface AIGroupingResult {
  success: boolean;
  groupingId: string;
  groups: AIGroup[];
  rationale: string;
  totalStudents: number;
  genderBalance?: {
    balancedGroups: number;
    totalGroups: number;
  };
  algorithmVersion?: string;
  message?: string;
}

// Group Assignment Interface
export interface GroupAssignment {
  studentId: string;
  groupNumber: number | null;
}

// Generate AI-powered groups
export const generateAIGroups = async (classId: string, token: string, groupCount?: number): Promise<AIGroupingResult> => {
  console.log('Making AI grouping request to:', `${API_URL}/classes/${classId}/ai-grouping`);
  console.log('Token:', token ? 'Present' : 'Missing');
  console.log('Requested Group Count:', groupCount);
  
  try {
    const response = await fetch(`${API_URL}/classes/${classId}/ai-grouping`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupCount }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    return handleResponse(response);
  } catch (fetchError) {
    console.error('Fetch error:', fetchError);
    throw fetchError;
  }
};

// Generate manual groups for small classes (3-7 students)
export const generateManualGroups = async (classId: string, token: string): Promise<AIGroupingResult> => {
  const response = await fetch(`${API_URL}/classes/${classId}/manual-grouping`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
};

// Get AI-generated groups
export const getAIGroups = async (classId: string, token: string): Promise<AIGroup[]> => {
  const response = await fetch(`${API_URL}/classes/${classId}/ai-groups`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
};

// Get grouping rationale
export const getGroupingRationale = async (classId: string, groupingId: string, token: string): Promise<string> => {
  const response = await fetch(`${API_URL}/classes/${classId}/grouping-rationale/${groupingId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
};

// Assign students to groups (simple group assignment)
export const assignStudentsToGroups = async (classId: string, assignments: GroupAssignment[], token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/groups/classes/${classId}/groups`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ groupAssignments: assignments }),
  });
  return handleResponse(response);
};

// Get class details
export const getClassDetails = async (classId: string, token: string) => {
  const response = await fetch(`${API_URL}/classes/${classId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    cache: 'no-store'
  });
  return handleResponse(response);
};

// Get teacher's classes
export const getTeacherClasses = async (token: string): Promise<ClassSummary[]> => {
  console.log('getTeacherClasses: API_URL being used:', API_URL);
  console.log('getTeacherClasses: Making request to:', `${API_URL}/classes`);
  console.log('getTeacherClasses: Token:', token.substring(0, 20) + '...');
  
  try {
    const response = await fetch(`${API_URL}/classes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('getTeacherClasses: Response status:', response.status);
    console.log('getTeacherClasses: Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('getTeacherClasses: Error response:', errorText);
      throw new Error(`Failed to fetch classes: ${response.status} ${errorText}`);
    }
    
    const classes = await handleResponse(response);
    console.log('getTeacherClasses: Raw classes data:', classes);
    
    const mappedClasses = classes.map((cls: any) => ({
      id: cls.id,
      name: cls.name,
      classCode: cls.classCode,
      teacherName: '', // Derive or fetch as needed
      studentCount: cls.studentCount || 0,
    }));
    
    console.log('getTeacherClasses: Mapped classes:', mappedClasses);
    return mappedClasses;
  } catch (error) {
    console.error('getTeacherClasses: Network/parse error:', error);
    console.error('getTeacherClasses: Error details:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

// Create a new class
export const createClass = async (className: string, token: string): Promise<ClassSummary> => {
  const response = await fetch(`${API_URL}/classes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name: className }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create class');
  }
  
  const newClass = await response.json();
  return {
    id: newClass.id,
    name: newClass.name,
    classCode: newClass.classCode,
    teacherName: '', // We'll fetch this if needed, or derive from current user
    studentCount: 0,
  };
};

// Update a class
export const updateClass = async (classId: string, name?: string, retentionTestDelayMinutes?: number, postTestDelayMinutes?: number, token: string): Promise<ClassSummary> => {
  const body: any = {};
  if (name !== undefined) body.name = name;
  if (retentionTestDelayMinutes !== undefined) body.retentionTestDelayMinutes = retentionTestDelayMinutes;
  if (postTestDelayMinutes !== undefined) body.postTestDelayMinutes = postTestDelayMinutes;

  const response = await fetch(`${API_URL}/classes/${classId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update class name');
  }
  
  const updatedClass = await response.json();
  return {
    id: updatedClass.id,
    name: updatedClass.name,
    classCode: updatedClass.classCode,
    teacherName: '',
    studentCount: updatedClass.studentCount || 0,
  };
};

// Get quiz details
export const getQuiz = async (classId: string, type: QuizType, token: string): Promise<Quiz | null> => {
  try {
    const response = await fetch(`${API_URL}/classes/${classId}/quiz?type=${type}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // If 404, it might just mean no quiz exists yet, which is fine
    if (response.status === 404) return null;
    
    return handleResponse(response);
  } catch (error) {
    console.warn(`Failed to fetch ${type} quiz:`, error);
    return null;
  }
};

// Submit any quiz
export const submitQuiz = async (classId: string, answers: number[], quizType: QuizType, token: string) => {
  const response = await fetch(`${API_URL}/classes/${classId}/quiz/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ classId, answers, quizType }),
  });
  return handleResponse(response);
};

// Helper aliases for specific quiz types
export const submitPretest = async (classId: string, answers: number[], token: string) => {
  return submitQuiz(classId, answers, 'PRETEST', token);
};

export const submitPosttest = async (classId: string, answers: number[], token: string) => {
  return submitQuiz(classId, answers, 'POSTTEST', token);
};

export const getRetentionTest = async (classId: string, token: string) => {
  return getQuiz(classId, 'RETENTION', token);
};

export const submitRetentionTest = async (classId: string, answers: number[], token: string) => {
  return submitQuiz(classId, answers, 'RETENTION', token);
};
