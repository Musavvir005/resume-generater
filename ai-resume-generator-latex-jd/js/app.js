const elements = {
  form: document.getElementById("resumeForm"),
  apiKey: document.getElementById("apiKey"),
  modelName: document.getElementById("modelName"),
  saveApiKeyBtn: document.getElementById("saveApiKeyBtn"),
  clearApiKeyBtn: document.getElementById("clearApiKeyBtn"),
  generateLocalBtn: document.getElementById("generateLocalBtn"),
  loadSampleBtn: document.getElementById("loadSampleBtn"),
  clearFormBtn: document.getElementById("clearFormBtn"),
  themeToggle: document.getElementById("themeToggle"),
  jdFile: document.getElementById("jdFile"),
  status: document.getElementById("status"),
  atsScore: document.getElementById("atsScore"),
  selectedCounts: document.getElementById("selectedCounts"),
  resumePreview: document.getElementById("resumePreview"),
  latexOutput: document.getElementById("latexOutput"),
  analysisOutput: document.getElementById("analysisOutput"),
  downloadTexBtn: document.getElementById("downloadTexBtn"),
  copyLatexBtn: document.getElementById("copyLatexBtn"),
  downloadJsonBtn: document.getElementById("downloadJsonBtn"),
  printBtn: document.getElementById("printBtn"),
  overleafBtn: document.getElementById("overleafBtn"),
  mainOverleafBtn: document.getElementById("mainOverleafBtn"),
  educationContainer: document.getElementById("educationContainer"),
  experienceContainer: document.getElementById("experienceContainer"),
  patentContainer: document.getElementById("patentContainer"),
  projectsContainer: document.getElementById("projectsContainer"),
  certificatesContainer: document.getElementById("certificatesContainer"),
  achievementsContainer: document.getElementById("achievementsContainer")
};

let latestLatex = "";
let latestJson = null;
let currentStep = 1;

// Auth states
let token = localStorage.getItem("token") || null;
let username = localStorage.getItem("username") || null;
let isRegisterMode = false;
let tagDragSrcEl = null;

// Consolidated Multi-Page Draft Memory
let draftData = {
  jobTitle: "",
  projectCount: 3,
  certificateCount: 3,
  achievementCount: 3,
  skillsPerCategory: 6,
  name: "",
  email: "",
  phone: "",
  github: "",
  linkedin: "",
  leetcode: "",
  education: [],
  experience: [],
  patents: [],
  projects: [],
  certificates: [],
  achievements: [],
  skills: {
    languages: "",
    frameworks: "",
    databases: "",
    tools: "",
    core: ""
  },
  jobDescription: ""
};

const STEP_INFO = {
  1: { title: "Create Profile", subtitle: "Provide your base credentials and academic history." },
  2: { title: "Experience & Credentials", subtitle: "Highlight your internships, scientific papers, and projects." },
  3: { title: "Job Target & AI Optimization", subtitle: "Paste the job description and trigger neural resume mapping." },
  4: { title: "Optimized Resume Output", subtitle: "Download, copy, or print your tailored LaTeX document." },
  5: { title: "ATS Refinement Dashboard", subtitle: "Directly toggle project inclusions, manage certificates, and resolve missing skills in real-time." }
};

// Auto-resolve active step based on pathname
const path = window.location.pathname;
if (path.includes("experience.html")) {
  currentStep = 2;
} else if (path.includes("ai.html")) {
  currentStep = 3;
} else if (path.includes("output.html")) {
  currentStep = 4;
} else if (path.includes("analysis.html")) {
  currentStep = 5;
} else {
  currentStep = 1;
}

init();

