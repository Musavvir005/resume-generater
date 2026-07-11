const fs = require("fs");
const path = require("path");
const vm = require("vm");

console.log("=========================================");
console.log("🚀 Running ResuCraft AI Engine Local Generation");
console.log("=========================================\n");

try {
  // Load sample data, ai engine, and template engine
  const sampleDataPath = path.join(__dirname, "js", "sampleData.js");
  const aiPath = path.join(__dirname, "js", "ai.js");
  const templatePath = path.join(__dirname, "js", "templateEngine.js");

  const sampleDataCode = fs.readFileSync(sampleDataPath, "utf8").replace(/const SAMPLE_DATA\s*=/, "var SAMPLE_DATA =");
  const aiCode = fs.readFileSync(aiPath, "utf8")
    .replace(/function\s+generateLocalResume\b/, "var generateLocalResume = function")
    .replace(/function\s+buildResumePrompt\b/, "var buildResumePrompt = function")
    .replace(/async function\s+callGemini\b/, "var callGemini = async function");
  const templateCode = fs.readFileSync(templatePath, "utf8");

  // Create sandbox context with browser globals mocked
  const sandbox = {
    console,
    Set,
    Map,
    JSON,
    String,
    Math,
    Object,
    Array,
    Number,
    RegExp,
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  };

  vm.createContext(sandbox);

  vm.runInContext(sampleDataCode, sandbox);
  vm.runInContext(aiCode, sandbox);
  vm.runInContext(templateCode, sandbox);

  const SAMPLE_DATA = sandbox.SAMPLE_DATA;
  const generateLocalResume = sandbox.generateLocalResume;
  const generateLatexFromForm = sandbox.generateLatexFromForm;

  if (typeof generateLocalResume !== "function") {
    throw new Error("generateLocalResume is not defined in sandbox.");
  }
  if (typeof generateLatexFromForm !== "function") {
    throw new Error("generateLatexFromForm is not defined in sandbox.");
  }

  // Run local resume keywords engine
  const resumeResult = generateLocalResume(SAMPLE_DATA);
  
  // Format the outputs to match form structure for compilation
  const compiledData = {
    ...SAMPLE_DATA,
    education: resumeResult.education || SAMPLE_DATA.education,
    experience: resumeResult.experience || SAMPLE_DATA.experience,
    projects: resumeResult.selectedProjects || SAMPLE_DATA.projects,
    skills: Array.isArray(resumeResult.skills) 
      ? resumeResult.skills 
      : Object.entries(resumeResult.skills || {}).map(([k, v]) => ({ label: k, value: Array.isArray(v) ? v.join(", ") : String(v) })),
    certificates: resumeResult.selectedCertificates || SAMPLE_DATA.certificates,
    customSections: [
      {
        title: "Achievements",
        items: (resumeResult.achievements || []).map(ach => ({ title: ach, subtitle: "", date: "", bullets: [] }))
      }
    ]
  };

  const sectionOrder = ["education", "experience", "projects", "certificates", "skills", "achievements"];
  const latexCode = generateLatexFromForm(compiledData, "jakes_resume", "normal", sectionOrder);

  // Write outputs to files
  const latexOutputPath = path.join(__dirname, "output-resume.tex");
  const jsonOutputPath = path.join(__dirname, "output-analysis.json");

  fs.writeFileSync(latexOutputPath, latexCode, "utf8");
  fs.writeFileSync(jsonOutputPath, JSON.stringify(resumeResult, null, 2), "utf8");

  console.log(`✅ Generation completed successfully!`);
  console.log(`📁 Generated LaTeX file: ${latexOutputPath}`);
  console.log(`📁 Generated JSON analysis file: ${jsonOutputPath}\n`);

  console.log("=========================================");
  console.log("📊 ATS Analysis Summary:");
  console.log("=========================================");
  console.log(`Estimated ATS Score: ${resumeResult.atsScore}%`);
  console.log(`Target Role: ${resumeResult.targetRole}`);
  console.log(`Matched Keywords (${resumeResult.matchedKeywords.length}): ${resumeResult.matchedKeywords.join(", ")}`);
  console.log(`Missing Keywords (${resumeResult.missingKeywords.length}): ${resumeResult.missingKeywords.join(", ")}`);
  console.log(`Selection Reason: ${resumeResult.selectionReason}`);
  console.log(`Suggestions:\n${resumeResult.suggestions.map(s => ` - ${s}`).join("\n")}`);
  console.log("=========================================\n");

  process.exit(0);
} catch (err) {
  console.error("❌ Generation failed:");
  console.error(err.stack || err.message);
  process.exit(1);
}
