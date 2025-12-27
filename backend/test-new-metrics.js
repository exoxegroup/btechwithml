// Test script to verify the new improvement metrics calculation

const testStudent = {
  pretestScore: 75,
  posttestScore: 85,
  retentionScore: 100
};

function calculateNewMetrics(student) {
  const pre = student.pretestScore || 0;
  const post = student.posttestScore || 0;
  const ret = student.retentionScore || post;

  // Calculate the three new improvement metrics
  const immediateImprovement = pre > 0 ? ((post - pre) / pre) * 100 : 0;
  const sustainedImprovement = pre > 0 ? ((ret - pre) / pre) * 100 : 0;
  const retentionStability = post > 0 ? ((ret - post) / post) * 100 : 0;

  return {
    immediateImprovement,
    sustainedImprovement,
    retentionStability
  };
}

console.log('Testing new metrics calculation with sample data:');
console.log('Pre-test Score:', testStudent.pretestScore);
console.log('Post-test Score:', testStudent.posttestScore);
console.log('Retention Score:', testStudent.retentionScore);
console.log('');

const metrics = calculateNewMetrics(testStudent);

console.log('📊 New Improvement Metrics:');
console.log(`Immediate Improvement (Pre→Post): ${metrics.immediateImprovement.toFixed(2)}%`);
console.log(`Sustained Improvement (Pre→Retention): ${metrics.sustainedImprovement.toFixed(2)}%`);
console.log(`Retention Stability (Post→Retention): ${metrics.retentionStability.toFixed(2)}%`);
console.log('');

// Test with Hassan Iliyasu data (assuming similar pattern)
const hassanData = {
  pretestScore: 65,
  posttestScore: 80,
  retentionScore: 75
};

console.log('Testing with Hassan Iliyasu sample data:');
console.log('Pre-test Score:', hassanData.pretestScore);
console.log('Post-test Score:', hassanData.posttestScore);
console.log('Retention Score:', hassanData.retentionScore);
console.log('');

const hassanMetrics = calculateNewMetrics(hassanData);

console.log('📊 Hassan\'s Improvement Metrics:');
console.log(`Immediate Improvement (Pre→Post): ${hassanMetrics.immediateImprovement.toFixed(2)}%`);
console.log(`Sustained Improvement (Pre→Retention): ${hassanMetrics.sustainedImprovement.toFixed(2)}%`);
console.log(`Retention Stability (Post→Retention): ${hassanMetrics.retentionStability.toFixed(2)}%`);
console.log('');

// Test edge case with zero pre-test score
const edgeCase = {
  pretestScore: 0,
  posttestScore: 50,
  retentionScore: 45
};

console.log('Testing edge case (zero pre-test):');
const edgeMetrics = calculateNewMetrics(edgeCase);
console.log(`Immediate Improvement: ${edgeMetrics.immediateImprovement.toFixed(2)}%`);
console.log(`Sustained Improvement: ${edgeMetrics.sustainedImprovement.toFixed(2)}%`);
console.log(`Retention Stability: ${edgeMetrics.retentionStability.toFixed(2)}%`);