function init() {
  // Force scroll to top on page load/navigation and disable cached scroll position restoration
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  // Load existing draft memory from localStorage
  const savedDraft = localStorage.getItem("draftResumeData");
  if (savedDraft) {
    try {
      draftData = { ...draftData, ...JSON.parse(savedDraft) };
    } catch (err) {
      console.error("Failed to load draft data:", err);
    }
  }

  // Populate dynamic form settings if present
  if (elements.apiKey) {
    elements.apiKey.value = localStorage.getItem("geminiApiKey") || "";
  }
  if (elements.modelName) {
    elements.modelName.value = localStorage.getItem("geminiModel") || "gemini-2.5-flash";
  }
  document.body.classList.toggle("dark", localStorage.getItem("theme") === "dark");

  // Bind Form Save Triggers
  if (elements.form) {
    elements.form.addEventListener("input", saveDraftToLocal);
    elements.form.addEventListener("submit", handleAiGenerate);
  }

  if (elements.saveApiKeyBtn) elements.saveApiKeyBtn.addEventListener("click", saveApiKey);
  if (elements.clearApiKeyBtn) elements.clearApiKeyBtn.addEventListener("click", clearApiKey);
  if (elements.modelName) {
    elements.modelName.addEventListener("change", () => localStorage.setItem("geminiModel", elements.modelName.value));
  }
  if (elements.generateLocalBtn) elements.generateLocalBtn.addEventListener("click", handleLocalGenerate);
  if (elements.loadSampleBtn) elements.loadSampleBtn.addEventListener("click", loadSampleData);
  if (elements.clearFormBtn) elements.clearFormBtn.addEventListener("click", clearForm);
  if (elements.themeToggle) elements.themeToggle.addEventListener("click", toggleTheme);
  if (elements.jdFile) elements.jdFile.addEventListener("change", handleJdFileUpload);
  if (elements.downloadTexBtn) elements.downloadTexBtn.addEventListener("click", downloadTex);
  if (elements.copyLatexBtn) elements.copyLatexBtn.addEventListener("click", copyLatex);
  if (elements.downloadJsonBtn) elements.downloadJsonBtn.addEventListener("click", downloadJson);
  if (elements.printBtn) elements.printBtn.addEventListener("click", () => window.print());
  if (elements.overleafBtn) elements.overleafBtn.addEventListener("click", openInOverleaf);
  if (elements.mainOverleafBtn) elements.mainOverleafBtn.addEventListener("click", openInOverleaf);

  if (document.getElementById("addEducationBtn")) {
    document.getElementById("addEducationBtn").addEventListener("click", () => { addEducation(); saveDraftToLocal(); });
  }
  if (document.getElementById("addExperienceBtn")) {
    document.getElementById("addExperienceBtn").addEventListener("click", () => { addExperience(); saveDraftToLocal(); });
  }
  if (document.getElementById("addPatentBtn")) {
    document.getElementById("addPatentBtn").addEventListener("click", () => { addPatent(); saveDraftToLocal(); });
  }
  if (document.getElementById("addProjectBtn")) {
    document.getElementById("addProjectBtn").addEventListener("click", () => { addProject(); saveDraftToLocal(); });
  }
  if (document.getElementById("addCertificateBtn")) {
    document.getElementById("addCertificateBtn").addEventListener("click", () => { addCertificate(); saveDraftToLocal(); });
  }
  if (document.getElementById("addAchievementBtn")) {
    document.getElementById("addAchievementBtn").addEventListener("click", () => { addAchievement(); saveDraftToLocal(); });
  }

  if (document.querySelectorAll(".tab")) {
    document.querySelectorAll(".tab").forEach(button => {
      button.addEventListener("click", () => {
        if (button.dataset.tab === "analysis" && !window.location.pathname.includes("analysis.html")) {
          window.location.href = "analysis.html";
        } else {
          activateTab(button.dataset.tab);
        }
      });
    });
  }

  // Setup Wizard Elements
  elements.nextBtn = document.getElementById("nextBtn");
  elements.prevBtn = document.getElementById("prevBtn");
  elements.wizardSteps = document.querySelectorAll(".wizard-step");
  elements.wizardNav = document.getElementById("wizardNav");
  elements.menuItems = document.querySelectorAll(".menu-item");
  elements.feedTitle = document.getElementById("feedTitle");
  elements.feedSubtitle = document.getElementById("feedSubtitle");
  elements.avatarImg = document.getElementById("avatarImg");
  elements.scoreCircle = document.getElementById("scoreCircle");

  if (elements.nextBtn) elements.nextBtn.addEventListener("click", handleNextStep);
  if (elements.prevBtn) elements.prevBtn.addEventListener("click", handlePrevStep);

  // Auth Elements Caching
  elements.authModal = document.getElementById("authModal");
  elements.authModalBtn = document.getElementById("authModalBtn");
  elements.closeAuthModal = document.getElementById("closeAuthModal");
  elements.logoutBtn = document.getElementById("logoutBtn");
  elements.userStatusText = document.getElementById("userStatusText");
  elements.userBadge = document.getElementById("userBadge");
  elements.authForm = document.getElementById("authForm");
  elements.authUsername = document.getElementById("authUsername");
  elements.authPassword = document.getElementById("authPassword");
  elements.authSubmitBtn = document.getElementById("authSubmitBtn");
  elements.authModalTitle = document.getElementById("authModalTitle");
  elements.toggleAuthMode = document.getElementById("toggleAuthMode");
  elements.authError = document.getElementById("authError");
  elements.authSuccess = document.getElementById("authSuccess");
  elements.saveProfileBtn = document.getElementById("saveProfileBtn");

  // Auth Events
  if (elements.authModalBtn) elements.authModalBtn.addEventListener("click", openAuthModal);
  if (elements.closeAuthModal) elements.closeAuthModal.addEventListener("click", closeAuthModalPanel);
  if (elements.toggleAuthMode) {
    elements.toggleAuthMode.addEventListener("click", (e) => {
      e.preventDefault();
      toggleMode();
    });
  }
  if (elements.authForm) elements.authForm.addEventListener("submit", handleAuthSubmit);
  if (elements.logoutBtn) elements.logoutBtn.addEventListener("click", handleLogout);
  if (elements.saveProfileBtn) elements.saveProfileBtn.addEventListener("click", saveProfileToDb);

  // Populate draft values to DOM
  populateFormFields(draftData);

  // Add default dynamic card blocks if containers are blank
  if (elements.educationContainer && elements.educationContainer.children.length === 0) addEducation();
  if (elements.experienceContainer && elements.experienceContainer.children.length === 0) addExperience();
  if (elements.patentContainer && elements.patentContainer.children.length === 0) addPatent();
  if (elements.projectsContainer && elements.projectsContainer.children.length === 0) addProject();
  if (elements.certificatesContainer && elements.certificatesContainer.children.length === 0) addCertificate();
  if (elements.achievementsContainer && elements.achievementsContainer.children.length === 0) addAchievement();

  // If on Output page or ATS Tuning page, restore last results
  if (currentStep === 4 || currentStep === 5) {
    loadLatestResultFromLocal();
  }

  checkAuthState();
  updateStepperUI();
  setupInteractiveSkillsEditor();

  // Auto fast-forward to step 3 on index.html if name & email are pre-filled
  const isIndexPage = path.includes("index.html") || path.endsWith("/") || path === "";
  if (currentStep === 1 && isIndexPage && draftData.name && draftData.email) {
    setTimeout(() => {
      window.location.href = "ai.html";
    }, 100);
  }
}

function handleNextStep() {
  if (currentStep === 1) {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    if (!nameInput.checkValidity() || !emailInput.checkValidity()) {
      elements.form.reportValidity();
      return;
    }
    window.location.href = "experience.html";
  } else if (currentStep === 2) {
    window.location.href = "ai.html";
  }
}

function handlePrevStep() {
  if (currentStep === 2) {
    window.location.href = "index.html";
  } else if (currentStep === 3) {
    window.location.href = "experience.html";
  } else if (currentStep === 4) {
    window.location.href = "ai.html";
  }
}

function updateStepperUI() {
  elements.menuItems.forEach((indicator, i) => {
    const stepNum = i + 1;
    indicator.classList.toggle("active", stepNum === currentStep);
  });

  if (STEP_INFO[currentStep] && elements.feedTitle) {
    elements.feedTitle.textContent = STEP_INFO[currentStep].title;
    elements.feedSubtitle.textContent = STEP_INFO[currentStep].subtitle;
  }

  if (!elements.prevBtn || !elements.nextBtn || !elements.wizardNav) return;

  if (currentStep === 1) {
    elements.prevBtn.style.visibility = "hidden";
    elements.nextBtn.style.visibility = "visible";
    elements.nextBtn.textContent = "Next: Exp & Projects \u2192";
    elements.wizardNav.style.display = "flex";
  } else if (currentStep === 2) {
    elements.prevBtn.style.visibility = "visible";
    elements.prevBtn.textContent = "\u2190 Back";
    elements.nextBtn.style.visibility = "visible";
    elements.nextBtn.textContent = "Next: AI & Job Target \u2192";
    elements.wizardNav.style.display = "flex";
  } else if (currentStep === 3) {
    elements.prevBtn.style.visibility = "visible";
    elements.prevBtn.textContent = "\u2190 Back";
    elements.nextBtn.style.visibility = "hidden";
    elements.wizardNav.style.display = "flex";
  } else if (currentStep === 4) {
    elements.prevBtn.style.visibility = "visible";
    elements.prevBtn.textContent = "\u2190 Edit Inputs";
    elements.nextBtn.style.visibility = "hidden";
    elements.wizardNav.style.display = "flex";
  }
}

// Local Caching Controllers
function saveDraftToLocal() {
  const data = collectData();
  localStorage.setItem("draftResumeData", JSON.stringify(data));
}

