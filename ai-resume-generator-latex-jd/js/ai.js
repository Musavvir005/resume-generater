const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "you", "your", "are", "our", "will", "from", "have", "has", "job", "role", "work", "team", "using", "use", "candidate", "skills", "ability", "required", "preferred", "responsibilities", "experience", "strong", "good", "excellent", "knowledge", "understanding", "basic", "must", "should", "can", "able", "intern", "developer", "company", "looking", "build", "develop", "create", "design", "maintain", "support", "including", "based", "related", "new", "we", "is", "a", "an", "to", "in", "of", "on", "as", "by", "or", "be", "at", "it", "their", "they", "into", "within", "across"
]);

const IMPORTANT_TERMS = [
  "python", "java", "c++", "javascript", "typescript", "html", "css", "sql", "react", "node.js", "node", "express", "express.js", "mongodb", "mysql", "postgresql", "fastapi", "flask", "django", "rest api", "rest", "api", "git", "github", "docker", "kubernetes", "aws", "azure", "gcp", "machine learning", "deep learning", "computer vision", "opencv", "tensorflow", "pytorch", "scikit-learn", "cnn", "cnns", "gan", "gans", "federated learning", "rag", "llm", "llms", "nlp", "data science", "data analysis", "pandas", "numpy", "jwt", "authentication", "bcrypt", "socket.io", "responsive", "frontend", "backend", "full stack", "cyber security", "security", "encryption", "medical image", "healthcare", "image analysis", "model evaluation", "semantic search", "embeddings"
];

function buildResumePrompt(data) {
  return `You are an expert ATS-friendly resume writer and job-description matcher.

TASK:
Analyze the job description. Select exactly ${data.projectCount} projects when at least that many projects are provided, and exactly ${data.certificateCount} certificates when at least that many certificates are provided. If fewer are provided, return all available items. Rank by relevance to the job description.

STRICT RULES:
1. Return only valid JSON. No markdown fences, no explanation outside JSON.
2. Use only the student's provided details. Do not invent projects, certificates, companies, links, scores, or experience.
3. Rewrite bullets truthfully using the given project descriptions, features, metrics, and the job description keywords. Apply the standard structure: [Action verb] + [specific task] + using [exact JD keyword or technology] + for [scope or purpose] + resulting in [measurable outcome].
4. VERY IMPORTANT: Do NOT repeat the same action verb more than 2 times across the entire resume. Vary your action verbs dynamically using unique, high-quality synonyms (e.g. use Developed, Architected, Engineered, Pioneered, Formulated, Implemented, Deployed, Optimized, Quantized, Refined).
5. Keep the same LaTeX resume style: Education, Experience, Patents & Publications, Projects, Technical Skills, Certifications, Achievements.
6. Put most job-relevant projects first.
7. Put most job-relevant certificates first.
8. Optimize skill categories for the JD using only provided skills.
9. ATS score should be estimated using a weighted model: Mandatory Hard Skills (40%), Contextual Evidence / measurable results in bullets (20%), Target Job Title match (15%), Education & Certifications (10%), Preferred Skills (5%), Soft Skills (5%), and ATS-readable Single-Column Layout (5%).

Return this exact JSON shape:
{
  "targetRole": "",
  "professionalHeadline": "one short targeted phrase, not used in LaTeX unless needed",
  "education": [
    {"institution":"", "location":"", "degree":"", "duration":""}
  ],
  "experience": [
    {"role":"", "duration":"", "company":"", "location":"", "bullets":[""]}
  ],
  "patents": [
    {"title":"", "detail":""}
  ],
  "selectedProjects": [
    {"title":"", "technologies":[""], "link":"", "bullets":["", "", ""]}
  ],
  "selectedCertificates": [
    {"title":"", "issuer":"", "date":"", "reason":""}
  ],
  "skills": {
    "Languages": [],
    "Frameworks & Libraries": [],
    "Databases": [],
    "Developer Tools": [],
    "Core Competencies": []
  },
  "achievements": [""],
  "jdKeywords": [],
  "matchedKeywords": [],
  "missingKeywords": [],
  "atsScore": 0,
  "selectionReason": "short reason why these projects/certificates were selected",
  "suggestions": [""]
}

STUDENT DATA AND JOB DESCRIPTION:
${JSON.stringify(data, null, 2)}
`;
}

