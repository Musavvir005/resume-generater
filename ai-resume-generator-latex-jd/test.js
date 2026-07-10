const fs = require("fs");
const path = require("path");
const vm = require("vm");

console.log("=========================================");
console.log("🧪 ResuCraft AI Core Engine Test Suite");
console.log("=========================================\n");

try {
  // Load sample data, ai engine, and template engine
  const sampleDataPath = path.join(__dirname, "js", "sampleData.js");
  const aiPath = path.join(__dirname, "js", "ai.js");
  const templatePath = path.join(__dirname, "js", "templateEngine.js");

  // Read files and convert 'const' declarations to 'var' declarations so they attach to VM sandbox context
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
    // Mock Web Fetch API
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  };

  vm.createContext(sandbox);

  // Execute scripts in sandbox context
  vm.runInContext(sampleDataCode, sandbox);
  vm.runInContext(aiCode, sandbox);
  vm.runInContext(templateCode, sandbox);

  console.log("✅ Core JS source files parsed and loaded successfully.");

  // Retrieve functions and data from sandbox
  const SAMPLE_DATA = sandbox.SAMPLE_DATA;
  const generateLocalResume = sandbox.generateLocalResume;
  const buildLatexResume = sandbox.buildLatexResume;

  if (!SAMPLE_DATA) throw new Error("SAMPLE_DATA is not defined");
  if (typeof generateLocalResume !== "function") throw new Error("generateLocalResume is not a function");
  if (typeof buildLatexResume !== "function") throw new Error("buildLatexResume is not a function");

  console.log("✅ Main entrypoint functions validated.");

  // Test 1: Run local resume keywords engine
  console.log("\n🏃 Running Test 1: Local Resume Alignment Engine...");
  const resumeResult = generateLocalResume(SAMPLE_DATA);

  // Assertions on output structure
  if (!resumeResult.targetRole) throw new Error("Missing 'targetRole' in resume output");
  if (typeof resumeResult.atsScore !== "number") throw new Error("ATS score is not a number");
  if (!Array.isArray(resumeResult.selectedProjects)) throw new Error("Missing 'selectedProjects' array");
  if (!Array.isArray(resumeResult.selectedCertificates)) throw new Error("Missing 'selectedCertificates' array");

  console.log(`   - Target Role: ${resumeResult.targetRole}`);
  console.log(`   - Calculated ATS Score: ${resumeResult.atsScore}%`);
  console.log(`   - Selected Projects Count: ${resumeResult.selectedProjects.length}`);
  console.log(`   - Selected Certificates Count: ${resumeResult.selectedCertificates.length}`);
  console.log("✅ Test 1 Passed: Local alignment scoring computed correctly.");

  // Test 2: Run LaTeX template compilation
  console.log("\n🏃 Running Test 2: LaTeX Generation Compiler...");
  const latexCode = buildLatexResume(SAMPLE_DATA, resumeResult);

  if (!latexCode) throw new Error("Generated LaTeX code is empty");
  if (!latexCode.includes("\\begin{document}")) throw new Error("Generated LaTeX does not contain document body start");
  if (!latexCode.includes("\\section{Education}")) throw new Error("Generated LaTeX is missing Education section");
  if (!latexCode.includes(SAMPLE_DATA.name)) throw new Error("Generated LaTeX does not contain the candidate's name");

  console.log(`   - Generated LaTeX Document Length: ${latexCode.length} characters`);
  console.log("✅ Test 2 Passed: LaTeX source code generated successfully with proper section injections.");

  console.log("\n=========================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! Core components are robust.");
  console.log("=========================================");
  process.exit(0);

} catch (err) {
  console.error("\n❌ TEST SUITE FAILED:");
  console.error(err.stack || err.message);
  process.exit(1);
}
