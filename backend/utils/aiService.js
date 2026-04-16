/**
 * AI Service — OpenAI integration with fallback mechanisms
 * Handles: API failures, poor input, no bullet points, short content
 */

const AppError = require('./AppError');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Call OpenAI Chat Completion API
 */
const callOpenAI = async (messages, maxTokens = 1500) => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Extract bullet points from resume text
 */
const extractBulletPoints = (resumeText) => {
  if (!resumeText || resumeText.trim().length === 0) return [];

  // Multiple bullet point patterns
  const bulletPatterns = [
    /^[\s]*[•\-\*\u2022\u2023\u25E6]\s+(.+)$/gm,  // Standard bullets
    /^[\s]*\d+\.\s+(.+)$/gm,                        // Numbered lists
    /^[\s]*[>\→]\s+(.+)$/gm,                        // Arrow bullets
  ];

  const bullets = new Set();

  bulletPatterns.forEach((pattern) => {
    const matches = resumeText.matchAll(pattern);
    for (const match of matches) {
      const point = match[1].trim();
      if (point.length > 10 && point.length < 500) {
        bullets.add(point);
      }
    }
  });

  // If no explicit bullets found, try to extract action-verb sentences
  if (bullets.size === 0) {
    const actionVerbPattern = /(?:^|\n)\s*((?:Developed|Built|Created|Managed|Led|Designed|Implemented|Delivered|Achieved|Improved|Increased|Reduced|Launched|Coordinated|Analyzed|Maintained|Supported|Collaborated)[^.\n]+\.?)/gim;
    const matches = resumeText.matchAll(actionVerbPattern);
    for (const match of matches) {
      const point = match[1].trim();
      if (point.length > 15) bullets.add(point);
    }
  }

  return Array.from(bullets).slice(0, 8); // Limit to 8 bullets
};

/**
 * Rule-based fallback improvement when OpenAI is unavailable
 */
const ruleBasedImprovement = (bullets, jobDesc = '') => {
  const actionVerbs = [
    'Spearheaded', 'Orchestrated', 'Accelerated', 'Transformed', 'Pioneered',
    'Engineered', 'Optimized', 'Streamlined', 'Championed', 'Delivered',
  ];

  return bullets.map((bullet, i) => {
    const verb = actionVerbs[i % actionVerbs.length];
    let improved = bullet;

    // Replace weak verbs
    improved = improved.replace(/^(Worked on|Did|Made|Was responsible for|Helped with)/i, verb);

    // Add impact if not present
    if (!improved.match(/\d+%|\d+\s*(million|thousand|users|hours|days)/i)) {
      improved = improved.replace(/\.$/, ', resulting in measurable impact.');
    }

    return {
      original: bullet,
      improved: improved !== bullet ? improved : `${verb} ${bullet.charAt(0).toLowerCase() + bullet.slice(1)}`,
      reason: 'Enhanced with stronger action verb and impact statement',
    };
  });
};

/**
 * Improve resume bullet points using AI
 */
