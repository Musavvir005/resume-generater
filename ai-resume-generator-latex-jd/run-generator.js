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
  const templateCode = fs.readFileSync(templatePath, "utf8")
    .replace(/function\s+buildLatexResume\b/, "var buildLatexResume = function");

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
  const buildLatexResume = sandbox.buildLatexResume;

  // Run local resume keywords engine
  const resumeResult = generateLocalResume(SAMPLE_DATA);
  const latexCode = buildLatexResume(SAMPLE_DATA, resumeResult);

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