function loadLatestResultFromLocal() {
  const savedJson = localStorage.getItem("latestResumeResultData");
  const savedLatex = localStorage.getItem("latestResumeLatex");
  if (savedJson && savedLatex) {
    try {
      const data = JSON.parse(savedJson);
      latestJson = data;
      latestLatex = savedLatex;
      
      if (elements.resumePreview) {
        elements.resumePreview.classList.remove("empty-state");
        elements.resumePreview.innerHTML = buildHtmlPreview(data.input, data.resume);
      }
      if (elements.latexOutput) elements.latexOutput.textContent = latestLatex;
      if (elements.analysisOutput) elements.analysisOutput.innerHTML = buildAnalysisHtml(data.resume);
      
      const score = data.resume.atsScore || 0;
      if (elements.atsScore) elements.atsScore.textContent = `${score}%`;
      
      if (elements.scoreCircle) {
        elements.scoreCircle.className = "circle-progress-wrapper";
        if (score >= 80) {
          elements.scoreCircle.classList.add("high-score");
        } else if (score >= 60) {
          elements.scoreCircle.classList.add("med-score");
        }
      }
      if (elements.selectedCounts) {
        elements.selectedCounts.textContent = `${(data.resume.selectedProjects || []).length} Projects / ${(data.resume.selectedCertificates || []).length} Certificates Selected`;
      }
    } catch (err) {
      console.error("Failed to load last result:", err);
    }
  }
}

// Authentication Logic
function checkAuthState() {
  token = localStorage.getItem("token");
  username = localStorage.getItem("username");

  if (!elements.userStatusText || !elements.avatarImg || !elements.userBadge) return;

  if (token && username) {
    elements.userStatusText.textContent = username;
    elements.avatarImg.textContent = username.substring(0, 2).toUpperCase();
    elements.avatarImg.style.background = "var(--ig-gradient)";
    elements.avatarImg.style.color = "#ffffff";
    
    elements.userBadge.classList.add("logged-in");
    if (elements.authModalBtn) elements.authModalBtn.style.display = "none";
    if (elements.logoutBtn) elements.logoutBtn.style.display = "inline-block";
    if (elements.saveProfileBtn) elements.saveProfileBtn.style.display = "inline-block";
    
    // Auto fetch profile if none is currently loaded
    if (!localStorage.getItem("draftResumeData")) {
      fetchProfileFromDb();
    }
  } else {
    elements.userStatusText.textContent = "Guest Mode";
    elements.avatarImg.textContent = "G";
    elements.avatarImg.style.background = "var(--secondary)";
    elements.avatarImg.style.color = "var(--text)";

    elements.userBadge.classList.remove("logged-in");
    if (elements.authModalBtn) elements.authModalBtn.style.display = "inline-block";
    if (elements.logoutBtn) elements.logoutBtn.style.display = "none";
    if (elements.saveProfileBtn) elements.saveProfileBtn.style.display = "none";
  }
}

function openAuthModal() {
  isRegisterMode = false;
  elements.authModalTitle.textContent = "Sign In";
  elements.authSubmitBtn.textContent = "Sign In";
  elements.toggleAuthMode.textContent = "Create one now";
  elements.authError.style.display = "none";
  elements.authSuccess.style.display = "none";
  elements.authForm.reset();
  elements.authModal.style.display = "grid";
}

function closeAuthModalPanel() {
  elements.authModal.style.display = "none";
}

function toggleMode() {
  isRegisterMode = !isRegisterMode;
  elements.authError.style.display = "none";
  elements.authSuccess.style.display = "none";
  
  if (isRegisterMode) {
    elements.authModalTitle.textContent = "Register Account";
    elements.authSubmitBtn.textContent = "Register";
    elements.toggleAuthMode.textContent = "Sign in here";
  } else {
    elements.authModalTitle.textContent = "Sign In";
    elements.authSubmitBtn.textContent = "Sign In";
    elements.toggleAuthMode.textContent = "Create one now";
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  elements.authError.style.display = "none";
  elements.authSuccess.style.display = "none";

  const usernameVal = elements.authUsername.value.trim();
  const passwordVal = elements.authPassword.value;

  const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
  
  try {
    elements.authSubmitBtn.disabled = true;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: usernameVal, password: passwordVal })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "An authentication error occurred.");
    }

    if (isRegisterMode) {
      elements.authSuccess.textContent = data.message;
      elements.authSuccess.style.display = "block";
      setTimeout(() => {
        toggleMode();
        elements.authUsername.value = usernameVal;
      }, 1500);
    } else {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      closeAuthModalPanel();
      checkAuthState();
      showStatus("Logged in successfully. Fetching saved profile.", false, true);
    }
  } catch (err) {
    elements.authError.textContent = err.message;
    elements.authError.style.display = "block";
  } finally {
    elements.authSubmitBtn.disabled = false;
  }
}

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("draftResumeData");
  localStorage.removeItem("latestResumeResultData");
  localStorage.removeItem("latestResumeLatex");
  clearForm(true);
  checkAuthState();
  showStatus("Logged out successfully.");
}

async function fetchProfileFromDb() {
  if (!token) return;
  
  try {
    const res = await fetch("/api/profile", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await res.json();
    
    if (res.ok && data.profile) {
      draftData = { ...draftData, ...data.profile };
      localStorage.setItem("draftResumeData", JSON.stringify(draftData));
      populateFormFields(draftData);
      showStatus("Successfully loaded saved profile from SQLite database.", false, true);
      
      // Auto-routing if data is filled
      if (draftData.name && draftData.email && currentStep === 1) {
        window.location.href = "ai.html";
      }
    }
  } catch (err) {
    console.error("Failed to fetch profile:", err);
  }
}

async function saveProfileToDb() {
  if (!token) return showStatus("You must be logged in to save details.", true);
  
  saveDraftToLocal();
  
  try {
    elements.saveProfileBtn.disabled = true;
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ profile: draftData })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save profile.");
    
    showStatus(data.message, false, true);
  } catch (err) {
    showStatus(err.message, true);
  } finally {
    elements.saveProfileBtn.disabled = false;
  }
}

