# Phase 4.3 Verification (Local) - Analytics Testing Guide

## Overview

This document provides step-by-step procedures for testing the analytics functionality of the biolearn-ml application. The testing focuses on validating the group performance tracking, AI algorithm insights, and data export features through simulated student interactions.

## Test Objectives

1. **High Performers**: Students who answer all 3 questions correctly (Pretest, Posttest, Retention)
2. **Mid Performers**: Students who answer 2 out of 3 questions correctly
3. **Low Performers**: Students who answer 1 or 0 questions correctly
4. **Analytics Validation**: Verify that the dashboard correctly reflects performance patterns

## Prerequisites

- Application running locally (`npm run dev` in frontend directory)
- Backend API server running (`npm run dev` in backend directory)
- Database seeded with test data
- At least one test class created
- Analytics dashboard accessible at `http://localhost:3000/class/{classId}/analytics`

## Test Questions and Answers

### Pretest Questions (Before Class)

**Question 1:** What is the primary function of DNA in living organisms?
- A) Energy production
- B) Genetic information storage ✅
- C) Protein synthesis
- D) Cell division

**Question 2:** Which cellular structure is responsible for protein synthesis?
- A) Nucleus
- B) Mitochondria
- C) Ribosome ✅
- D) Cell membrane

**Question 3:** What is the process by which cells divide to produce two identical daughter cells?
- A) Meiosis
- B) Mitosis ✅
- C) Fertilization
- D) Mutation

### Posttest Questions (After Class - More Difficult)

**Question 1:** Explain the role of mRNA in protein synthesis, including its interaction with ribosomes and tRNA.
- **Answer:** mRNA carries genetic information from DNA to ribosomes, where it serves as a template for protein synthesis. Ribosomes read the mRNA sequence in codons (3-base units), and tRNA molecules bring specific amino acids that correspond to each codon, forming a polypeptide chain. ✅

**Question 2:** Describe the difference between transcription and translation, including where each process occurs in the cell.
- **Answer:** Transcription occurs in the nucleus where DNA is transcribed into mRNA. Translation occurs in the cytoplasm at ribosomes where mRNA is translated into proteins. Transcription produces RNA from DNA, while translation produces proteins from RNA. ✅

**Question 3:** How does the cell ensure accurate DNA replication, and what happens when errors occur?
- **Answer:** DNA polymerase proofreads during replication, removing incorrect bases. Mismatch repair enzymes fix errors that escape proofreading. If errors persist, they become mutations, which can be silent, beneficial, or harmful. The cell has multiple checkpoints to prevent replication of damaged DNA. ✅

### Retention Test Questions (1 Week Later)

**Question 1:** What are the three main types of RNA and their functions?
- A) mRNA (messenger), tRNA (transfer), rRNA (ribosomal) ✅
- B) DNA, RNA, mRNA
- C) Codon, Anticodon, Exon
- D) Promoter, Enhancer, Silencer

**Question 2:** During which phase of the cell cycle does DNA replication occur?
- A) G1 phase
- B) S phase ✅
- C) G2 phase
- D) M phase

**Question 3:** What is the central dogma of molecular biology?
- A) DNA → RNA → Protein ✅
- B) Protein → RNA → DNA
- C) RNA → DNA → Protein
- D) DNA → Protein → RNA

## Testing Procedure

### Step 1: Create Test Students

Create 6 test students to represent different performance levels:

```bash
# High Performers (3 students)
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@test.com", "classId": "your-class-id"}'

curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Smith", "email": "bob@test.com", "classId": "your-class-id"}'

curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Carol Davis", "email": "carol@test.com", "classId": "your-class-id"}'

# Mid Performers (2 students)
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "David Wilson", "email": "david@test.com", "classId": "your-class-id"}'

curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Eva Brown", "email": "eva@test.com", "classId": "your-class-id"}'

# Low Performers (1 student)
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Frank Miller", "email": "frank@test.com", "classId": "your-class-id"}'
```

### Step 2: Simulate Pretest (Before Class)

**High Performers** (Answer all 3 correctly):
```javascript
// Alice, Bob, Carol - All correct
const pretestHigh = {
  studentId: "alice-id",
  answers: ["B", "C", "B"], // All correct
  score: 3,
  timestamp: new Date().toISOString()
};
```

**Mid Performers** (Answer 2 correctly):
```javascript
// David - 2 correct, Eva - 2 correct
const pretestMid = {
  studentId: "david-id", 
  answers: ["B", "A", "B"], // Q1, Q3 correct
  score: 2,
  timestamp: new Date().toISOString()
};
```

**Low Performers** (Answer 1 or 0 correctly):
```javascript
// Frank - 1 correct
const pretestLow = {
  studentId: "frank-id",
  answers: ["A", "A", "B"], // Only Q3 correct
  score: 1,
  timestamp: new Date().toISOString()
};
```

### Step 3: Posttest Challenge (Teacher Must End Class First)

#### Workaround for Posttest Testing

Since the posttest requires the teacher to end the class first, use this testing approach:

