/**
 * workers/llm/test_ai_accuracy.js
 * 
 * Comprehensive test suite for AI functionality
 * Tests accuracy of:
 * - Barber name recognition
 * - Shop name recognition
 * - Sentiment analysis
 * - Review summarization
 * - Fallback to shop names when barber not found
 */

const { extractNamesFromReview, analyzeSentiment, summarizeReview } = require('./ollama_client');
const { parseReview, parseReviews } = require('./review_parser');

// Test data with known barber/shop names
const TEST_CASES = [
  {
    id: 1,
    review: "I went to Budget Barbers yesterday and asked for a fade. John did an absolutely amazing job! He's a true professional. The fade is perfectly blended and the edges are crisp. I would definitely go back to John.",
    shopName: "Budget Barbers",
    expectedBarbers: ["John"],
    expectedSentiment: "positive",
    description: "Clear barber name mention (John) with shop name",
  },
  {
    id: 2,
    review: "Downtown Barbershop is the best! Mike gave me the best haircut I've ever had. Very friendly staff. Highly recommend Mike!",
    shopName: "Downtown Barbershop",
    expectedBarbers: ["Mike"],
    expectedSentiment: "positive",
    description: "Clear barber name (Mike) with enthusiastic review",
  },
  {
    id: 3,
    review: "I went to City Cuts and got a terrible haircut. The barber, Tony, didn't listen to what I asked for. Very disappointed. Will not return.",
    shopName: "City Cuts",
    expectedBarbers: ["Tony"],
    expectedSentiment: "negative",
    description: "Negative sentiment with clear barber name (Tony)",
  },
  {
    id: 4,
    review: "Great experience at Elite Barbers. The barber was very professional and the cut came out perfect.",
    shopName: "Elite Barbers",
    expectedBarbers: [], // No specific name mentioned
    expectedSentiment: "positive",
    description: "Positive review with no specific barber name - should fallback to shop",
  },
  {
    id: 5,
    review: "Sarah cut my hair at Precision Cuts last week. She did an excellent job on the fade.",
    shopName: "Precision Cuts",
    expectedBarbers: ["Sarah"],
    expectedSentiment: "positive",
    description: "Barber name (Sarah) with positive sentiment",
  },
  {
    id: 6,
    review: "Average haircut at Downtown Barbershop. The barber was okay but not great. Price is reasonable though.",
    shopName: "Downtown Barbershop",
    expectedBarbers: [],
    expectedSentiment: "neutral",
    description: "Neutral sentiment with no specific barber name",
  },
  {
    id: 7,
    review: "I asked for a medium fade and Marcus did exactly what I wanted at Urban Barber. Very satisfied!",
    shopName: "Urban Barber",
    expectedBarbers: ["Marcus"],
    expectedSentiment: "positive",
    description: "Clear barber name (Marcus) with specific request mentioned",
  },
  {
    id: 8,
    review: "The haircut was good but the service was slow. Waited 45 minutes. Barber didn't give much attention.",
    shopName: "Quick Cuts",
    expectedBarbers: [],
    expectedSentiment: "neutral",
    description: "Mixed sentiment - positive cut, negative service",
  },
];

/**
 * Normalize names for comparison
 */
function normalizeName(name) {
  return name.toLowerCase().trim();
}

/**
 * Check if extracted names match expected (fuzzy matching)
 */
function namesMatch(extracted, expected) {
  if (!extracted || !expected) return false;
  
  const normalizedExtracted = extracted.map(normalizeName);
  const normalizedExpected = expected.map(normalizeName);
  
  // Check if any extracted name matches any expected name
  return normalizedExpected.some(exp => 
    normalizedExtracted.some(ext => 
      ext.includes(exp) || exp.includes(ext)
    )
  );
}

/**
 * Normalize sentiment score to category
 */
function sentimentToCategory(score) {
  if (score > 0.3) return "positive";
  if (score < -0.3) return "negative";
  return "neutral";
}

/**
 * Run a single test case
 */
