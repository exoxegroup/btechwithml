# BioLearn AI - Phase 3: AI-Driven Grouping Algorithm TODO

## Overview
This document tracks the active development tasks for Phase 3 of the BioLearn AI enhancement project, focusing on implementing machine learning-powered student grouping with gender balance and mixed-ability optimization.

## Phase 3: AI-Driven Grouping Algorithm [ACTIVE]
**Status**: In Progress 🔄  
**Started**: 2025-12-12 12:00 UTC  
**Expected Completion**: 2025-12-12 16:00 UTC  
**Duration**: 4 hours

## Active Tasks

### AI Algorithm Development
- [ ] **Create Gemini-Powered Grouping Algorithm**
  - [ ] Implement student performance analysis (pretest + posttest scores)
  - [ ] Add gender balance optimization logic
  - [ ] Create mixed-ability grouping strategy
  - [ ] Generate AI rationale for grouping decisions
  - **Files**: `backend/src/services/aiGroupingService.ts`
  - **PRD Reference**: Section 3.1 - AI-Driven Grouping Algorithm

- [ ] **Implement Grouping Constraints**
  - [ ] Set optimal group size (4-6 students per group)
  - [ ] Balance high/medium/low performing students
  - [ ] Ensure gender representation in each group
  - [ ] Handle edge cases (insufficient students, single gender)
  - **Files**: `backend/src/utils/groupingConstraints.ts`

### Backend API Development
- [ ] **Create AI Grouping API Endpoints**
  - [ ] POST /api/classes/{classId}/ai-grouping - Generate AI groups
  - [ ] GET /api/classes/{classId}/grouping-rationale - Get AI explanations
  - [ ] PUT /api/classes/{classId}/groups - Apply/override AI groups
  - [ ] GET /api/classes/{classId}/group-analytics - Group performance data
  - **Files**: `backend/src/controllers/aiGroupingController.ts`
  - **PRD Reference**: Section 3.2 - Grouping API Integration

- [ ] **Update Class Controller for Grouping**
  - [ ] Add AI grouping trigger functionality
  - [ ] Implement grouping rationale storage
  - [ ] Create group assignment persistence
  - [ ] Add teacher override capabilities
  - **Files**: `backend/src/controllers/ClassController.ts`

### Frontend UI Development
- [ ] **Create AI Grouping Dashboard**
  - [ ] Design AI grouping control panel
  - [ ] Add "Generate AI Groups" button with loading states
  - [ ] Display grouping rationale and explanations
  - [ ] Show group composition analytics
  - **Files**: `frontend/src/components/teacher/AIGroupingDashboard.tsx`
  - **PRD Reference**: Section 3.3 - Teacher Interface

- [ ] **Implement Group Visualization**
  - [ ] Create interactive group display component
  - [ ] Show student performance levels in each group
  - [ ] Display gender distribution charts
  - [ ] Add drag-and-drop for manual adjustments
  - **Files**: `frontend/src/components/teacher/GroupVisualization.tsx`

- [ ] **Add Grouping Confirmation Workflow**
  - [ ] Create grouping preview modal
  - [ ] Add teacher confirmation step
  - [ ] Implement grouping rationale display
  - [ ] Add "Apply Groups" and "Regenerate" options
  - **Files**: `frontend/src/components/teacher/GroupingConfirmationModal.tsx`

### Database Schema Updates
- [ ] **Update Prisma Schema for Grouping**
  - [ ] Add AI grouping rationale field to Class model
  - [ ] Create Group model with student assignments
  - [ ] Add grouping metadata (timestamp, algorithm version)
  - [ ] Create grouping history tracking
  - **Files**: `backend/prisma/schema.prisma`
  - **PRD Reference**: Section 3.4 - Data Persistence

### Integration & Testing
- [ ] **Create AI Service Integration**
  - [ ] Implement Gemini API calls for grouping logic
  - [ ] Add prompt engineering for optimal results
  - [ ] Create fallback logic for API failures
  - [ ] Add rate limiting and caching
  - **Files**: `backend/src/services/geminiService.ts`

- [ ] **Manual Testing Checklist**
  - [ ] Test AI grouping generation with various class sizes
  - [ ] Verify gender balance in generated groups
  - [ ] Test mixed-ability distribution accuracy
  - [ ] Validate teacher override functionality
  - [ ] Test grouping rationale clarity and usefulness
  - **Documentation**: `docs/testing/ai-grouping-manual.md`

## Technical Requirements

### AI Algorithm Requirements
- **Performance**: Group generation < 30 seconds for 30 students
- **Accuracy**: Gender balance within ±1 student per group
- **Balance**: Performance distribution across all groups
- **Scalability**: Handle classes from 8-50 students
- **Fallback**: Manual grouping option when AI fails

### UI/UX Requirements
- **Responsiveness**: Mobile and desktop compatibility
- **Loading States**: Clear feedback during AI processing
- **Error Handling**: Graceful failure messages
- **Accessibility**: WCAG 2.1 compliance
- **Intuitiveness**: Teachers can understand and override AI decisions

### Security Requirements
- **Authentication**: Protected API endpoints
- **Validation**: Input sanitization for all grouping parameters
- **Rate Limiting**: Prevent API abuse
- **Data Privacy**: Student performance data protection
- **Audit Trail**: Track all grouping decisions

## Dependencies
- **Phase 1**: Database schema and user management (COMPLETED ✅)
- **Phase 2**: Retention test data for performance analysis (COMPLETED ✅)
- **External**: Google Gemini API for AI processing
- **Internal**: Existing class management and student enrollment systems

## Risk Mitigation
- **AI API Failures**: Implement fallback to manual grouping
- **Performance Issues**: Add caching and async processing
- **Bias Concerns**: Regular algorithm review and adjustment
- **Teacher Resistance**: Provide clear rationale and easy override
- **Data Quality**: Validate student performance data before grouping

## Success Criteria
- [ ] AI generates balanced groups within 30 seconds
- [ ] Gender balance achieved in 95% of groups
- [ ] Mixed-ability distribution across all groups
- [ ] Teacher satisfaction with grouping rationale
- [ ] Manual override functionality working correctly
- [ ] All API endpoints tested and secured
- [ ] UI/UX meets accessibility standards
- [ ] Documentation complete with usage instructions

## Next Phase Preparation
- Phase 4: Enhanced Analytics will use grouping data
- Ensure group performance tracking is implemented
- Prepare for group-based analytics and insights
- Plan for longitudinal group effectiveness studies

---

**Last Updated**: 2025-12-12 12:00 UTC  
**Next Review**: 2025-12-12 14:00 UTC  
**Owner**: Development Team