function populateFormFields(data) {
  draftData = { ...draftData, ...data };

  // Set values only for elements that exist on this page
  if (document.getElementById("jobTitle")) setValue("jobTitle", draftData.jobTitle);
  if (document.getElementById("projectCount")) setValue("projectCount", draftData.projectCount);
  if (document.getElementById("certificateCount")) setValue("certificateCount", draftData.certificateCount);
  if (document.getElementById("achievementCount")) setValue("achievementCount", draftData.achievementCount || 3);
  if (document.getElementById("skillsPerCategory")) setValue("skillsPerCategory", draftData.skillsPerCategory || 6);
  if (document.getElementById("name")) setValue("name", draftData.name);
  if (document.getElementById("email")) setValue("email", draftData.email);
  if (document.getElementById("phone")) setValue("phone", draftData.phone);
  if (document.getElementById("github")) setValue("github", draftData.github);
  if (document.getElementById("linkedin")) setValue("linkedin", draftData.linkedin);
  if (document.getElementById("leetcode")) setValue("leetcode", draftData.leetcode);
  
  if (document.getElementById("skillsLanguages") && draftData.skills) {
    setValue("skillsLanguages", draftData.skills.languages);
    setValue("skillsFrameworks", draftData.skills.frameworks);
    setValue("skillsDatabases", draftData.skills.databases);
    setValue("skillsTools", draftData.skills.tools);
    setValue("skillsCore", draftData.skills.core);
  }
  
  if (document.getElementById("jobDescription")) setValue("jobDescription", draftData.jobDescription);

  // Clear existing dynamic card containers and re-add if containers are in DOM
  if (document.getElementById("educationContainer") && elements.educationContainer) {
    elements.educationContainer.innerHTML = "";
    if (draftData.education) draftData.education.forEach(addEducation);
  }
  if (document.getElementById("experienceContainer") && elements.experienceContainer) {
    elements.experienceContainer.innerHTML = "";
    if (draftData.experience) draftData.experience.forEach(addExperience);
  }
  if (document.getElementById("patentContainer") && elements.patentContainer) {
    elements.patentContainer.innerHTML = "";
    if (draftData.patents) draftData.patents.forEach(addPatent);
  }
  if (document.getElementById("projectsContainer") && elements.projectsContainer) {
    elements.projectsContainer.innerHTML = "";
    if (draftData.projects) draftData.projects.forEach(addProject);
  }
  if (document.getElementById("certificatesContainer") && elements.certificatesContainer) {
    elements.certificatesContainer.innerHTML = "";
    if (draftData.certificates) draftData.certificates.forEach(addCertificate);
  }
  if (document.getElementById("achievementsContainer") && elements.achievementsContainer) {
    elements.achievementsContainer.innerHTML = "";
    if (draftData.achievements) {
      draftData.achievements.forEach(ach => {
        addAchievement(ach.text || ach);
      });
    }
  }
}

function saveApiKey() {
  const key = elements.apiKey.value.trim();
  if (!key) return showStatus("Enter an API key first.", true);
  localStorage.setItem("geminiApiKey", key);
  localStorage.setItem("geminiModel", elements.modelName.value);
  showStatus("API key saved locally in this browser.", false, true);
}

function clearApiKey() {
  localStorage.removeItem("geminiApiKey");
  elements.apiKey.value = "";
  showStatus("Saved API key cleared.");
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

async function handleJdFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  document.getElementById("jobDescription").value = text;
  saveDraftToLocal();
  showStatus("Job description file loaded.", false, true);
}

async function handleAiGenerate(event) {
  event.preventDefault();
  const data = collectData();
  const apiKey = elements.apiKey.value.trim();
  const modelName = elements.modelName.value;

  try {
    setBusy(true);
    showStatus("Analyzing JD, ranking projects/certificates, and generating resume with AI...");
    const prompt = buildResumePrompt(data);
    const aiResume = await callGemini({ apiKey, modelName, prompt });
    const resume = ensureCounts(aiResume, data);
    
    // Save generated results
    latestJson = { input: data, resume };
    latestLatex = buildLatexResume(data, resume);
    localStorage.setItem("latestResumeResultData", JSON.stringify(latestJson));
    localStorage.setItem("latestResumeLatex", latestLatex);
    
    showStatus("AI resume generated successfully.", false, true);
    
    // Perform browser routing to the output page!
    window.location.href = "output.html";
  } catch (error) {
    console.error(error);
    showStatus(`${error.message}. You can use Generate without AI for fallback.`, true);
  } finally {
    setBusy(false);
  }
}

function handleLocalGenerate() {
  const apiKey = elements.apiKey ? elements.apiKey.value.trim() : "";
  if (apiKey) {
    showStatus("API key detected. Using AI Optimization generation...", false, true);
    const mockEvent = { preventDefault: () => {} };
    handleAiGenerate(mockEvent);
    return;
  }

  const data = collectData();
  const resume = generateLocalResume(data);
  
  // Save generated results
  latestJson = { input: data, resume };
  latestLatex = buildLatexResume(data, resume);
  localStorage.setItem("latestResumeResultData", JSON.stringify(latestJson));
  localStorage.setItem("latestResumeLatex", latestLatex);
  
  showStatus("Local resume generated without AI. Redirecting...", false, true);
  
  // Perform browser routing to the output page!
  window.location.href = "output.html";
}

function renderResult(data, resume) {
  // Renders the preview elements if called while on Step 4
  latestJson = { input: data, resume };
  latestLatex = buildLatexResume(data, resume);

  if (elements.resumePreview) {
    elements.resumePreview.classList.remove("empty-state");
    elements.resumePreview.innerHTML = buildHtmlPreview(data, resume);
  }
  if (elements.latexOutput) elements.latexOutput.textContent = latestLatex;
  if (elements.analysisOutput) elements.analysisOutput.innerHTML = buildAnalysisHtml(resume);
  
  const score = resume.atsScore || 0;
  if (elements.atsScore) elements.atsScore.textContent = `${score}%`;
  
  if (elements.scoreCircle) {
    elements.scoreCircle.className = "circle-progress-wrapper";
    if (score >= 80) {
      elements.scoreCircle.classList.add("high-score");
    } else if (score >= 60) {
      elements.scoreCircle.classList.add("med-score");
    }
  }
  
  if (elements.selectedCounts) {
    elements.selectedCounts.textContent = `${(resume.selectedProjects || []).length} Projects / ${(resume.selectedCertificates || []).length} Certificates Selected`;
  }
  activateTab("preview");
}

function buildAnalysisHtml(resume) {
  return `
    <h3>Selection Reason</h3>
    <p>${escapeHtml(resume.selectionReason || "Projects and certificates were selected based on job description relevance.")}</p>

    <h3>Matched Keywords</h3>
    ${chipRow(resume.matchedKeywords || [])}

    <h3>Missing / Weak Keywords</h3>
    ${chipRow(resume.missingKeywords || [], true)}

    <h3>Selected Projects</h3>
    <ol>${(resume.selectedProjects || []).map(project => `<li><strong>${escapeHtml(project.title || "")}</strong> — ${escapeHtml(arrayToText(project.technologies))}</li>`).join("")}</ol>

    <h3>Selected Certificates</h3>
    <ol>${(resume.selectedCertificates || []).map(cert => `<li><strong>${escapeHtml(cert.title || "")}</strong> — ${escapeHtml(cert.reason || cert.issuer || "")}</li>`).join("")}</ol>

    <h3>Suggestions</h3>
    ${htmlBullets(resume.suggestions || [])}
  `;
}

function chipRow(items, missing = false) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return `<p class="note">None.</p>`;
  return `<div class="chip-row">${list.map(item => {
    if (missing) {
      const safeItem = escapeHtml(item).replace(/'/g, "\\'");
      return `<span class="chip missing" title="Click to add this missing skill" onclick="showAddMissingSkillMenu(event, '${safeItem}')">${escapeHtml(item)} <i class="fas fa-plus-circle" style="font-size:0.65rem; margin-left:3px;"></i></span>`;
    } else {
      return `<span class="chip">${escapeHtml(item)}</span>`;
    }
  }).join("")}</div>`;
}