const improveBulletPoints = async (resumeText, jobDescription = '') => {
  const bullets = extractBulletPoints(resumeText);

  // Edge case: no bullet points found
  if (bullets.length === 0) {
    return {
      improvedBullets: [],
      generalSuggestions: [
        'Your resume lacks bullet points. Use bullet points to describe your achievements clearly.',
        'Start each bullet point with a strong action verb (e.g., Developed, Managed, Implemented).',
        'Quantify your achievements with numbers, percentages, or dollar amounts.',
        'Limit each bullet point to 1-2 lines for better readability.',
        'Focus on accomplishments rather than responsibilities.',
      ],
      aiSummary: 'Resume restructuring needed. No bullet-point format detected — consider reformatting with action-verb-led achievements.',
      usedFallback: false,
    };
  }

  // Edge case: very short content
  if (resumeText.trim().split(/\s+/).length < 50) {
    return {
      improvedBullets: ruleBasedImprovement(bullets),
      generalSuggestions: [
        'Your resume appears to be very brief. Aim for at least 400-600 words.',
        'Add more detail about your work experience and accomplishments.',
        'Include specific technologies, tools, and methodologies you used.',
      ],
      aiSummary: 'Resume content is minimal. Expansion is strongly recommended.',
      usedFallback: true,
    };
  }

  try {
    const bulletsList = bullets.map((b, i) => `${i + 1}. ${b}`).join('\n');
    const jdContext = jobDescription ? `\nTarget Job Description (first 500 chars): ${jobDescription.substring(0, 500)}` : '';

    const messages = [
      {
        role: 'system',
        content: `You are an expert ATS resume writer and career coach. Your task is to improve resume bullet points to be more impactful, use strong action verbs, include metrics where possible, and align with the target job description. Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Improve these resume bullet points for ATS optimization:

${bulletsList}
${jdContext}

Return a JSON object with this exact structure:
{
  "improvements": [
    {
      "original": "exact original bullet",
      "improved": "improved version",
      "reason": "brief explanation of improvement"
    }
  ],
  "generalSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "summary": "2-3 sentence overall assessment"
}`,
      },
    ];

    const content = await callOpenAI(messages, 2000);

    // Parse AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      improvedBullets: parsed.improvements || ruleBasedImprovement(bullets),
      generalSuggestions: parsed.generalSuggestions || [],
      aiSummary: parsed.summary || '',
      usedFallback: false,
    };
  } catch (err) {
    console.error('AI improvement failed, using fallback:', err.message);

    // Graceful fallback
    return {
      improvedBullets: ruleBasedImprovement(bullets, jobDescription),
      generalSuggestions: [
        'Use strong action verbs at the start of each bullet point.',
        'Quantify achievements with specific numbers, percentages, or outcomes.',
        'Tailor your resume keywords to match the job description.',
        'Keep bullet points concise — ideally 1-2 lines each.',
        'Focus on impact and results, not just responsibilities.',
      ],
      aiSummary: 'AI analysis temporarily unavailable. Applied rule-based improvements to enhance your resume bullet points.',
      usedFallback: true,
      fallbackReason: err.message,
    };
  }
};

/**
 * Generate ATS optimization tips using AI
 */
const generateATSTips = async (score, missingKeywords, resumeText) => {
  const topMissing = missingKeywords.slice(0, 10).map((k) => k.keyword).join(', ');

  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert ATS resume consultant. Provide specific, actionable advice.',
      },
      {
        role: 'user',
        content: `Resume ATS Score: ${score}/100. Top missing keywords: ${topMissing || 'None identified'}.
        
Generate 5 specific, actionable tips to improve this score. Return ONLY a JSON array of strings.`,
      },
    ];

    const content = await callOpenAI(messages, 500);
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid response');

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    // Fallback tips based on score
    if (score < 30) {
      return [
        'Your resume needs significant work. Start by adding more relevant keywords from the job description.',
        `Consider adding these missing keywords: ${topMissing || 'skills relevant to the role'}.`,
        'Restructure your resume to include clear sections: Summary, Experience, Education, Skills.',
        'Use the exact job title mentioned in the job description in your resume.',
        'Add a dedicated Skills section listing all relevant technical and soft skills.',
      ];
    } else if (score < 60) {
      return [
        `Add more of these missing keywords naturally: ${topMissing || 'role-specific skills'}.`,
        'Expand your experience section with more detailed bullet points.',
        'Quantify more achievements with specific numbers and outcomes.',
        'Ensure your resume uses standard section headings for ATS compatibility.',
        'Mirror the language and terminology used in the job description.',
      ];
    } else {
      return [
        'Your resume is already well-optimized. Fine-tune by adding any remaining missing keywords.',
        `Consider incorporating: ${topMissing || 'additional industry-specific terms'}.`,
        'Review your bullet points for impact and specificity.',
        'Consider adding relevant certifications or courses.',
        'Ensure consistent formatting throughout the document.',
      ];
    }
  }
};

/**
 * Tailor Resume Builder JSON based on a target job role utilizing AI.
 */
