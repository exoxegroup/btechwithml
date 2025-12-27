// Test import to verify the useAnalytics hook can be imported
try {
  const { useAnalytics } = require('./src/hooks/useAnalytics.ts');
  console.log('Named import successful');
} catch (e) {
  console.log('Named import failed:', e.message);
}

try {
  const useAnalytics = require('./src/hooks/useAnalytics.ts').default;
  console.log('Default import successful');
} catch (e) {
  console.log('Default import failed:', e.message);
}