function collectData() {
  // 1. Core Target Counts
  if (document.getElementById("jobTitle")) draftData.jobTitle = valueOf("jobTitle");
  if (document.getElementById("projectCount")) draftData.projectCount = clampInt(valueOf("projectCount"), 1, 8, 3);
  if (document.getElementById("certificateCount")) draftData.certificateCount = clampInt(valueOf("certificateCount"), 0, 8, 3);
  if (document.getElementById("achievementCount")) draftData.achievementCount = clampInt(valueOf("achievementCount"), 0, 8, 3);
  if (document.getElementById("skillsPerCategory")) draftData.skillsPerCategory = clampInt(valueOf("skillsPerCategory"), 3, 12, 6);

  // 2. Personal Details
  if (document.getElementById("name")) draftData.name = valueOf("name");
  if (document.getElementById("email")) draftData.email = valueOf("email");
  if (document.getElementById("phone")) draftData.phone = valueOf("phone");
  if (document.getElementById("github")) draftData.github = valueOf("github");
  if (document.getElementById("linkedin")) draftData.linkedin = valueOf("linkedin");
  if (document.getElementById("leetcode")) draftData.leetcode = valueOf("leetcode");

  // 3. Dynamic Card Lists
  if (document.getElementById("educationContainer") && elements.educationContainer) {
    draftData.education = collectCards("educationContainer", ["institution", "location", "degree", "duration"]);
  }
  if (document.getElementById("experienceContainer") && elements.experienceContainer) {
    draftData.experience = collectCards("experienceContainer", ["role", "duration", "company", "location", "bullets"]);
  }
  if (document.getElementById("patentContainer") && elements.patentContainer) {
    draftData.patents = collectCards("patentContainer", ["title", "detail"]);
  }
  if (document.getElementById("projectsContainer") && elements.projectsContainer) {
    draftData.projects = collectCards("projectsContainer", ["title", "technologies", "description", "features", "metrics", "link"]);
  }
  if (document.getElementById("certificatesContainer") && elements.certificatesContainer) {
    draftData.certificates = collectCards("certificatesContainer", ["title", "issuer", "date", "skills"]);
  }
  if (document.getElementById("achievementsContainer") && elements.achievementsContainer) {
    draftData.achievements = collectCards("achievementsContainer", ["text"]).map(item => item.text).filter(Boolean);
  }

  // 4. Technical Skills
  if (document.getElementById("skillsLanguages")) {
    draftData.skills = {
      languages: valueOf("skillsLanguages"),
      frameworks: valueOf("skillsFrameworks"),
      databases: valueOf("skillsDatabases"),
      tools: valueOf("skillsTools"),
      core: valueOf("skillsCore")
    };
  }

  // 5. Job Description
  if (document.getElementById("jobDescription")) draftData.jobDescription = valueOf("jobDescription");

  return draftData;
}

function collectCards(containerId, fields) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return [...container.querySelectorAll(".dynamic-card")].map(card => {
    const item = {};
    fields.forEach(field => {
      const input = card.querySelector(`[data-field="${field}"]`);
      item[field] = input ? input.value.trim() : "";
    });
    return item;
  }).filter(item => Object.values(item).some(Boolean));
}