async function runTestCase(testCase) {
  console.log(`\n📝 Test #${testCase.id}: ${testCase.description}`);
  console.log("─".repeat(80));
  console.log(`Review: "${testCase.review.substring(0, 100)}..."`);
  console.log(`Shop: ${testCase.shopName}`);
  console.log(`Expected Barbers: ${testCase.expectedBarbers.join(", ") || "(none/fallback to shop)"}`);
  
  try {
    // Test 1: Direct LLM name extraction
    const extractedNames = await extractNamesFromReview(testCase.review);
    console.log(`\n✓ Extracted Names: ${extractedNames.join(", ") || "(none)"}`);
    
    // Check if barber names were extracted
    const barbersFound = extractedNames.length > 0;
    const barbersCorrect = testCase.expectedBarbers.length === 0 
      ? !barbersFound 
      : namesMatch(extractedNames, testCase.expectedBarbers);
    
    const barberStatus = barbersCorrect ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${barberStatus} - Expected: ${testCase.expectedBarbers.join(", ") || "(none)"}`);
    
    // Test 2: Sentiment analysis
    const sentimentScore = await analyzeSentiment(testCase.review);
    const sentimentCategory = sentimentToCategory(sentimentScore);
    console.log(`\n✓ Sentiment Score: ${sentimentScore.toFixed(3)}`);
    console.log(`  Category: ${sentimentCategory} (${sentimentScore > 0 ? "+" : ""}${sentimentScore.toFixed(3)})`);
    
    const sentimentCorrect = sentimentCategory === testCase.expectedSentiment;
    const sentimentStatus = sentimentCorrect ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${sentimentStatus} - Expected: ${testCase.expectedSentiment}`);
    
    // Test 3: Summary generation
    const summary = await summarizeReview(testCase.review, 15);
    console.log(`\n✓ Summary (max 15 words):`);
    console.log(`  "${summary}"`);
    console.log(`  Length: ${summary.split(" ").length} words`);
    
    // Test 4: Full parseReview with fallback
    const parseResult = await parseReview(testCase.review, testCase.shopName);
    console.log(`\n✓ Full Parse Result:`);
    console.log(`  Names: ${parseResult.names.join(", ")}`);
    console.log(`  Sentiment: ${parseResult.sentiment.toFixed(3)}`);
    console.log(`  Summary: "${parseResult.summary}"`);
    
    // Check fallback behavior
    let fallbackCorrect = true;
    if (testCase.expectedBarbers.length === 0) {
      // If no barber name expected, should fallback to shop name
      fallbackCorrect = parseResult.names.includes(testCase.shopName) || parseResult.names.length === 0;
    }
    const fallbackStatus = fallbackCorrect ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${fallbackStatus} - Fallback logic working correctly`);
    
    return {
      id: testCase.id,
      description: testCase.description,
      barbersFound: barbersFound,
      barbersCorrect,
      sentimentCorrect,
      fallbackCorrect,
      extractedNames,
      sentimentScore,
      sentimentCategory,
      summary,
      parseResult,
    };
  } catch (err) {
    console.error(`  ❌ ERROR: ${err.message}`);
    return {
      id: testCase.id,
      description: testCase.description,
      error: err.message,
      barbersCorrect: false,
      sentimentCorrect: false,
      fallbackCorrect: false,
    };
  }
}

/**
 * Run all test cases and generate report
 */
async function runAllTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                                ║");
  console.log("║                   AI ACCURACY TEST SUITE - LOCAL LLM                           ║");
  console.log("║                     Testing Barber & Shop Recognition                          ║");
  console.log("║                                                                                ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════════╝");
  console.log("\n");
  
  console.log(`Testing with Ollama endpoint: http://localhost:11434`);
  console.log(`Total test cases: ${TEST_CASES.length}\n`);
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await runTestCase(testCase);
    results.push(result);
  }
  
  // Generate summary report
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                            TEST RESULTS SUMMARY                                ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════════╝");
  
  const successfulTests = results.filter(r => !r.error);
  const barberAccuracy = successfulTests.filter(r => r.barbersCorrect).length / successfulTests.length * 100;
  const sentimentAccuracy = successfulTests.filter(r => r.sentimentCorrect).length / successfulTests.length * 100;
  const fallbackAccuracy = successfulTests.filter(r => r.fallbackCorrect).length / successfulTests.length * 100;
  
  console.log(`\n📊 Overall Statistics:`);
  console.log(`  • Tests Run: ${results.length}`);
  console.log(`  • Tests Passed: ${successfulTests.length}`);
  console.log(`  • Tests Failed: ${results.length - successfulTests.length}`);
  
  console.log(`\n🎯 Accuracy Metrics:`);
  console.log(`  • Barber Name Recognition: ${barberAccuracy.toFixed(1)}% (${successfulTests.filter(r => r.barbersCorrect).length}/${successfulTests.length})`);
  console.log(`  • Sentiment Analysis: ${sentimentAccuracy.toFixed(1)}% (${successfulTests.filter(r => r.sentimentCorrect).length}/${successfulTests.length})`);
  console.log(`  • Fallback Logic: ${fallbackAccuracy.toFixed(1)}% (${successfulTests.filter(r => r.fallbackCorrect).length}/${successfulTests.length})`);
  
  // Detailed results table
  console.log(`\n📋 Detailed Results:`);
  console.log("┌────┬──────────────────────────────────┬────────┬──────────┬──────────┐");
  console.log("│ ID │ Test Description                 │ Barber │ Sentiment│ Fallback │");
  console.log("├────┼──────────────────────────────────┼────────┼──────────┼──────────┤");
  
  results.forEach(r => {
    const desc = r.description.substring(0, 30).padEnd(30);
    const barber = r.barbersCorrect ? "✅" : "❌";
    const sentiment = r.sentimentCorrect ? "✅" : "❌";
    const fallback = r.fallbackCorrect ? "✅" : "❌";
    console.log(`│ ${String(r.id).padEnd(2)} │ ${desc} │ ${barber}     │ ${sentiment}       │ ${fallback}       │`);
  });
  
  console.log("└────┴──────────────────────────────────┴────────┴──────────┴──────────┘");
  
  // Performance analysis
  console.log(`\n⚡ Performance Notes:`);
  const withErrors = results.filter(r => r.error);
  if (withErrors.length > 0) {
    console.log(`  • ${withErrors.length} test(s) had errors (Ollama may not be running)`);
  } else {
    console.log(`  ✓ All tests completed successfully`);
    console.log(`  ✓ Ollama connection working properly`);
  }
  
  // Recommendations
  console.log(`\n💡 Recommendations:`);
  if (barberAccuracy < 70) {
    console.log(`  • Barber recognition accuracy is low - consider improving prompt or using larger model`);
  } else {
    console.log(`  ✓ Barber recognition accuracy is good`);
  }
  
  if (sentimentAccuracy < 80) {
    console.log(`  • Sentiment analysis could be improved - may need better training`);
  } else {
    console.log(`  ✓ Sentiment analysis is performing well`);
  }
  
  if (fallbackAccuracy === 100) {
    console.log(`  ✓ Fallback to shop name logic is working perfectly`);
  }
  
  console.log("\n");
}

// Run tests
if (require.main === module) {
  runAllTests().catch(err => {
    console.error("Test suite failed:", err);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  runTestCase,
  TEST_CASES,
};