async function callGemini({ apiKey, modelName, prompt }) {
  if (!apiKey) {
    throw new Error("Please enter your Gemini API key first, or use Generate without AI.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.25,
        topP: 0.8,
        responseMimeType: "application/json"
      }
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || `Gemini API request failed with status ${response.status}`;
    throw new Error(message);
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("\n").trim();
  if (!text) throw new Error("Gemini returned an empty response.");

  return parseJsonResponse(text);
}

function parseJsonResponse(text) {
  const cleaned = String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const possibleJson = cleaned.slice(start, end + 1);
      return JSON.parse(possibleJson);
    }
    throw firstError;
  }
}

function generateLocalResume(data) {
  const jdKeywords = extractKeywords(data.jobDescription);
  const allSkillTerms = Object.values(data.skills || {}).flatMap(splitList);
  const matchedKeywords = jdKeywords.filter(keyword => containsAny(allSkillTerms, keyword) || data.projects.some(project => textIncludes(projectText(project), keyword)) || data.certificates.some(cert => textIncludes(certificateText(cert), keyword)));
  const missingKeywords = jdKeywords.filter(keyword => !matchedKeywords.includes(keyword)).slice(0, 14);

  const usedVerbsMap = new Map();
  const selectedProjects = rankItems(data.projects, jdKeywords, projectText)
    .slice(0, Math.min(data.projectCount, data.projects.length))
    .map(({ item }) => ({
      title: item.title,
      technologies: splitList(item.technologies),
      link: item.link || "",
      bullets: generateProjectBullets(item, jdKeywords, usedVerbsMap)
    }));

  const selectedCertificates = rankItems(data.certificates, jdKeywords, certificateText)
    .slice(0, Math.min(data.certificateCount, data.certificates.length))
    .map(({ item }) => ({
      title: item.title,
      issuer: item.issuer,
      date: item.date,
      link: item.link || "",
      reason: relevanceReason(item.skills || item.title, jdKeywords)
    }));

  const skills = optimizeSkills(data.skills, jdKeywords, data.skillsPerCategory);
  const atsScore = estimateDetailedAtsScore(data, selectedProjects, selectedCertificates, jdKeywords);

  const maxBullets = (data.pageCount === 1) ? 3 : 4;
  const experience = (data.experience || []).map(exp => ({
    ...exp,
    bullets: splitLines(exp.bullets).slice(0, maxBullets)
  }));

  const targetAchLimit = (data.achievementCount !== undefined && data.achievementCount !== null) ? data.achievementCount : 3;
  const achievements = (data.achievements || []).slice(0, targetAchLimit);

  return {
    targetRole: data.jobTitle || "Target Role",
    professionalHeadline: data.jobTitle || "ATS-targeted candidate",
    education: data.education,
    experience,
    patents: data.patents,
    selectedProjects,
    selectedCertificates,
    skills,
    achievements,
    jdKeywords,
    matchedKeywords,
    missingKeywords,
    atsScore,
    selectionReason: "Projects and certificates were ranked by keyword overlap with the job description and then trimmed to the selected counts.",
    suggestions: missingKeywords.length ? [`Consider learning or proving experience with: ${missingKeywords.slice(0, 5).join(", ")}.`] : ["Profile strongly matches the job description keywords."]
  };
}

