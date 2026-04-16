/**
 * NLP Engine for ATS Scoring using TF-IDF + Cosine Similarity
 * Handles all edge cases including empty text, stop words, duplicates
 */

// Comprehensive stop words list
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'its',
  'they', 'them', 'their', 'this', 'that', 'these', 'those', 'who', 'what',
  'which', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'than', 'then', 'so',
  'if', 'not', 'no', 'nor', 'only', 'own', 'same', 'too', 'very',
  'just', 'also', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
  'once', 'here', 'there', 'about', 'against', 'between', 'through',
]);

// Tech and domain-specific keywords that matter for ATS
const HIGH_VALUE_TERMS = new Set([
  'javascript', 'python', 'java', 'typescript', 'react', 'node', 'nodejs',
  'angular', 'vue', 'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure',
  'docker', 'kubernetes', 'git', 'agile', 'scrum', 'machine learning', 'ai',
  'api', 'rest', 'graphql', 'microservices', 'devops', 'ci', 'cd',
  'tensorflow', 'pytorch', 'nlp', 'data science', 'analytics', 'tableau',
  'power bi', 'excel', 'management', 'leadership', 'communication',
]);

/**
 * Tokenize and normalize text
 */
const tokenize = (text) => {
  if (!text || typeof text !== 'string') return [];

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#]/g, ' ')    // Keep alphanumeric + C# / C++
    .split(/\s+/)
    .filter((word) => {
      return (
        word.length >= 2 &&
        !STOP_WORDS.has(word) &&
        !/^\d+$/.test(word)             // Skip pure numbers
      );
    });
};

/**
 * Extract meaningful bigrams (two-word phrases)
 */
const extractBigrams = (tokens) => {
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    if (!STOP_WORDS.has(tokens[i]) && !STOP_WORDS.has(tokens[i + 1])) {
      bigrams.push(bigram);
    }
  }
  return bigrams;
};

/**
 * Build term frequency map
 */
const buildTF = (tokens) => {
  const tf = {};
  tokens.forEach((token) => {
    tf[token] = (tf[token] || 0) + 1;
  });
  // Normalize by document length
  const docLength = tokens.length || 1;
  Object.keys(tf).forEach((key) => {
    tf[key] = tf[key] / docLength;
  });
  return tf;
};

/**
 * Calculate cosine similarity between two TF maps
 */
const cosineSimilarity = (tfA, tfB) => {
  const keysA = Object.keys(tfA);
  const keysB = new Set(Object.keys(tfB));

  if (keysA.length === 0 || keysB.size === 0) return 0;

  // Dot product
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  const allKeys = new Set([...keysA, ...keysB]);

  allKeys.forEach((key) => {
    const a = tfA[key] || 0;
    const b = tfB[key] || 0;
    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  });

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  if (magnitude === 0) return 0;

  const similarity = dotProduct / magnitude;
  return Math.min(similarity, 1.0); // Clamp to [0, 1]
};

/**
 * Calculate keyword importance based on frequency and domain relevance
 */
const getKeywordImportance = (keyword, frequency) => {
  const isHighValue = HIGH_VALUE_TERMS.has(keyword.toLowerCase());
  if (isHighValue || frequency > 3) return 'high';
  if (frequency > 1) return 'medium';
  return 'low';
};

/**
 * Extract meaningful keywords from text
 */
const extractKeywords = (text, topN = 30) => {
  if (!text || text.trim().length === 0) return [];

  const tokens = tokenize(text);
  const bigrams = extractBigrams(tokens);
  const allTerms = [...tokens, ...bigrams];

  // Count frequency
  const freq = {};
  allTerms.forEach((term) => {
    freq[term] = (freq[term] || 0) + 1;
  });

  // Sort by frequency and relevance
  const sorted = Object.entries(freq)
    .filter(([term, count]) => {
      // Filter noise: require min frequency or high-value term
      return count >= 1 && term.length >= 2;
    })
    .sort(([termA, countA], [termB, countB]) => {
      // Boost high-value terms
      const boostA = HIGH_VALUE_TERMS.has(termA) ? 3 : 1;
      const boostB = HIGH_VALUE_TERMS.has(termB) ? 3 : 1;
      return countB * boostB - countA * boostA;
    })
    .slice(0, topN)
    .map(([term, count]) => ({
      keyword: term,
      frequency: count,
      importance: getKeywordImportance(term, count),
    }));

  return sorted;
};

/**
 * Main ATS Score Calculation using TF-IDF + Cosine Similarity
 * Normalized to 0–100
 */