const tailorBuilderData = async (baseData, roleTitle) => {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are an expert ATS Resume Writer and Technical Recruiter. I will provide a JSON object representing a user's resume and a target job role. 
CRITICAL TASKS:
1. "summary": Overhaul and rewrite the summary to perfectly pitch the user for the exact target role.
2. "skills": The user might not know which keywords pass the ATS. You MUST auto-generate an extensive list of relevant hard and soft skills, tools, and methodologies highly specific to the target role. Incorporate industry-standard ATS keywords heavily.
3. "experience": Rewrite ALL bullet points (description) to sound impactful, metrics-driven, and aligned with the target role.
Keep the exact same JSON schema. Output ONLY valid JSON, do not wrap in markdown blocks.`,
      },
      {
        role: 'user',
        content: `Target Role: ${roleTitle}\n\nResume JSON:\n${JSON.stringify(baseData, null, 2)}`,
      },
    ];

    const content = await callOpenAI(messages, 2500);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON format');

    const tailoredData = JSON.parse(jsonMatch[0]);
    // Ensure we don't accidentally wipe personal info if the AI dropped it
    tailoredData.personal = baseData.personal;
    
    return tailoredData;
  } catch (err) {
    console.error('Tailor building failed:', err.message);
    
    // Advanced Fallback: If OpenAI fails or key is missing, utilize an offline role-dictionary to auto-fill
    const safeData = JSON.parse(JSON.stringify(baseData));
    const roleLower = roleTitle.toLowerCase();
    
    safeData.summary = `Passionate and results-driven ${roleTitle} with strong foundation in specific industry methodologies. Highly adaptable with a proven track record of optimizing workflows, solving complex problems, and driving impactful metrics. Dedicated to leveraging robust technical and soft skills to excel in ${roleTitle} environments.`;

    const skillProfiles = {
      'frontend': 'JavaScript, React.js, HTML5, CSS3, TailwindCSS, Redux, Git, Webpack, Responsive Design, Web Accessibility (WCAG), REST APIs, UI/UX implementation',
      'backend': 'Node.js, Express.js, Python, Java, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, Microservices, RESTful APIs, AWS, System Design',
      'software': 'Java, Python, C++, JavaScript, SQL, Data Structures, Algorithms, Git, CI/CD, Agile/Scrum, Software Development Life Cycle (SDLC), Object-Oriented Design',
      'data': 'Python, R, SQL, Pandas, NumPy, Scikit-learn, TensorFlow, Machine Learning, Data Visualization (Tableau/PowerBI), Statistics, Big Data (Hadoop/Spark)',
      'product': 'Product Management, Agile/Scrum, Jira, Roadmap Planning, Go-to-Market Strategy, User/Market Research, A/B Testing, Cross-functional Leadership, Stakeholder Management',
      'marketing': 'Digital Marketing, SEO/SEM, Content Strategy, Google Analytics, Social Media Management, CRM, Email Campaigns, Copywriting, Market Analysis',
      'default': 'Project Management, Communication, Leadership, Agile Methodologies, Problem Solving, Critical Thinking, Cross-Functional Team Collaboration, Process Optimization'
    };

    let matchedSkills = skillProfiles.default;
    if (roleLower.includes('front') || roleLower.includes('ui')) matchedSkills = skillProfiles.frontend;
    else if (roleLower.includes('back')) matchedSkills = skillProfiles.backend;
    else if (roleLower.includes('software') || roleLower.includes('developer') || roleLower.includes('engineer')) matchedSkills = skillProfiles.software;
    else if (roleLower.includes('data') || roleLower.includes('machine')) matchedSkills = skillProfiles.data;
    else if (roleLower.includes('product') || roleLower.includes('manager')) matchedSkills = skillProfiles.product;
    else if (roleLower.includes('market')) matchedSkills = skillProfiles.marketing;

    safeData.skills = matchedSkills;
    
    // Auto populate experience bullets if empty
    safeData.experience.forEach(exp => {
       if(!exp.description || exp.description.trim().length < 5) {
          exp.description = `- Designed and completely executed specialized tasks directly aligned with ${roleTitle} requirements.\n- Collaborated cross-functionally to improve delivery times by 15%.\n- Maintained strict industry quality guidelines leading to 0% degradation.`;
       }
    });

    return safeData;
  }
};

module.exports = { improveBulletPoints, generateATSTips, extractBulletPoints, tailorBuilderData };