function extractKeywords(text) {
  const lower = String(text || "").toLowerCase();
  const found = new Set();

  IMPORTANT_TERMS.forEach(term => {
    if (lower.includes(term)) found.add(normalizeKeyword(term));
  });

  const words = lower
    .replace(/[(){}[\],.;:/\\|!?@#$%^&*_+=~`"']/g, " ")
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  const counts = new Map();
  words.forEach(word => counts.set(word, (counts.get(word) || 0) + 1));

  [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .forEach(([word]) => found.add(normalizeKeyword(word)));

  return [...found].slice(0, 28);
}

function normalizeKeyword(term) {
  const map = {
    "node": "Node.js",
    "node.js": "Node.js",
    "express": "Express.js",
    "express.js": "Express.js",
    "rest": "REST API",
    "rest api": "REST API",
    "api": "API",
    "cnns": "CNNs",
    "cnn": "CNNs",
    "gans": "GANs",
    "gan": "GANs",
    "llm": "LLMs",
    "llms": "LLMs"
  };
  return map[term] || term.replace(/\b\w/g, c => c.toUpperCase());
}

function rankItems(items, keywords, toText) {
  return (items || []).map((item, index) => {
    const text = toText(item).toLowerCase();
    const score = keywords.reduce((sum, keyword) => sum + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0);
    return { item, score, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index);
}

function projectText(project) {
  return [project.title, project.technologies, project.description, project.features, project.metrics, project.link].filter(Boolean).join(" ");
}

function certificateText(cert) {
  return [cert.title, cert.issuer, cert.date, cert.skills].filter(Boolean).join(" ");
}

function textIncludes(text, keyword) {
  return String(text || "").toLowerCase().includes(String(keyword || "").toLowerCase());
}

function containsAny(values, keyword) {
  return (values || []).some(value => textIncludes(value, keyword));
}

function splitList(value) {
  if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean);
  return String(value || "")
    .split(/,|\n|;/)
    .map(s => s.trim())
    .filter(Boolean);
}

function splitLines(value) {
  if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean);
  return String(value || "")
    .split(/\n|\u2022/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function getUniqueActionVerb(category, usedVerbsMap) {
  const pools = {
    create: ["Developed", "Architected", "Engineered", "Pioneered", "Formulated", "Constructed", "Crafted", "Created", "Built"],
    execute: ["Implemented", "Executed", "Integrated", "Deployed", "Launched", "Programmed", "Configured", "Synthesized"],
    optimize: ["Optimized", "Quantized", "Benchmarked", "Refined", "Enhanced", "Accelerated", "Streamlined", "Maximized"],
    design: ["Designed", "Prototyped", "Modeled", "Mapped", "Structured", "Drafted", "Devised"]
  };
  
  const pool = pools[category] || pools.create;
  
  // Find a verb in the pool that has been used less than 2 times
  for (const verb of pool) {
    const count = usedVerbsMap.get(verb) || 0;
    if (count < 2) {
      usedVerbsMap.set(verb, count + 1);
      return verb;
    }
  }
  
  return pool[0];
}

function generateProjectBullets(project, jdKeywords, usedVerbsMap) {
  const tech = splitList(project.technologies).slice(0, 5).join(", ");
  const features = splitList(project.features).slice(0, 3).join(", ");
  const metrics = project.metrics ? String(project.metrics).trim() : "";
  const matched = jdKeywords.filter(keyword => textIncludes(projectText(project), keyword)).slice(0, 4).join(", ");

  const vCreate = getUniqueActionVerb("create", usedVerbsMap);
  const vExecute = getUniqueActionVerb("execute", usedVerbsMap);
  const vOptimize = getUniqueActionVerb("optimize", usedVerbsMap);
  const vDesign = getUniqueActionVerb("design", usedVerbsMap);

  const bullets = [];
  bullets.push(`${vCreate} an advanced ${project.title || "solution"} using ${tech || "the required tech stack"} for high-performance ${project.description ? "feature integration" : "application workflows"}, resulting in full alignment with ${matched || "target job criteria"}.`);
  if (features) {
    bullets.push(`${vExecute} ${features} using ${tech} for reliable service execution, resulting in optimal data pipeline consistency.`);
  }
  if (metrics) {
    bullets.push(`${vOptimize} production-style system features for ${project.title || "platform"} operations, resulting in measurable outcomes including ${metrics}.`);
  }
  
  if (bullets.length < 3 && project.description) {
    bullets.push(`${vDesign} core operational interfaces using ${tech} for system capabilities, resulting in a robust, extensible project implementation.`);
  }
  
  while (bullets.length < 3) {
    bullets.push(`Applied ${tech || "technical tools"} to deploy system services, resulting in enhanced operational capability.`);
  }
  return bullets.slice(0, 3);
}

function optimizeSkills(skillObj, jdKeywords, limit = 6) {
  const categories = {
    "Languages": splitList(skillObj.languages),
    "Frameworks & Libraries": splitList(skillObj.frameworks),
    "Databases": splitList(skillObj.databases),
    "Developer Tools": splitList(skillObj.tools),
    "Core Competencies": splitList(skillObj.core)
  };

  const skillsLimit = (limit !== undefined && limit !== null) ? limit : 6;

  Object.keys(categories).forEach(category => {
    categories[category] = categories[category].sort((a, b) => {
      const aMatch = jdKeywords.some(keyword => textIncludes(a, keyword));
      const bMatch = jdKeywords.some(keyword => textIncludes(b, keyword));
      return Number(bMatch) - Number(aMatch) || a.localeCompare(b);
    }).slice(0, skillsLimit);
  });

  return categories;
}

function relevanceReason(text, keywords) {
  const hits = keywords.filter(keyword => textIncludes(text, keyword)).slice(0, 4);
  return hits.length ? `Relevant to ${hits.join(", ")}` : "Included based on available certificate details.";
}

function estimateDetailedAtsScore(data, selectedProjects, selectedCertificates, jdKeywords) {
  // 1. Mandatory Hard Skills (Weight = 40)
  // Take the first 10 keywords extracted from JD as mandatory hard skills
  const mandatorySkills = jdKeywords.slice(0, 10);
  const preferredSkills = jdKeywords.slice(10, 16);
  
  // Collect all skills listed in the Skills section
  const skillsLanguages = splitList(data.skills?.languages);
  const skillsFrameworks = splitList(data.skills?.frameworks);
  const skillsDatabases = splitList(data.skills?.databases);
  const skillsTools = splitList(data.skills?.tools);
  const skillsCore = splitList(data.skills?.core);
  const allListedSkills = new Set([
    ...skillsLanguages,
    ...skillsFrameworks,
    ...skillsDatabases,
    ...skillsTools,
    ...skillsCore
  ].map(s => s.toLowerCase().trim()));

  // Collect all text from projects, experience, and patents (for contextual evidence check)
  const experienceText = (data.experience || []).map(exp => [exp.role, exp.company, exp.bullets].join(" ")).join(" ").toLowerCase();
  const projectText = (selectedProjects || []).map(proj => [proj.title, proj.technologies, proj.bullets].join(" ")).join(" ").toLowerCase();
  const patentText = (data.patents || []).map(pat => [pat.title, pat.detail].join(" ")).join(" ").toLowerCase();
  const allContextText = [experienceText, projectText, patentText].join(" ");

  let mandatoryWeightsSum = 0;
  let mandatoryMatchSum = 0;
  
  mandatorySkills.forEach(skill => {
    const skillLower = skill.toLowerCase().trim();
    const weight = 4; // Each has a weight of 4, summing to 40
    mandatoryWeightsSum += weight;
    
    // Check if skill is in context (Experience or Projects bullets) -> Match Value = 1.0
    if (allContextText.includes(skillLower)) {
      mandatoryMatchSum += weight * 1.0;
    }
    // Check if listed only in Skills -> Match Value = 0.5
    else if (allListedSkills.has(skillLower)) {
      mandatoryMatchSum += weight * 0.5;
    }
    // Missing -> Match Value = 0.0
    else {
      mandatoryMatchSum += weight * 0.0;
    }
  });

  const mandatoryScore = mandatoryWeightsSum > 0 ? (mandatoryMatchSum / mandatoryWeightsSum) * 40 : 25;

  // 2. Contextual Evidence & Project Outcomes (Weight = 20)
  // Check if project bullet points contain action verbs and numbers/metrics
  let contextMatch = 0;
  let totalBullets = 0;
  
  (selectedProjects || []).forEach(proj => {
    (proj.bullets || []).forEach(bullet => {
      totalBullets++;
      const bulletLower = bullet.toLowerCase();
      // Check for numbers (measurable outcome check)
      const hasNumbers = /\d+/.test(bulletLower) || bulletLower.includes("%");
      // Check for action verbs
      const hasActionVerbs = ["develop", "implement", "design", "create", "train", "optimize", "reduce", "increase", "improve", "deploy", "architect", "engineer", "quantize", "benchmarked", "achiev"].some(verb => bulletLower.includes(verb));
      
      if (hasNumbers && hasActionVerbs) {
        contextMatch += 1.0;
      } else if (hasActionVerbs) {
        contextMatch += 0.5;
      }
    });
  });

  const contextScore = totalBullets > 0 ? (contextMatch / totalBullets) * 20 : 10;

  // 3. Relevant Job Title & Domain (Weight = 15)
  // Compare desired job title with target role
  const targetRole = (data.jobTitle || "").toLowerCase().trim();
  const jdTitle = (jdKeywords[0] || "").toLowerCase().trim();
  let titleScore = 0;
  if (targetRole && jdTitle && (targetRole.includes(jdTitle) || jdTitle.includes(targetRole))) {
    titleScore = 15;
  } else if (targetRole) {
    titleScore = 10;
  } else {
    titleScore = 5;
  }

  // 4. Education & Certifications (Weight = 10)
  let eduScore = 5;
  const eduText = (data.education || []).map(edu => edu.degree).join(" ").toLowerCase();
  if (eduText.includes("b.tech") || eduText.includes("b.e.") || eduText.includes("m.tech") || eduText.includes("computer science") || eduText.includes("cse")) {
    eduScore += 3;
  }
  if (selectedCertificates && selectedCertificates.length > 0) {
    eduScore += 2;
  }

  // 5. Preferred Skills Match (Weight = 5)
  let prefMatch = 0;
  preferredSkills.forEach(skill => {
    const skillLower = skill.toLowerCase().trim();
    if (allContextText.includes(skillLower) || allListedSkills.has(skillLower)) {
      prefMatch += 1.0;
    }
  });
  const prefScore = preferredSkills.length > 0 ? (prefMatch / preferredSkills.length) * 5 : 3;

  // 6. Soft Skills Match (Weight = 5)
  const softSkillsList = ["communication", "problem-solving", "problem solving", "leadership", "collaboration", "teamwork", "agile", "scrum", "mentored", "led", "managed", "coordinated", "customer"];
  let softMatch = 0;
  softSkillsList.forEach(skill => {
    if (allContextText.includes(skill)) {
      softMatch++;
    }
  });
  const softScore = Math.min(5, softMatch * 1.5);

  // 7. ATS-Readable Formatting (Weight = 5)
  // Standard LaTeX parsed output is 100% compliant single-column layout!
  const formatScore = 5;

  const finalScore = Math.round(mandatoryScore + contextScore + titleScore + eduScore + prefScore + softScore + formatScore);
  return Math.max(35, Math.min(99, finalScore));
}

function ensureCounts(aiResume, sourceData) {
  const local = generateLocalResume(sourceData);
  const targetProjects = Math.min(sourceData.projectCount, sourceData.projects.length);
  const targetCerts = Math.min(sourceData.certificateCount, sourceData.certificates.length);

  const clean = {
    ...local,
    ...aiResume,
    education: Array.isArray(aiResume.education) && aiResume.education.length ? aiResume.education : local.education,
    experience: Array.isArray(aiResume.experience) ? aiResume.experience : local.experience,
    patents: Array.isArray(aiResume.patents) ? aiResume.patents : local.patents,
    selectedProjects: Array.isArray(aiResume.selectedProjects) ? aiResume.selectedProjects : [],
    selectedCertificates: Array.isArray(aiResume.selectedCertificates) ? aiResume.selectedCertificates : [],
    achievements: Array.isArray(aiResume.achievements) ? aiResume.achievements : local.achievements,
    jdKeywords: Array.isArray(aiResume.jdKeywords) && aiResume.jdKeywords.length ? aiResume.jdKeywords : local.jdKeywords,
    matchedKeywords: Array.isArray(aiResume.matchedKeywords) ? aiResume.matchedKeywords : local.matchedKeywords,
    missingKeywords: Array.isArray(aiResume.missingKeywords) ? aiResume.missingKeywords : local.missingKeywords,
    suggestions: Array.isArray(aiResume.suggestions) ? aiResume.suggestions : local.suggestions
  };

  if (clean.selectedProjects.length < targetProjects) {
    const existingTitles = new Set(clean.selectedProjects.map(p => String(p.title || "").toLowerCase()));
    const fillers = local.selectedProjects.filter(p => !existingTitles.has(String(p.title || "").toLowerCase()));
    clean.selectedProjects = [...clean.selectedProjects, ...fillers];
  }
  clean.selectedProjects = clean.selectedProjects.slice(0, targetProjects);

  if (clean.selectedCertificates.length < targetCerts) {
    const existingTitles = new Set(clean.selectedCertificates.map(c => String(c.title || "").toLowerCase()));
    const fillers = local.selectedCertificates.filter(c => !existingTitles.has(String(c.title || "").toLowerCase()));
    clean.selectedCertificates = [...clean.selectedCertificates, ...fillers];
  }
  clean.selectedCertificates = clean.selectedCertificates.slice(0, targetCerts);

  clean.atsScore = Number(clean.atsScore) || local.atsScore;
  return clean;
}
