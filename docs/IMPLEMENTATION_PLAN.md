# Implementation Plan: BioLearn AI Machine Learning Extensions

This document outlines the step-by-step plan to integrate machine learning grouping, retention testing, and enhanced analytics into the BioLearn AI platform.

## PRD Traceability
- **Research Objective 1**: *Examine AI platform's effect on knowledge retention* → **Phase 2**
- **Research Objective 2**: *Analyze gender influence on academic achievement* → **Phase 4**
- **Research Objective 3**: *Compare engagement levels by gender* → **Phase 3**

## Phase 1: Database & Backend Foundation [COMPLETED]
**Goal:** Update the data model to support Retention Tests and AI Grouping rationale.

## Phase 2: Retention Test Feature [COMPLETED]
**Goal:** Allow teachers to create retention tests and students to take them.

## Phase 3: AI-Driven Grouping [COMPLETED]
**Goal:** Use Gemini to automatically group students based on Pretest scores.

## Phase 4: Enhanced Analytics & Reporting [COMPLETED]
**Goal:** Visualize the impact of AI grouping and compare Pre/Post/Retention scores.

### 4.1 Backend Aggregation [COMPLETED]
- Update `getClassAnalytics` to return Retention scores, Rationale, and Gender stats.

### 4.2 Frontend Visualization [COMPLETED]
- Add Retention Column, Rationale Display, and Comparative Charts.

### 4.3 Analytics Refinements [COMPLETED]
**Goal:** Optimize dashboard for researcher use-cases.
- **Frontend Updates (`PerformanceAnalyticsPage.tsx`):**
    - **Remove Real-time:** Disable auto-refresh.
    - **Simplify Tabs:** Remove "Historical", keep "Performance" and "Export".
    - **Export Tab:** Remove charts, show preview only on button click.
    - **Group Details:**
        - Ensure Group Name/Number is visible.
        - Add "View Details" button.
        - **Modal:** Show list of students with:
            - Name, Gender, Performance Category (High/Mid/Low).
            - Pretest, Posttest, Retention Scores.
            - Improvement Rate, Retention Rate.
            - Grouping Rationale.

## Phase 5: Final Polish & Documentation
**Goal:** UI cleanup and final documentation.
- Revamp Homepage.
- Code Cleanup.
- Create `TEACHER_MANUAL.md` and `STUDENT_MANUAL.md`.
