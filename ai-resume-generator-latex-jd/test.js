const fs = require("fs");
const path = require("path");

console.log("=========================================");
console.log("🧪 Overleaf Live Editor Compiler Test Suite");
console.log("=========================================\n");

try {
  // Load template engine
  const templatePath = path.join(__dirname, "js", "templateEngine.js");
  const { TEMPLATES, compileLatexToHtml, generateLatexFromForm } = require(templatePath);

  console.log("✅ templateEngine.js loaded successfully.");

  // Sample Form Data matching Jake Ryan's CV
  const sampleFormData = {
    name: "Jake Ryan",
    email: "jake@su.edu",
    phone: "123-456-7890",
    github: "https://github.com/jake",
    linkedin: "https://linkedin.com/in/jake",
    leetcode: "",
    education: [
      { institution: "Southwestern University", location: "Georgetown, TX", degree: "Bachelor of Arts in Computer Science, Minor in Business", duration: "Aug. 2018 -- May 2021" }
    ],
    experience: [
      {
        company: "Texas A&M University",
        location: "College Station, TX",
        role: "Undergraduate Research Assistant",
        duration: "June 2020 -- Present",
        bullets: [
          "Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems",
          "Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data"
        ]
      }
    ],
    projects: [
      {
        title: "Gitlytics",
        technologies: "Python, Flask, React, PostgreSQL, Docker",
        date: "June 2020 -- Present",
        bullets: [
          "Developed a full-stack web application using with Flask serving a REST API with React as the frontend"
        ]
      }
    ],
    skills: {
      languages: "Java, Python, C/C++",
      frameworks: "React, Node.js",
      databases: "Git, Docker",
      tools: "pandas, NumPy"
    }
  };

  // Test 1: Generate LaTeX from Form
  console.log("🏃 Running Test 1: generateLatexFromForm...");
  const latexResult = generateLatexFromForm(sampleFormData, "jakes_resume", "normal");
  
  if (!latexResult) throw new Error("Generated LaTeX is empty");
  if (!latexResult.includes("\\begin{document}")) throw new Error("Missing \\begin{document}");
  if (!latexResult.includes("Jake Ryan")) throw new Error("Candidate name not found in LaTeX");
  if (!latexResult.includes("Southwestern University")) throw new Error("Education details not found in LaTeX");
  if (!latexResult.includes("Undergraduate Research Assistant")) throw new Error("Experience details not found in LaTeX");

  console.log("✅ Test 1 Passed: LaTeX generated successfully.");

  // Test 2: Compile LaTeX to HTML (nested braces check)
  console.log("\n🏃 Running Test 2: compileLatexToHtml nested braces check...");
  
  // Custom LaTeX with nested braces in projects
  const nestedLatex = `
  \\begin{document}
  \\begin{center}
      \\textbf{\\Huge \\scshape Jake Ryan} \\\\
      \\small 123-456-7890 $|$ \\href{mailto:jake@su.edu}{\\underline{jake@su.edu}}
  \\end{center}
  \\section{Projects}
  \\resumeSubHeadingListStart
    \\resumeProjectHeading
        {\\textbf{Gitlytics} $|$ \\emph{Python, Flask}}{June 2020 -- Present}
        \\resumeItemListStart
          \\resumeItem{Developed a full-stack web application}
        \\resumeItemListEnd
  \\resumeSubHeadingListEnd
  \\end{document}
  `;

  const htmlResult = compileLatexToHtml(nestedLatex);

  if (htmlResult.includes("compile-error")) {
    throw new Error(`Compiler returned compilation error: ${htmlResult}`);
  }
  if (!htmlResult.includes("Jake Ryan")) throw new Error("Candidate name not found in HTML");
  if (!htmlResult.includes("Gitlytics")) throw new Error("Project title 'Gitlytics' not compiled in HTML");
  if (htmlResult.includes("\\resumeProjectHeading")) throw new Error("Raw \\resumeProjectHeading tag remained uncompiled in HTML");
  if (htmlResult.includes("\\textbf")) throw new Error("Raw \\textbf tag remained uncompiled in HTML");
  if (!htmlResult.includes("<strong>Gitlytics</strong>")) throw new Error("Project title was not formatted as bold <strong>");

  console.log("✅ Test 2 Passed: Nested braces and formatting parsed correctly.");

  console.log("\n=========================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! Compiler is error-free.");
  console.log("=========================================");
  process.exit(0);

} catch (err) {
  console.error("\n❌ TEST SUITE FAILED:");
  console.error(err.stack || err.message);
  process.exit(1);
}
