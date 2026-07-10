# ResuCraft AI: Job-Description-Based Full-Stack LaTeX Resume Generator

ResuCraft AI is an ATS-optimized, high-fidelity resume generation tool that matches candidate profiles against target job descriptions (JDs). It automatically ranks, selects, and formats the most relevant achievements, projects, and certifications into a premium, single-page LaTeX document.

Built with **Node.js, Express, SQLite, and vanilla CSS/JavaScript**, this application features full-step form logic, responsive layouts, client-side caching, and secure SQLite authentication.

---

## ✨ Features & Capabilities

- **SQLite Account Auth**: Sign up and sign in to securely save and load your resume inputs in a local SQLite database (using bcrypt hashing and JWT authorization).
- **Multi-Step Form Wizard**: Seamless inputs across categories (Profile, Education, Experience, Patents/Publications, Projects, Certifications, and Skills) with automatic local-draft auto-saving.
- **Job-Targeted Customization**: Pasting a job description triggers the matching engine to filter down to the most relevant projects and certificates based on the configured counts.
- **Two Generation Modes**:
  - **Local Keyword Ranking (No-API Fallback)**: Automatically extracts technical terms, scores items by overlap, ranks them, and estimates an ATS score.
  - **Gemini AI Neural Alignment**: Connects to the Gemini API (using your key stored locally in the browser) to restructure, refine, and write action-oriented bullet points tailored to the job description.
- **Fidelity LaTeX Rendering**: Dynamically creates clean, single-page TeX code utilizing standard templates. Includes typographic enhancements (such as smart quote conversion replacing straight double quotes with professional LaTeX curly double quotes `` `...'' ``).
- **One-Click Export**: Download the raw `.tex` file, copy the LaTeX source code, print to PDF, or export directly to **Overleaf** for compiling.

---

## 📂 Project Directory Structure

```text
ai-resume-generator-latex-jd/
├── css/
│   └── style.css            # Responsive layout rules with premium dark/light themes
├── js/
│   ├── ai.js                # Core keyword scoring and Gemini API integration
│   ├── app.js               # Event-binding controllers and multi-page wizard state handlers
│   ├── sampleData.js        # Anonymized, high-quality candidate profile dataset
│   └── templateEngine.js    # LaTeX parser and HTML preview compiler
├── templates/
│   ├── original-user-format.tex          # Original high-fidelity user document base
│   └── resume-template-with-placeholders.tex # Compiled template file
├── database.db              # Local SQLite database (git-ignored)
├── server.js                # Express REST API server hosting backend routers
├── test.js                  # Automated engine validation suite
├── run-generator.js         # Command-line generator runner
├── output-resume.tex        # Generated resume TeX source (git-ignored)
├── output-analysis.json     # Generated ATS audit metrics (git-ignored)
├── package.json             # NPM project definitions
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Install & Build native modules
```bash
# Clone the repository and navigate to the project directory
cd ai-resume-generator-latex-jd

# Install Express, SQLite3, bcryptjs, and dependencies
npm install

# Rebuild native SQLite binary dependencies for your OS (Windows/macOS/Linux)
npm rebuild sqlite3
```

### 2. Run Validation Tests
Run the local validation script to test the keyword extraction and LaTeX generation engine:
```bash
node test.js
```
*Output:*
```text
=========================================
🧪 ResuCraft AI Core Engine Test Suite
=========================================
✅ Core JS source files parsed and loaded successfully.
✅ Main entrypoint functions validated.
✅ Test 1 Passed: Local alignment scoring computed correctly.
✅ Test 2 Passed: LaTeX source code generated successfully with proper section injections.
🎉 ALL TESTS PASSED SUCCESSFULLY!
```

### 3. Run the Local Command Line Generator
To instantly compile the sample generic candidate profile under the target job description:
```bash
node run-generator.js
```
This generates the optimized `output-resume.tex` and the keyword metric report `output-analysis.json` directly in the project root.

### 4. Start the Full-Stack Web Application
```bash
npm start
```
Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📈 Local Keyword Generation Audit Results
Running the anonymized sample configuration yields the following metrics:
- **Estimated ATS Score**: `74%`
- **Target Role**: `AI/ML Engineer Intern`
- **Selected Projects**: `Project XXXXX - Medical Image Analysis System`, `Project XXXXX - AI-Powered Documentation ChatBot`, `Project XXXXX - User Attendance System`
- **Matched Keywords (22)**: `Python`, `Fastapi`, `REST API`, `API`, `Git`, `Docker`, `Machine Learning`, `Deep Learning`, `Computer Vision`, `Tensorflow`, `Pytorch`, `CNNs`, `Rag`, `Image Analysis`, `Model Evaluation`...
- **Selection Basis**: Items are sorted by density of matching keywords extracted from the JD.

---

## 📝 License
This project is open-source. For education and academic portfolio evaluations.