function valueOf(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function clampInt(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function setBusy(isBusy) {
  const submitBtn = elements.form ? elements.form.querySelector("button[type='submit']") : null;
  [submitBtn, elements.generateLocalBtn, elements.loadSampleBtn].forEach(button => {
    if (button) button.disabled = isBusy;
  });
}

function showStatus(message, isError = false, isSuccess = false) {
  if (!elements.status) return;
  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
  elements.status.classList.toggle("success", isSuccess);
}

function activateTab(tabName) {
  if (!document.getElementById(`${tabName}Tab`)) return;
  document.querySelectorAll(".tab").forEach(button => button.classList.toggle("active", button.dataset.tab === tabName));
  document.querySelectorAll(".tab-content").forEach(section => section.classList.remove("active"));
  document.getElementById(`${tabName}Tab`).classList.add("active");
}

function addEducation(data = {}) {
  if (!elements.educationContainer) return;
  addCard(elements.educationContainer, "Education", [
    { field: "institution", label: "Institution", placeholder: "SRM University", value: data.institution },
    { field: "location", label: "Location", placeholder: "Amaravati, Andhra Pradesh", value: data.location },
    { field: "degree", label: "Degree / Details", placeholder: "B.Tech in CSE; CGPA: 7.57/10.0", value: data.degree },
    { field: "duration", label: "Duration", placeholder: "Jun 2021 -- May 2025", value: data.duration }
  ], "two");
}

function addExperience(data = {}) {
  if (!elements.experienceContainer) return;
  addCard(elements.experienceContainer, "Experience", [
    { field: "role", label: "Role", placeholder: "Software Engineering Intern", value: data.role },
    { field: "duration", label: "Duration", placeholder: "May 2024 -- Jul 2024", value: data.duration },
    { field: "company", label: "Company", placeholder: "Company name", value: data.company },
    { field: "location", label: "Location", placeholder: "City, State", value: data.location },
    { field: "bullets", label: "Bullet points", placeholder: "One bullet per line", value: data.bullets, textarea: true, full: true }
  ], "two");
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function addPatent(data = {}) {
  if (!elements.patentContainer) return;
  addCard(elements.patentContainer, "Patent / Publication", [
    { field: "title", label: "Title", placeholder: "Patent or publication title", value: data.title, full: true },
    { field: "detail", label: "Details", placeholder: "Patent approved / publication details", value: data.detail, textarea: true, full: true }
  ], "two");
}

function addProject(data = {}) {
  if (!elements.projectsContainer) return;
  addCard(elements.projectsContainer, "Project", [
    { field: "title", label: "Project Title", placeholder: "AI-Powered Documentation ChatBot", value: data.title },
    { field: "technologies", label: "Technologies", placeholder: "Python, React, FastAPI, RAG", value: data.technologies },
    { field: "description", label: "Description", placeholder: "Short project description", value: data.description, textarea: true, full: true },
    { field: "features", label: "Features", placeholder: "Feature list, comma-separated or line-by-line", value: data.features, textarea: true, full: true },
    { field: "metrics", label: "Metrics / Results", placeholder: "Example: 90% accuracy, 1,000+ pages processed", value: data.metrics },
    { field: "link", label: "Project Link", placeholder: "GitHub or live demo link", value: data.link }
  ], "two");
}

function addCertificate(data = {}) {
  if (!elements.certificatesContainer) return;
  addCard(elements.certificatesContainer, "Certificate", [
    { field: "title", label: "Certificate Title", placeholder: "Machine Learning Specialization", value: data.title },
    { field: "issuer", label: "Issuer", placeholder: "Coursera", value: data.issuer },
    { field: "date", label: "Date", placeholder: "2024", value: data.date },
    { field: "skills", label: "Related Skills", placeholder: "Machine Learning, Python, model evaluation", value: data.skills },
    { field: "link", label: "Credential Link (Optional)", placeholder: "e.g. Credly URL or verify link", value: data.link }
  ], "two");
}

function addAchievement(data = {}) {
  if (!elements.achievementsContainer) return;
  addCard(elements.achievementsContainer, "Achievement", [
    { field: "text", label: "Achievement", placeholder: "LeetCode -- Solved 350+ problems", value: data.text || data, full: true }
  ], "two");
}

function addCard(container, title, fields, gridClass) {
  const index = container.querySelectorAll(".dynamic-card").length + 1;
  const card = document.createElement("div");
  card.className = "dynamic-card";
  card.innerHTML = `
    <div class="dynamic-card-header">
      <strong>${title} ${index}</strong>
      <button type="button" class="ghost-btn remove-btn" aria-label="Remove ${escapeHtml(title)} ${index}">Remove</button>
    </div>
    <div class="grid ${gridClass}">
      ${fields.map(field => fieldTemplate(field)).join("")}
    </div>
  `;
  card.querySelector(".remove-btn").addEventListener("click", () => {
    card.remove();
    saveDraftToLocal();
  });
  container.appendChild(card);
}

function fieldTemplate(field) {
  const cls = field.full ? "full-width" : "";
  const value = escapeHtml(field.value || "");
  if (field.textarea) {
    return `<label class="${cls}">${field.label}<textarea data-field="${field.field}" placeholder="${escapeHtml(field.placeholder || "")}">${value}</textarea></label>`;
  }
  return `<label class="${cls}">${field.label}<input data-field="${field.field}" placeholder="${escapeHtml(field.placeholder || "")}" value="${value}" /></label>`;
}

function loadSampleData() {
  clearForm(false);
  
  draftData.jobTitle = SAMPLE_DATA.jobTitle;
  draftData.projectCount = SAMPLE_DATA.projectCount;
  draftData.certificateCount = SAMPLE_DATA.certificateCount;
  draftData.name = SAMPLE_DATA.name;
  draftData.email = SAMPLE_DATA.email;
  draftData.phone = SAMPLE_DATA.phone;
  draftData.github = SAMPLE_DATA.github;
  draftData.linkedin = SAMPLE_DATA.linkedin;
  draftData.leetcode = SAMPLE_DATA.leetcode;
  
  draftData.skills = {
    languages: SAMPLE_DATA.skills.languages,
    frameworks: SAMPLE_DATA.skills.frameworks,
    databases: SAMPLE_DATA.skills.databases,
    tools: SAMPLE_DATA.skills.tools,
    core: SAMPLE_DATA.skills.core
  };
  draftData.jobDescription = SAMPLE_DATA.jobDescription;
  draftData.education = SAMPLE_DATA.education;
  draftData.experience = SAMPLE_DATA.experience;
  draftData.patents = SAMPLE_DATA.patents;
  draftData.projects = SAMPLE_DATA.projects;
  draftData.certificates = SAMPLE_DATA.certificates;
  draftData.achievements = SAMPLE_DATA.achievements;

  localStorage.setItem("draftResumeData", JSON.stringify(draftData));
  populateFormFields(draftData);
  
  showStatus("Sample data loaded. Navigating to Step 3.", false, true);
  
  setTimeout(() => {
    window.location.href = "ai.html";
  }, 300);
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

function clearForm(addEmpty = true) {
  if (elements.form) elements.form.reset();
  
  if (elements.educationContainer) elements.educationContainer.innerHTML = "";
  if (elements.experienceContainer) elements.experienceContainer.innerHTML = "";
  if (elements.patentContainer) elements.patentContainer.innerHTML = "";
  if (elements.projectsContainer) elements.projectsContainer.innerHTML = "";
  if (elements.certificatesContainer) elements.certificatesContainer.innerHTML = "";
  if (elements.achievementsContainer) elements.achievementsContainer.innerHTML = "";
  
  setValue("projectCount", 3);
  setValue("certificateCount", 3);

  if (addEmpty) {
    addEducation();
    addExperience();
    addPatent();
    addProject();
    addCertificate();
    addAchievement();
  }

  latestLatex = "";
  latestJson = null;
  
  if (elements.resumePreview) {
    elements.resumePreview.innerHTML = "Generated resume preview will appear here. Enter details and generate to start.";
    elements.resumePreview.classList.add("empty-state");
  }
  if (elements.latexOutput) elements.latexOutput.textContent = "LaTeX output will appear here.";
  if (elements.analysisOutput) elements.analysisOutput.textContent = "JD analysis details will appear here.";
  if (elements.atsScore) elements.atsScore.textContent = "--";
  if (elements.selectedCounts) elements.selectedCounts.textContent = "--";

  draftData = {
    jobTitle: "",
    projectCount: 3,
    certificateCount: 3,
    name: "",
    email: "",
    phone: "",
    github: "",
    linkedin: "",
    leetcode: "",
    education: [],
    experience: [],
    patents: [],
    projects: [],
    certificates: [],
    achievements: [],
    skills: { languages: "", frameworks: "", databases: "", tools: "", core: "" },
    jobDescription: ""
  };
  localStorage.removeItem("draftResumeData");
  
  setupInteractiveSkillsEditor();
  showStatus("Form cleared.");
}

function downloadTex() {
  if (!latestLatex) return showStatus("Generate a resume first.", true);
  downloadFile(latestLatex, "generated-resume.tex", "application/x-tex");
}

function openInOverleaf() {
  if (!latestLatex) return showStatus("Generate a resume first.", true);
  
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://www.overleaf.com/docs";
  form.target = "_blank";
  
  const textarea = document.createElement("textarea");
  textarea.name = "snip";
  textarea.value = latestLatex;
  form.appendChild(textarea);
  
  const inputName = document.createElement("input");
  inputName.name = "name";
  inputName.value = "ResuCraft_AI_Resume.tex";
  form.appendChild(inputName);
  
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
  showStatus("Opening LaTeX code in Overleaf...", false, true);
}

async function copyLatex() {
  if (!latestLatex) return showStatus("Generate a resume first.", true);
  await navigator.clipboard.writeText(latestLatex);
  showStatus("LaTeX copied to clipboard.", false, true);
}

function downloadJson() {
  if (!latestJson) return showStatus("Generate a resume first.", true);
  downloadFile(JSON.stringify(latestJson, null, 2), "resume-analysis.json", "application/json");
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

// ==========================================
// 🛠️ Interactive Skills Tag Editor & ATS Popover
// ==========================================

function setupInteractiveSkillsEditor() {
  const categories = [
    { id: "skillsLanguages", label: "Languages", key: "languages" },
    { id: "skillsFrameworks", label: "Frameworks & Libraries", key: "frameworks" },
    { id: "skillsDatabases", label: "Databases", key: "databases" },
    { id: "skillsTools", label: "Developer Tools", key: "tools" },
    { id: "skillsCore", label: "Core Competencies", key: "core" }
  ];

  categories.forEach(cat => {
    const textarea = document.getElementById(cat.id);
    if (!textarea) return;

    // Hide original textarea
    textarea.style.display = "none";

    // Check if editor already exists
    let editor = textarea.parentNode.querySelector(".skills-tag-editor");
    if (!editor) {
      editor = document.createElement("div");
      editor.className = "skills-tag-editor";
      editor.setAttribute("data-for", cat.id);
      editor.setAttribute("data-key", cat.key);
      editor.innerHTML = `
        <div class="tag-list"></div>
        <div class="tag-input-row">
          <input type="text" class="new-tag-input" placeholder="Add skill..." />
          <button type="button" class="primary-btn add-tag-btn">+</button>
        </div>
        <div class="missing-skills-helper" style="display: none;">
          <span class="helper-label">Add missing:</span>
          <div class="helper-chips"></div>
        </div>
      `;
      textarea.parentNode.appendChild(editor);

      // Event listener for adding tag
      const input = editor.querySelector(".new-tag-input");
      const addBtn = editor.querySelector(".add-tag-btn");

      const handleAdd = () => {
        const val = input.value.trim();
        if (val) {
          addTagToEditor(editor, val);
          input.value = "";
        }
      };

      addBtn.addEventListener("click", handleAdd);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAdd();
        }
      });
    }

    // Populate tags from textarea value
    renderTagsFromTextarea(editor, textarea.value);
    
    // Render helper missing skills in form
    renderMissingSkillsHelper(editor);
  });
}

function renderTagsFromTextarea(editor, textValue) {
  const tagList = editor.querySelector(".tag-list");
  tagList.innerHTML = "";
  
  const tags = String(textValue || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  tags.forEach(tag => {
    const tagEl = createTagElement(editor, tag);
    tagList.appendChild(tagEl);
  });
}

function createTagElement(editor, tagText) {
  const tagEl = document.createElement("span");
  tagEl.className = "tag-item";
  tagEl.setAttribute("draggable", "true");
  
  const textSpan = document.createElement("span");
  textSpan.className = "tag-text";
  textSpan.textContent = tagText;
  tagEl.appendChild(textSpan);

  // Edit inline on click
  textSpan.addEventListener("click", () => {
    const input = document.createElement("input");
    input.className = "tag-edit-input";
    input.value = textSpan.textContent;
    tagEl.replaceChild(input, textSpan);
    input.focus();

    const saveEdit = () => {
      const newVal = input.value.trim();
      if (newVal) {
        textSpan.textContent = newVal;
        tagEl.replaceChild(textSpan, input);
        updateTextareaFromEditor(editor);
      } else {
        tagEl.remove();
        updateTextareaFromEditor(editor);
      }
    };

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveEdit();
      }
    });
  });

  const removeBtn = document.createElement("span");
  removeBtn.className = "tag-remove-btn";
  removeBtn.innerHTML = "&times;";
  removeBtn.setAttribute("role", "button");
  removeBtn.setAttribute("aria-label", `Delete skill tag ${tagText}`);
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    tagEl.remove();
    updateTextareaFromEditor(editor);
  });
  tagEl.appendChild(removeBtn);

  // Drag and Drop reordering logic for skill tags
  tagEl.addEventListener("dragstart", (e) => {
    tagDragSrcEl = tagEl;
    e.dataTransfer.effectAllowed = "move";
    tagEl.classList.add("dragging");
  });

  tagEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    return false;
  });

  tagEl.addEventListener("dragenter", (e) => {
    if (tagEl !== tagDragSrcEl) {
      tagEl.classList.add("drag-over");
    }
  });

  tagEl.addEventListener("dragleave", () => {
    tagEl.classList.remove("drag-over");
  });

  tagEl.addEventListener("drop", (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (tagEl !== tagDragSrcEl && tagDragSrcEl) {
      const container = tagEl.parentNode;
      const allTags = [...container.querySelectorAll(".tag-item")];
      const srcIdx = allTags.indexOf(tagDragSrcEl);
      const destIdx = allTags.indexOf(tagEl);
      
      if (srcIdx < destIdx) {
        container.insertBefore(tagDragSrcEl, tagEl.nextSibling);
      } else {
        container.insertBefore(tagDragSrcEl, tagEl);
      }
      
      updateTextareaFromEditor(editor);
    }
  });

  tagEl.addEventListener("dragend", () => {
    document.querySelectorAll(".tag-item").forEach(item => {
      item.classList.remove("dragging");
      item.classList.remove("drag-over");
    });
    tagDragSrcEl = null;
  });

  return tagEl;
}