**Option A: Direct API Testing (Recommended)**
```javascript
// Simulate posttest results directly via API
const simulatePosttest = async (studentId, answers, score) => {
  await fetch('/api/analytics/posttest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId,
      answers,
      score,
      timestamp: new Date().toISOString(),
      classEnded: true // Simulate class ended state
    })
  });
};

// High Performers - Posttest (All correct, but more difficult)
await simulatePosttest("alice-id", ["Correct", "Correct", "Correct"], 3);
await simulatePosttest("bob-id", ["Correct", "Correct", "Correct"], 3);
await simulatePosttest("carol-id", ["Correct", "Correct", "Correct"], 3);

// Mid Performers - Posttest (2 correct)
await simulatePosttest("david-id", ["Correct", "Incorrect", "Correct"], 2);
await simulatePosttest("eva-id", ["Correct", "Correct", "Incorrect"], 2);

// Low Performers - Posttest (1 or 0 correct)
await simulatePosttest("frank-id", ["Incorrect", "Incorrect", "Correct"], 1);
```

**Option B: Manual Class End Simulation**
1. Log in as teacher
2. Navigate to class management
3. Click "End Class" button
4. Immediately proceed with posttest for all students
5. Use the provided posttest questions above

### Step 4: Retention Test (1 Week Later Simulation)

Use the same testing approach as posttest, but with retention test questions:

```javascript
// Simulate 1-week delay
const retentionDelay = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const retentionTimestamp = new Date(Date.now() + retentionDelay).toISOString();

// Retention test results (same pattern as posttest)
await simulateRetention("alice-id", ["A", "B", "A"], 3); // High performer
await simulateRetention("david-id", ["A", "B", "C"], 2); // Mid performer
await simulateRetention("frank-id", ["B", "A", "D"], 0); // Low performer
```

### Step 5: Verify Analytics Dashboard

1. **Navigate to Analytics Dashboard**
   ```
   http://localhost:3000/class/{your-class-id}/analytics
   ```

2. **Check Performance Metrics**
   - Total Groups: Should show group formation based on performance
   - Average Performance: Should reflect the 3-tier performance pattern
   - AI-Generated Groups: Should show groups created by AI algorithm

3. **Verify Group Formation**
   ```javascript
   // Expected group structure:
   // Group 1: High Performers (Alice, Bob, Carol)
   // Group 2: Mid Performers (David, Eva) + 1 High Performer
   // Group 3: Mixed group with Low Performer (Frank) + support students
   ```

4. **Validate AI Insights**
   - Algorithm effectiveness should be > 80%
   - Gender balance should be optimal
   - Performance distribution should show 3 distinct tiers

### Step 6: Test Data Export

1. **Export Test Data**
   ```javascript
   // Test CSV export
   await exportResearchData(classId, {
     format: 'csv',
     anonymize: false,
     includeGenderData: true
   }, token);

   // Test JSON export
   await exportResearchData(classId, {
     format: 'json', 
     anonymize: true,
     includeGenderData: false
   }, token);
   ```

2. **Verify Export Content**
   - CSV should contain student performance data
   - JSON should include analytics metadata
   - Anonymized data should not contain personal identifiers

### Step 7: Real-time Updates Test

1. **Monitor Live Updates**
   ```javascript
   // Subscribe to analytics updates
   const subscription = subscribeToAnalyticsUpdates(classId, (update) => {
     console.log('Real-time update:', update);
     // Should show group formation updates
     // Should show performance metric changes
   });
   ```

2. **Trigger Updates**
   - Submit new test answers
   - Modify student performance data
   - Verify dashboard updates in real-time

## Expected Results

### Analytics Dashboard Should Show:

1. **Performance Distribution**
   - High Performers: 50% (3/6 students)
   - Mid Performers: 33% (2/6 students)  
   - Low Performers: 17% (1/6 students)

2. **Group Analytics**
   - Average group performance score
   - Gender balance metrics
   - Improvement rates between tests
   - AI algorithm effectiveness > 80%

3. **Engagement Metrics**
   - Student participation rates
   - Time spent on activities
   - Interaction patterns

### Export Data Should Include:

- Student performance scores (pre, post, retention)
- Group formation details
- AI algorithm recommendations
- Timeline of activities
- Gender distribution analysis

## Troubleshooting

### Common Issues

1. **Posttest Not Accessible**
   - Ensure class is marked as ended
   - Check API endpoints are responding
   - Verify student IDs are correct

2. **Analytics Not Updating**
   - Refresh dashboard manually
   - Check WebSocket connections
   - Verify API response format

3. **Export Fails**
   - Check authentication token
   - Verify class ID exists
   - Ensure proper export options

### Debug Commands

```bash
# Check API health
curl http://localhost:3001/api/health

# Verify student data
curl http://localhost:3001/api/students/{studentId}/performance

# Check analytics data
curl http://localhost:3001/api/analytics/class/{classId} \
  -H "Authorization: Bearer {token}"
```

## Success Criteria

✅ **Analytics Dashboard**
- [ ] Shows 3-tier performance distribution
- [ ] Displays real-time updates
- [ ] Shows AI algorithm effectiveness > 80%
- [ ] Exports data in CSV/JSON formats

✅ **Group Performance**
- [ ] High performers grouped together
- [ ] Balanced gender distribution
- [ ] AI-generated groups show improvement
- [ ] Retention test results tracked

✅ **Data Integrity**
- [ ] All test scores recorded accurately
- [ ] Timeline of tests maintained
- [ ] Student performance categorized correctly
- [ ] Export data matches dashboard display

## Next Steps

After successful local testing:

1. **Deploy to staging environment**
2. **Conduct user acceptance testing**
3. **Performance testing with larger datasets**
4. **Security testing of export functionality**
5. **Documentation for end users**

---

*Document Version: 1.0*
*Last Updated: December 2025*
*Testing Phase: 4.3 Verification (Local)*