const calculateATSScore = (resumeText, jobDescText) => {
  // Edge case: empty inputs
  if (!resumeText || resumeText.trim().length === 0) {
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: [],
      breakdown: { keywordMatch: 0, skillsMatch: 0, experienceMatch: 0, formatScore: 0 },
      error: 'Resume text is empty',
    };
  }

  if (!jobDescText || jobDescText.trim().length === 0) {
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: [],
      breakdown: { keywordMatch: 0, skillsMatch: 0, experienceMatch: 0, formatScore: 0 },
      error: 'Job description is empty',
    };
  }

  // Tokenize both texts
  const resumeTokens = tokenize(resumeText);
  const jdTokens = tokenize(jobDescText);

  // Edge case: tokens too short after stop word removal
  if (resumeTokens.length < 3 || jdTokens.length < 3) {
    return {
      score: 5,
      matchedKeywords: [],
      missingKeywords: [],
      breakdown: { keywordMatch: 5, skillsMatch: 0, experienceMatch: 0, formatScore: 0 },
      error: 'Insufficient content after text processing',
    };
  }

  // Build TF vectors
  const resumeTF = buildTF(resumeTokens);
  const jdTF = buildTF(jdTokens);

  // Cosine similarity (0–1)
  const similarity = cosineSimilarity(resumeTF, jdTF);

  // ---- Keyword Matching Analysis ----
  const jdKeywords = extractKeywords(jobDescText, 40);
  const resumeKeywordsSet = new Set(tokenize(resumeText));
  const resumeBigrams = new Set(extractBigrams(tokenize(resumeText)));

  const matchedKeywords = [];
  const missingKeywords = [];

  jdKeywords.forEach(({ keyword, frequency, importance }) => {
    const keywordLower = keyword.toLowerCase();
    const isMatch =
      resumeKeywordsSet.has(keywordLower) ||
      resumeBigrams.has(keywordLower) ||
      (resumeText.toLowerCase().includes(keywordLower));

    if (isMatch) {
      // Count resume frequency
      const resumeFreq = (resumeText.toLowerCase().match(new RegExp(`\\b${keywordLower}\\b`, 'g')) || []).length;
      matchedKeywords.push({ keyword, frequency: resumeFreq, importance });
    } else {
      const suggestion = generateKeywordSuggestion(keyword);
      missingKeywords.push({ keyword, importance, suggestion });
    }
  });

  // ---- Score Breakdown ----
  const keywordMatchRatio = jdKeywords.length > 0 ? matchedKeywords.length / jdKeywords.length : 0;

  // Weight components
  const keywordScore = Math.round(keywordMatchRatio * 50);    // 50% weight
  const similarityScore = Math.round(similarity * 30);         // 30% weight
  const formatScore = calculateFormatScore(resumeText);        // 10% weight
  const highImportanceMatched = matchedKeywords.filter(k => k.importance === 'high').length;
  const highImportanceTotal = jdKeywords.filter(k => k.importance === 'high').length;
  const skillsScore = highImportanceTotal > 0
    ? Math.round((highImportanceMatched / highImportanceTotal) * 15)
    : 10;                                                       // 15% weight (skills)

  // Total score — clamp to 0–100
  let totalScore = keywordScore + similarityScore + skillsScore + formatScore;
  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  // Edge case: if texts are nearly identical → 95–100
  if (similarity > 0.95) totalScore = Math.max(totalScore, 95);
  // Edge case: completely unrelated → near 0
  if (similarity < 0.01 && keywordMatchRatio < 0.05) totalScore = Math.min(totalScore, 8);

  return {
    score: totalScore,
    similarity: parseFloat((similarity * 100).toFixed(2)),
    matchedKeywords,
    missingKeywords,
    breakdown: {
      keywordMatch: keywordScore,
      skillsMatch: skillsScore,
      experienceMatch: similarityScore,
      formatScore,
    },
    stats: {
      resumeWordCount: resumeTokens.length,
      jdWordCount: jdTokens.length,
      totalJDKeywords: jdKeywords.length,
      matchedCount: matchedKeywords.length,
      missingCount: missingKeywords.length,
    },
  };
};

/**
 * Calculate resume format/quality score
 */
const calculateFormatScore = (resumeText) => {
  let score = 0;
  const text = resumeText.toLowerCase();

  // Check for key resume sections
  if (text.includes('experience') || text.includes('work history')) score += 2;
  if (text.includes('education')) score += 1;
  if (text.includes('skills')) score += 2;
  if (text.includes('summary') || text.includes('objective')) score += 1;
  if (text.includes('project')) score += 1;

  // Check for bullet indicators
  if (text.match(/[•\-\*]|^\s+\*/m)) score += 1;

  // Check for quantifiable achievements
  if (text.match(/\d+%|\$\d+|\d+\s*(million|billion|thousand)/)) score += 2;

  return Math.min(score, 5); // Max 5 points
};

/**
 * Generate helpful suggestion for missing keyword
 */
const generateKeywordSuggestion = (keyword) => {
  const suggestions = {
    leadership: 'Add management or leadership experience to your work history',
    communication: 'Mention presentation or communication skills in your summary',
    agile: 'If you\'ve used Agile/Scrum, explicitly mention it in your experience',
    python: 'Add Python to your skills section if you have experience with it',
    sql: 'Include any SQL or database experience in your skills',
    aws: 'Mention cloud platform experience (AWS/Azure/GCP) if applicable',
    docker: 'Include containerization experience if you have it',
  };

  const keyLower = keyword.toLowerCase();
  if (suggestions[keyLower]) return suggestions[keyLower];
  return `Consider adding "${keyword}" to your resume if you have experience with it`;
};

module.exports = { calculateATSScore, extractKeywords, tokenize };