function addTagToEditor(editor, tagText) {
  const tagList = editor.querySelector(".tag-list");
  const existingTags = [...tagList.querySelectorAll(".tag-text")].map(el => el.textContent.toLowerCase());
  
  const subTags = tagText.split(",").map(t => t.trim()).filter(Boolean);
  let addedAny = false;

  subTags.forEach(subText => {
    if (!existingTags.includes(subText.toLowerCase())) {
      const tagEl = createTagElement(editor, subText);
      tagList.appendChild(tagEl);
      existingTags.push(subText.toLowerCase());
      addedAny = true;
    }
  });

  if (addedAny) {
    updateTextareaFromEditor(editor);
  }
}

function updateTextareaFromEditor(editor) {
  const textareaId = editor.getAttribute("data-for");
  const categoryKey = editor.getAttribute("data-key");
  const textarea = document.getElementById(textareaId);
  if (!textarea) return;

  const tags = [...editor.querySelectorAll(".tag-text")].map(el => el.textContent.trim()).filter(Boolean);
  const textVal = tags.join(", ");
  textarea.value = textVal;

  // Update memory
  if (!draftData.skills) {
    draftData.skills = { languages: "", frameworks: "", databases: "", tools: "", core: "" };
  }
  draftData.skills[categoryKey] = textVal;
  localStorage.setItem("draftResumeData", JSON.stringify(draftData));
  
  // Dispatch input event to trigger auto-saving
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  
  // If we are on output page or ATS Tuning page, auto refresh the resume and ATS score in real-time
  if (currentStep === 4 || currentStep === 5) {
    triggerAutoRecompute();
  }
}

function renderMissingSkillsHelper(editor) {
  const helperSection = editor.querySelector(".missing-skills-helper");
  const helperChips = editor.querySelector(".helper-chips");
  
  helperSection.style.display = "none";
  helperChips.innerHTML = "";

  const savedJson = localStorage.getItem("latestResumeResultData");
  if (!savedJson) return;

  try {
    const data = JSON.parse(savedJson);
    const missing = data.resume?.missingKeywords || [];
    if (!missing.length) return;

    // Show only keywords that aren't already in the editor
    const currentTags = [...editor.querySelectorAll(".tag-text")].map(el => el.textContent.toLowerCase());
    const relevantMissing = missing.filter(keyword => !currentTags.includes(keyword.toLowerCase()));

    if (!relevantMissing.length) return;

    helperSection.style.display = "flex";
    relevantMissing.slice(0, 5).forEach(keyword => {
      const chip = document.createElement("span");
      chip.className = "helper-chip";
      chip.textContent = `+ ${keyword}`;
      chip.addEventListener("click", () => {
        addTagToEditor(editor, keyword);
        renderMissingSkillsHelper(editor); // Update helper state
      });
      helperChips.appendChild(chip);
    });
  } catch (err) {
    console.error("Failed to render missing skills helper:", err);
  }
}

// Global popover modal to add missing skill to any category
function showAddMissingSkillMenu(event, skillName) {
  event.stopPropagation();
  
  // Remove existing modals
  const existing = document.querySelector(".skill-add-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.className = "skill-add-modal";
  modal.style.top = `${event.pageY + 10}px`;
  modal.style.left = `${event.pageX + 10}px`;

  const categories = [
    { name: "Languages", key: "languages", id: "skillsLanguages" },
    { name: "Frameworks & Libraries", key: "frameworks", id: "skillsFrameworks" },
    { name: "Databases", key: "databases", id: "skillsDatabases" },
    { name: "Developer Tools", key: "tools", id: "skillsTools" },
    { name: "Core Competencies", key: "core", id: "skillsCore" }
  ];

  modal.innerHTML = `<span style="font-size:0.7rem; color:var(--text-muted); font-weight:700; padding:4px 8px; border-bottom:1px solid var(--border);">ADD "${escapeHtml(skillName).toUpperCase()}" TO:</span>`;

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = cat.name;
    btn.addEventListener("click", () => {
      addSkillToCategory(cat.id, cat.key, skillName);
      modal.remove();
    });
    modal.appendChild(btn);
  });

  document.body.appendChild(modal);

  // Close when clicking outside
  const closeHandler = () => {
    modal.remove();
    document.removeEventListener("click", closeHandler);
  };
  // Wait a tick to bind so the current click doesn't close it instantly
  setTimeout(() => {
    document.addEventListener("click", closeHandler);
  }, 10);
}

function addSkillToCategory(textareaId, categoryKey, skillName) {
  // Update memory
  if (!draftData.skills) {
    draftData.skills = { languages: "", frameworks: "", databases: "", tools: "", core: "" };
  }
  
  let currentVal = draftData.skills[categoryKey] || "";
  const existing = currentVal.split(",").map(s => s.trim()).filter(Boolean);
  
  const subSkills = skillName.split(",").map(s => s.trim()).filter(Boolean);
  let addedAny = false;

  subSkills.forEach(sub => {
    if (!existing.map(s => s.toLowerCase()).includes(sub.toLowerCase())) {
      existing.push(sub);
      addedAny = true;
    }
  });

  if (addedAny) {
    draftData.skills[categoryKey] = existing.join(", ");
    
    // Save draft
    localStorage.setItem("draftResumeData", JSON.stringify(draftData));
    
    // Update active textarea elements
    const textarea = document.getElementById(textareaId);
    if (textarea) {
      textarea.value = draftData.skills[categoryKey];
      // Trigger editor rebuild
      const editor = textarea.parentNode.querySelector(".skills-tag-editor");
      if (editor) {
        renderTagsFromTextarea(editor, textarea.value);
        renderMissingSkillsHelper(editor);
      }
    }
    
    // Auto recompute resume results
    triggerAutoRecompute();
  }
}

function triggerAutoRecompute() {
  let isAi = false;
  let savedResume = null;
  const savedJson = localStorage.getItem("latestResumeResultData");
  if (savedJson) {
    try {
      const data = JSON.parse(savedJson);
      if (data.resume && data.resume.isAiGenerated) {
        isAi = true;
        savedResume = data.resume;
      }
    } catch (err) {
      console.error(err);
    }
  }

  const resume = isAi ? { ...savedResume } : generateLocalResume(draftData);
  
  if (isAi) {
    resume.isAiGenerated = true;
    resume.atsScore = savedResume.atsScore;
    resume.skills = optimizeSkills(draftData.skills, resume.jdKeywords || []);
  } else {
    // Preserve manually selected projects/certificates if present
    if (savedJson) {
      try {
        const data = JSON.parse(savedJson);
        if (data.resume && Array.isArray(data.resume.selectedProjects)) {
          resume.selectedProjects = data.resume.selectedProjects;
        }
        if (data.resume && Array.isArray(data.resume.selectedCertificates)) {
          resume.selectedCertificates = data.resume.selectedCertificates;
        }
        
        // Re-run ATS scoring based on updated skills and manual selections
        const jdKeywords = resume.jdKeywords || [];
        resume.atsScore = estimateDetailedAtsScore(
          draftData, 
          resume.selectedProjects, 
          resume.selectedCertificates, 
          jdKeywords
        );
        
        // Recompute keyword matching metrics
        const matchedSet = new Set();
        const missingSet = new Set(jdKeywords);
        const allSkills = Object.values(draftData.skills || {}).join(", ");
        
        const projectsText = resume.selectedProjects.map(p => {
          const techText = Array.isArray(p.technologies) ? p.technologies.join(" ") : String(p.technologies || "");
          const bulletsText = Array.isArray(p.bullets) ? p.bullets.join(" ") : String(p.bullets || "");
          return (p.title || "") + " " + techText + " " + bulletsText;
        }).join(" ");
        
        const certsText = resume.selectedCertificates.map(c => (c.title || "") + " " + (c.reason || c.issuer || "")).join(" ");
        const expText = (draftData.experience || []).map(e => (e.role || "") + " " + (e.bullets || "")).join(" ");
        
        const textContent = (allSkills + " " + projectsText + " " + certsText + " " + expText).toLowerCase();
        
        jdKeywords.forEach(kw => {
          if (textContent.includes(kw.toLowerCase())) {
            matchedSet.add(kw);
            missingSet.delete(kw);
          }
        });
        
        resume.matchedKeywords = [...matchedSet];
        resume.missingKeywords = [...missingSet];
      } catch (err) {
        console.error("Failed to preserve manual selections during auto-recompute:", err);
      }
    }
  }

  latestJson = { input: draftData, resume };
  latestLatex = buildLatexResume(draftData, resume);
  localStorage.setItem("latestResumeResultData", JSON.stringify(latestJson));
  localStorage.setItem("latestResumeLatex", latestLatex);
  
  // Re-render
  renderResult(draftData, resume);
  showStatus("Skill added and resume analysis recalculated!", false, true);
}

