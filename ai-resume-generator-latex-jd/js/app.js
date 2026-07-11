// Overleaf Live Editor Controller
let editor;
let compileDebounceTimeout;
let saveIndicatorTimeout;
let formSyncDebounceTimeout;

// Application State
let state = {
  projectName: "My LaTeX Document",
  activeFile: "resume.tex",
  files: {
    "resume.tex": ""
  },
  zoom: 0.95,
  autoCompile: true,
  fontSize: "14px",
  editorTheme: "dracula",
  lineWrapping: true,
  activeTab: "form",
  pageBudget: "auto",
  compactness: "normal",
  sectionSpacing: "-15pt",
  sectionOrder: ["education", "experience", "projects", "certificates", "skills"]
};

// Default Form Data Sets: Pinned to Jake's Resume format
const TEMPLATE_FORM_DATA = {
  jakes_resume: {
    name: "Jake Ryan",
    email: "jake@su.edu",
    phone: "123-456-7890",
    github: "https://github.com/jake",
    linkedin: "https://linkedin.com/in/jake",
    leetcode: "",
    education: [
      { institution: "Southwestern University", location: "Georgetown, TX", degree: "Bachelor of Arts in Computer Science, Minor in Business", duration: "Aug. 2018 -- May 2021" },
      { institution: "Blinn College", location: "Bryan, TX", degree: "Associate's in Liberal Arts", duration: "Aug. 2014 -- May 2018" }
    ],
    experience: [
      {
        company: "Texas A&M University",
        location: "College Station, TX",
        role: "Undergraduate Research Assistant",
        duration: "June 2020 -- Present",
        bullets: [
          "Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems",
          "Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data",
          "Explored ways to visualize GitHub collaboration in a classroom setting"
        ]
      },
      {
        company: "Southwestern University",
        location: "Georgetown, TX",
        role: "Information Technology Support Specialist",
        duration: "Sep. 2018 -- Present",
        bullets: [
          "Communicate with managers to set up campus computers used on campus",
          "Assess and troubleshoot computer problems brought by students, faculty and staff",
          "Maintain upkeep of computers, classroom equipment, and 200 printers across campus"
        ]
      },
      {
        company: "Southwestern University",
        location: "Georgetown, TX",
        role: "Artificial Intelligence Research Assistant",
        duration: "May 2019 -- July 2019",
        bullets: [
          "Explored methods to generate video game dungeons based off of The Legend of Zelda",
          "Developed a game in Java to test the generated dungeons",
          "Contributed 50K+ lines of code to an established codebase via Git",
          "Conducted a human subject study to determine which video game dungeon generation technique is enjoyable",
          "Wrote an 8-page paper and gave multiple presentations on-campus",
          "Presented virtually to the World Conference on Computational Intelligence"
        ]
      }
    ],
    projects: [
      {
        title: "Gitlytics",
        technologies: "Python, Flask, React, PostgreSQL, Docker",
        date: "June 2020 -- Present",
        bullets: [
          "Developed a full-stack web application using with Flask serving a REST API with React as the frontend",
          "Implemented GitHub OAuth to get data from user’s repositories",
          "Visualized GitHub data to show collaboration",
          "Used Celery and Redis for asynchronous tasks"
        ]
      },
      {
        title: "Simple Paintball",
        technologies: "Spigot API, Java, Maven, TravisCI, Git",
        date: "May 2018 -- May 2020",
        bullets: [
          "Developed a Minecraft server plugin to entertain kids during free time for a previous job",
          "Published plugin to websites gaining 2K+ downloads and an average 4.5/5-star review",
          "Implemented continuous delivery using TravisCI to build the plugin upon new a release",
          "Collaborated with Minecraft server administrators to suggest features and get feedback about the plugin"
        ]
      }
    ],
    certificates: [
      { title: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", date: "Jan. 2021" }
    ],
    skills: [
      { label: "Languages", value: "Java, Python, C/C++, SQL (Postgres), JavaScript, HTML/CSS, R" },
      { label: "Frameworks", value: "React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI" },
      { label: "Developer Tools", value: "Git, Docker, TravisCI, Google Cloud Platform, VS Code, Visual Studio, PyCharm, IntelliJ, Eclipse" },
      { label: "Libraries", value: "pandas, NumPy, Matplotlib" }
    ]
  }
};

// Current Active Form Data State
let formData = JSON.parse(JSON.stringify(TEMPLATE_FORM_DATA.jakes_resume));

// UI Elements
const els = {
  projectTitleInput: document.getElementById("projectTitleInput"),
  compileStatusBadge: document.getElementById("compileStatusBadge"),
  recompileBtn: document.getElementById("recompileBtn"),
  downloadTexBtn: document.getElementById("downloadTexBtn"),
  printPdfBtn: document.getElementById("printPdfBtn"),
  copyCodeBtn: document.getElementById("copyCodeBtn"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  templateSelect: document.getElementById("templateSelect"),
  newFileBtn: document.getElementById("newFileBtn"),
  fileTreeContainer: document.getElementById("fileTreeContainer"),
  aiPromptTextarea: document.getElementById("aiPromptTextarea"),
  geminiApiKeyInput: document.getElementById("geminiApiKeyInput"),
  aiPolishBtn: document.getElementById("aiPolishBtn"),
  sidebarPane: document.getElementById("sidebarPane"),
  editorPane: document.getElementById("editorPane"),
  previewPane: document.getElementById("previewPane"),
  sidebarResizer: document.getElementById("sidebarResizer"),
  editorPreviewResizer: document.getElementById("editorPreviewResizer"),
  compiledMetaText: document.getElementById("compiledMetaText"),
  autoCompileToggle: document.getElementById("autoCompileToggle"),
  zoomOutBtn: document.getElementById("zoomOutBtn"),
  zoomPercentText: document.getElementById("zoomPercentText"),
  zoomInBtn: document.getElementById("zoomInBtn"),
  resumeSheet: document.getElementById("resumeSheet"),
  compiledContentContainer: document.getElementById("compiledContentContainer"),
  compileLogPanel: document.getElementById("compileLogPanel"),
  editorCursorPosition: document.getElementById("editorCursorPosition"),
  documentStatsText: document.getElementById("documentStatsText"),
  
  // Workspace Settings
  fontSizeSelect: document.getElementById("fontSizeSelect"),
  editorThemeSelect: document.getElementById("editorThemeSelect"),
  lineWrappingCheckbox: document.getElementById("lineWrappingCheckbox"),
  pageBudgetSelect: document.getElementById("pageBudgetSelect"),
  compactnessSelect: document.getElementById("compactnessSelect"),
  sectionSpacingSelect: document.getElementById("sectionSpacingSelect"),

  // Tab Switching
  tabFormBtn: document.getElementById("tabFormBtn"),
  tabCodeBtn: document.getElementById("tabCodeBtn"),
  formEditorContent: document.getElementById("formEditorContent"),
  codeEditorContent: document.getElementById("codeEditorContent"),

  // Form Fields: Profile Details
  formName: document.getElementById("formName"),
  formEmail: document.getElementById("formEmail"),
  formPhone: document.getElementById("formPhone"),
  formGithub: document.getElementById("formGithub"),
  formLinkedin: document.getElementById("formLinkedin"),
  formLeetcode: document.getElementById("formLeetcode"),

  // Form List Containers & Buttons
  formEducationContainer: document.getElementById("formEducationContainer"),
  formAddEduBtn: document.getElementById("formAddEduBtn"),
  formExperienceContainer: document.getElementById("formExperienceContainer"),
  formAddExpBtn: document.getElementById("formAddExpBtn"),
  formProjectsContainer: document.getElementById("formProjectsContainer"),
  formAddProjBtn: document.getElementById("formAddProjBtn"),
  
  formCertificatesContainer: document.getElementById("formCertificatesContainer"),
  formAddCertBtn: document.getElementById("formAddCertBtn"),
  
  formSkillsContainer: document.getElementById("formSkillsContainer"),
  formAddSkillBtn: document.getElementById("formAddSkillBtn"),
  
  // Autosave status
  autosaveBadge: document.getElementById("autosaveBadge")
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initEditor();
  initResizers();
  initTabs();
  initAccordions();
  loadProjectData();
  initDraggableAccordions();
  bindEvents();
});

// 1. CodeMirror Editor Setup
function initEditor() {
  editor = CodeMirror.fromTextArea(document.getElementById("latexCodeArea"), {
    mode: "stex",
    theme: "dracula",
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    lineWrapping: true,
    indentUnit: 2,
    tabSize: 2,
    placeholder: "% Write your LaTeX document here..."
  });

  editor.on("cursorActivity", () => {
    const pos = editor.getCursor();
    els.editorCursorPosition.textContent = `Ln ${pos.line + 1}, Col ${pos.ch + 1}`;
    state.lastCursorLine = pos.line;
  });

  editor.on("change", () => {
    if (state.activeTab === "code") {
      state.files[state.activeFile] = editor.getValue();
      
      // Debounce the back-sync to forms to prevent typing lag
      clearTimeout(formSyncDebounceTimeout);
      formSyncDebounceTimeout = setTimeout(() => {
        saveDraftLocal();
        const parsedData = parseLatexToForm(editor.getValue());
        if (parsedData) {
          formData = parsedData;
          localStorage.setItem("overleaf_form_data_v6", JSON.stringify(formData));
          initForms();
        }
      }, 500);
      
      if (state.autoCompile) {
        clearTimeout(compileDebounceTimeout);
        compileDebounceTimeout = setTimeout(compileLatex, 400);
      }
    }
  });

  editor.on("inputRead", (cm, change) => {
    if (change.text[0] === "\\") {
      showAutocomplete(cm);
    }
  });
}

function showAutocomplete(cm) {
  const initialCursor = cm.getCursor();
  const suggestionsBox = document.createElement("ul");
  suggestionsBox.className = "autocomplete-suggestions";
  
  const coords = cm.charCoords(initialCursor, "window");
  suggestionsBox.style.left = `${coords.left}px`;
  suggestionsBox.style.top = `${coords.bottom}px`;
  document.body.appendChild(suggestionsBox);

  let activeIndex = 0;
  let currentFilteredList = [];

  function renderSuggestions(filterText = "") {
    suggestionsBox.innerHTML = "";
    currentFilteredList = LATEX_COMMANDS.filter(cmd => cmd.toLowerCase().startsWith(filterText.toLowerCase()));
    
    if (currentFilteredList.length === 0) {
      closeSuggestions();
      return;
    }
    
    currentFilteredList.forEach((cmd, index) => {
      const item = document.createElement("li");
      item.className = `autocomplete-suggestion ${index === activeIndex ? "active" : ""}`;
      item.textContent = `\\${cmd}`;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        insertCommand(cmd);
      });
      suggestionsBox.appendChild(item);
    });
  }

  function insertCommand(cmd) {
    const currentCursor = cm.getCursor();
    const lineText = cm.getLine(currentCursor.line);
    const lastSlash = lineText.lastIndexOf("\\", currentCursor.ch - 1);
    
    if (lastSlash !== -1) {
      cm.replaceRange("\\" + cmd, { line: currentCursor.line, ch: lastSlash }, currentCursor);
      if (cmd.includes("{}")) {
        const braceIndex = cmd.indexOf("{");
        cm.setCursor({ line: currentCursor.line, ch: lastSlash + 1 + braceIndex + 1 });
      }
    }
    cm.focus();
    closeSuggestions();
  }

  function updateActiveSuggestion() {
    const items = suggestionsBox.querySelectorAll(".autocomplete-suggestion");
    items.forEach((item, index) => {
      if (index === activeIndex) {
        item.classList.add("active");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("active");
      }
    });
  }

  function onEditorChange() {
    const currentCursor = cm.getCursor();
    const lineText = cm.getLine(currentCursor.line);
    const lastSlash = lineText.lastIndexOf("\\", currentCursor.ch - 1);
    
    if (lastSlash === -1 || currentCursor.ch < lastSlash) {
      closeSuggestions();
      return;
    }
    
    const query = lineText.slice(lastSlash + 1, currentCursor.ch);
    if (/[^a-zA-Z0-9_{}]/.test(query)) {
      closeSuggestions();
      return;
    }
    activeIndex = 0;
    renderSuggestions(query);
  }

  function closeSuggestions() {
    suggestionsBox.remove();
    cm.off("change", onEditorChange);
    document.removeEventListener("mousedown", outsideClickHandler);
    document.removeEventListener("keydown", keydownHandler);
  }

  function outsideClickHandler(e) {
    if (!suggestionsBox.contains(e.target)) {
      closeSuggestions();
    }
  }

  function keydownHandler(e) {
    const items = suggestionsBox.querySelectorAll(".autocomplete-suggestion");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveSuggestion();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveSuggestion();
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (currentFilteredList[activeIndex]) {
        insertCommand(currentFilteredList[activeIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeSuggestions();
    }
  }

  cm.on("change", onEditorChange);
  document.addEventListener("mousedown", outsideClickHandler);
  document.addEventListener("keydown", keydownHandler, true);
  renderSuggestions("");
}

// 2. Resizers dragging Setup
function initResizers() {
  let isDraggingSidebar = false;
  let isDraggingEditorPreview = false;

  els.sidebarResizer.addEventListener("mousedown", (e) => {
    isDraggingSidebar = true;
    els.sidebarResizer.classList.add("active");
    document.body.style.cursor = "col-resize";
    e.preventDefault();
  });

  els.editorPreviewResizer.addEventListener("mousedown", (e) => {
    isDraggingEditorPreview = true;
    els.editorPreviewResizer.classList.add("active");
    document.body.style.cursor = "col-resize";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (isDraggingSidebar) {
      const newWidth = e.clientX;
      if (newWidth > 180 && newWidth < 450) {
        document.documentElement.style.setProperty("--sidebar-width", `${newWidth}px`);
      }
    } else if (isDraggingEditorPreview) {
      const sidebarWidth = els.sidebarPane.offsetWidth;
      const workspaceWidth = document.body.offsetWidth;
      const clientXAdjusted = e.clientX - sidebarWidth - 6;
      const remainingWidth = workspaceWidth - sidebarWidth - 12;
      
      const newWidthPercentage = (clientXAdjusted / remainingWidth) * 100;
      if (newWidthPercentage > 15 && newWidthPercentage < 85) {
        els.editorPane.style.flex = `0 0 ${newWidthPercentage}%`;
        els.previewPane.style.width = `${100 - newWidthPercentage}%`;
      }
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDraggingSidebar || isDraggingEditorPreview) {
      isDraggingSidebar = false;
      isDraggingEditorPreview = false;
      els.sidebarResizer.classList.remove("active");
      els.editorPreviewResizer.classList.remove("active");
      document.body.style.cursor = "default";
      editor.refresh();
    }
  });
}

// 3. Tab toggles
function initTabs() {
  els.tabFormBtn.addEventListener("click", () => {
    switchTab("form");
  });

  els.tabCodeBtn.addEventListener("click", () => {
    switchTab("code");
  });
}

function switchTab(tabId) {
  if (state.activeTab === tabId) return;
  state.activeTab = tabId;

  if (tabId === "form") {
    els.tabFormBtn.classList.add("active");
    els.tabCodeBtn.classList.remove("active");
    els.formEditorContent.classList.add("active");
    els.codeEditorContent.style.display = "none";
    els.codeEditorContent.classList.remove("active");
    
    // Parse current LaTeX code back into Form Data to enable bi-directional sync!
    const parsedData = parseLatexToForm(editor.getValue());
    if (parsedData) {
      formData = parsedData;
      saveDraftLocal();
    }
    
    loadProjectData();
    
    // Automatically scroll to the section corresponding to the last cursor line in code
    if (state.hasOwnProperty("lastCursorLine")) {
      syncAccordionToCursorLine(state.lastCursorLine);
    }
  } else {
    els.tabCodeBtn.classList.add("active");
    els.tabFormBtn.classList.remove("active");
    els.codeEditorContent.style.display = "flex";
    els.codeEditorContent.classList.add("active");
    els.formEditorContent.classList.remove("active");
    
    const genLatex = generateLatexFromForm(formData, "jakes_resume", state.compactness, state.sectionOrder);
    editor.setValue(genLatex);
    state.files[state.activeFile] = genLatex;
    saveDraftLocal();
    editor.refresh();
    editor.focus();
  }
}

// Helper: Scroll Accordion Item inside scroll container
function scrollToAccordionItem(item) {
  const container = els.formEditorContent;
  if (!container || !item) return;
  
  const containerRect = container.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const relativeTop = itemRect.top - containerRect.top + container.scrollTop;
  
  container.scrollTo({
    top: relativeTop - 12,
    behavior: "smooth"
  });
}

function getSectionFromLine(lineNum) {
  if (lineNum === undefined || lineNum === null) return null;
  const val = editor.getValue();
  if (!val) return null;
  const lines = val.split("\n");
  // Search upwards from the current line for a \section{...} command
  for (let i = Math.min(lineNum, lines.length - 1); i >= 0; i--) {
    const match = lines[i].match(/\\section\s*\{([^}]+)\}/);
    if (match) {
      return match[1].trim().toLowerCase();
    }
  }
  return null;
}

function syncAccordionToCursorLine(lineNum) {
  const sec = getSectionFromLine(lineNum);
  if (!sec) return;
  
  let index = -1;
  if (sec.includes("education")) {
    index = state.sectionOrder.indexOf("education") + 1;
  } else if (sec.includes("experience")) {
    index = state.sectionOrder.indexOf("experience") + 1;
  } else if (sec.includes("project")) {
    index = state.sectionOrder.indexOf("projects") + 1;
  } else if (sec.includes("certificate")) {
    index = state.sectionOrder.indexOf("certificates") + 1;
  } else if (sec.includes("skills")) {
    index = state.sectionOrder.indexOf("skills") + 1;
  }
  
  if (index !== -1) {
    const items = document.querySelectorAll(".accordion-item");
    items.forEach((item, idx) => {
      if (idx === index) {
        if (!item.classList.contains("active")) {
          // Collapse other sections
          items.forEach(otherItem => {
            if (otherItem !== item) otherItem.classList.remove("active");
          });
          item.classList.add("active");
        }
        setTimeout(() => {
          scrollToAccordionItem(item);
        }, 100);
      }
    });
  }
}

// 4. Collapsible Accordions
function initAccordions() {
  const items = document.querySelectorAll(".accordion-item");
  items.forEach(item => {
    const header = item.querySelector(".accordion-header");
    header.addEventListener("click", () => {
      const wasActive = item.classList.contains("active");
      
      // Collapse all other sections to keep the viewport clean
      items.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove("active");
        }
      });
      
      item.classList.toggle("active");
      
      if (!wasActive) {
        setTimeout(() => {
          scrollToAccordionItem(item);
        }, 180);
      }
    });
  });
}

// 5. Multi-File Inputs Resolver
function resolveInputs(latex, files, visited = new Set()) {
  return latex.replace(/\\(?:input|include)\s*\{([^}]+)\}/g, (match, path) => {
    let cleanPath = path.trim();
    let pathWithExt = cleanPath.endsWith(".tex") ? cleanPath : cleanPath + ".tex";
    let pathWithoutExt = cleanPath.endsWith(".tex") ? cleanPath.slice(0, -4) : cleanPath;
    
    if (files[pathWithExt] !== undefined) {
      if (visited.has(pathWithExt)) {
        return `% Circular dependency: ${pathWithExt}`;
      }
      const nextVisited = new Set(visited);
      nextVisited.add(pathWithExt);
      return resolveInputs(files[pathWithExt], files, nextVisited);
    } else if (files[pathWithoutExt] !== undefined) {
      if (visited.has(pathWithoutExt)) {
        return `% Circular dependency: ${pathWithoutExt}`;
      }
      const nextVisited = new Set(visited);
      nextVisited.add(pathWithoutExt);
      return resolveInputs(files[pathWithoutExt], files, nextVisited);
    }
    
    return match;
  });
}

// 6. Client Side LaTeX Compilation
function compileLatex() {
  els.compileStatusBadge.className = "compile-status-badge working";
  els.compileStatusBadge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Compiling...';
  
  const rawLatex = editor.getValue();
  const resolvedLatex = resolveInputs(rawLatex, state.files);
  
  try {
    const htmlResult = compileLatexToHtml(resolvedLatex);
    
    if (htmlResult.includes("compile-error")) {
      els.compiledContentContainer.innerHTML = "";
      els.compileLogPanel.innerHTML = htmlResult;
      els.compileLogPanel.classList.add("open");
      els.compileStatusBadge.className = "compile-status-badge error";
      els.compileStatusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Error';
      els.compiledMetaText.textContent = "Compilation failed";
    } else {
      // Temporarily remove budget classes to measure the true unclipped content scrollHeight
      const currentBudget = state.pageBudget || "auto";
      els.resumeSheet.classList.remove("page-budget-1", "page-budget-2");
      
      els.compiledContentContainer.innerHTML = htmlResult;
      
      const height = els.resumeSheet.scrollHeight;
      const pageCount = Math.max(1, Math.ceil(height / 1122));
      
      // Re-apply spacing & budget classes
      applySpacingClasses();
      
      els.compileLogPanel.innerHTML = "";
      els.compileLogPanel.classList.remove("open");
      els.compileStatusBadge.className = "compile-status-badge success";
      els.compileStatusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Compiled';
      
      const textOnly = els.compiledContentContainer.innerText || "";
      const words = textOnly.trim() === "" ? 0 : textOnly.trim().split(/\s+/).length;
      const chars = textOnly.length;
      els.documentStatsText.textContent = `${words} words, ${chars} characters`;
      
      // Check if page budget is exceeded
      if (currentBudget !== "auto" && pageCount > parseInt(currentBudget)) {
        els.compiledMetaText.innerHTML = `<span style="color:#ef4444; font-weight:600;"><i class="fas fa-exclamation-triangle"></i> Exceeds ${currentBudget}-page limit! (${pageCount} pages)</span>`;
        els.resumeSheet.classList.add("budget-exceeded");
      } else {
        els.compiledMetaText.textContent = `Page 1 of ${pageCount}`;
        els.resumeSheet.classList.remove("budget-exceeded");
      }
    }
  } catch (err) {
    console.error(err);
    els.compileStatusBadge.className = "compile-status-badge error";
    els.compileStatusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Crash';
    els.compileLogPanel.innerHTML = `<div class="compile-error"><strong>Parser Error:</strong> ${err.message}</div>`;
    els.compileLogPanel.classList.add("open");
  }
}

// Helper: Swap Array Items
function swapItems(arr, i1, i2) {
  if (i1 < 0 || i1 >= arr.length || i2 < 0 || i2 >= arr.length) return;
  const temp = arr[i1];
  arr[i1] = arr[i2];
  arr[i2] = temp;
}

// 7. Visual Forms Sync & rendering
function initForms() {
  const textBindings = [
    { el: els.formName, field: "name" },
    { el: els.formEmail, field: "email" },
    { el: els.formPhone, field: "phone" },
    { el: els.formGithub, field: "github" },
    { el: els.formLinkedin, field: "linkedin" },
    { el: els.formLeetcode, field: "leetcode" }
  ];

  textBindings.forEach(binding => {
    if (binding.el) {
      binding.el.value = formData[binding.field] || "";
      binding.el.oninput = () => {
        formData[binding.field] = binding.el.value;
        syncFormToEditor();
      };
    }
  });

  renderDynamicAccordions();
}

function syncFormToEditor() {
  const genLatex = generateLatexFromForm(formData, "jakes_resume", state.compactness, state.sectionOrder, state.sectionSpacing);
  
  editor.setValue(genLatex);
  state.files[state.activeFile] = genLatex;
  saveDraftLocal();
  
  if (state.autoCompile) {
    if (state.activeTab === "form") {
      compileLatex();
    } else {
      clearTimeout(compileDebounceTimeout);
      compileDebounceTimeout = setTimeout(compileLatex, 400);
    }
  }
}

function makeCardCollapsible(card, itemData) {
  const header = card.querySelector(".form-card-header");
  if (!header) return;
  
  header.style.cursor = "pointer";
  
  // Add collapse icon in front of the title span
  const titleSpan = card.querySelector(".form-card-title");
  if (titleSpan && !titleSpan.querySelector(".toggle-card-icon")) {
    const icon = document.createElement("i");
    icon.className = "fas fa-chevron-right toggle-card-icon";
    icon.style.cssText = "margin-right: 8px; transition: transform 0.2s; color: var(--text-muted); font-size: 0.75rem;";
    titleSpan.insertBefore(icon, titleSpan.firstChild);
  }
  
  // Apply initial expanded state
  if (itemData) {
    if (itemData._expanded || itemData._justAdded) {
      card.classList.add("expanded");
      itemData._expanded = true;
      delete itemData._justAdded;
    } else {
      card.classList.remove("expanded");
    }
  }
  
  header.onclick = (e) => {
    // Prevent collapsing when clicking on control buttons or inside actions container
    if (e.target.closest(".form-card-delete-btn") || e.target.closest(".form-card-actions") || e.target.closest("button") || e.target.closest("input") || e.target.closest("select")) {
      return;
    }
    card.classList.toggle("expanded");
    if (itemData) {
      itemData._expanded = card.classList.contains("expanded");
    }
  };
}

function renderEducationForm() {
  els.formEducationContainer.innerHTML = "";
  formData.education.forEach((edu, idx) => {
    const card = document.createElement("div");
    card.className = "form-card-item";
    
    card.innerHTML = `
      <div class="form-card-header">
        <span class="form-card-title">Education #${idx + 1}</span>
        <div class="form-card-actions" style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="form-card-delete-btn move-up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button type="button" class="form-card-delete-btn move-down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button type="button" class="form-card-delete-btn delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
      <div class="form-grid">
        <label>Institution <input type="text" class="edu-inst" value="${edu.institution || ""}" placeholder="Southwestern University" /></label>
        <label>Location <input type="text" class="edu-loc" value="${edu.location || ""}" placeholder="Georgetown, TX" /></label>
        <label>Degree <input type="text" class="edu-deg" value="${edu.degree || ""}" placeholder="B.A. Computer Science" /></label>
        <label>Duration <input type="text" class="edu-dur" value="${edu.duration || ""}" placeholder="Aug. 2018 -- May 2021" /></label>
      </div>
    `;

    card.querySelector(".edu-inst").oninput = (e) => { edu.institution = e.target.value; syncFormToEditor(); };
    card.querySelector(".edu-loc").oninput = (e) => { edu.location = e.target.value; syncFormToEditor(); };
    card.querySelector(".edu-deg").oninput = (e) => { edu.degree = e.target.value; syncFormToEditor(); };
    card.querySelector(".edu-dur").oninput = (e) => { edu.duration = e.target.value; syncFormToEditor(); };
    
    card.querySelector(".move-up").onclick = () => {
      swapItems(formData.education, idx, idx - 1);
      renderEducationForm();
      syncFormToEditor();
    };
    card.querySelector(".move-down").onclick = () => {
      swapItems(formData.education, idx, idx + 1);
      renderEducationForm();
      syncFormToEditor();
    };
    card.querySelector(".delete-btn").onclick = () => {
      formData.education.splice(idx, 1);
      renderEducationForm();
      syncFormToEditor();
    };

    makeCardCollapsible(card, edu);
    els.formEducationContainer.appendChild(card);
  });
}

function renderExperienceForm() {
  els.formExperienceContainer.innerHTML = "";
  formData.experience.forEach((exp, idx) => {
    const card = document.createElement("div");
    card.className = "form-card-item";
    
    let bulletsHtml = "";
    (exp.bullets || []).forEach((bullet, bIdx) => {
      bulletsHtml += `
        <div class="bullet-input-row">
          <input type="text" class="exp-bullet" data-bullet-idx="${bIdx}" value="${bullet || ""}" placeholder="Write achievements bullet point..." />
          <button type="button" class="form-card-delete-btn delete-bullet-btn" data-bullet-idx="${bIdx}"><i class="fas fa-minus-circle"></i></button>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="form-card-header">
        <span class="form-card-title">Experience #${idx + 1}</span>
        <div class="form-card-actions" style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="form-card-delete-btn move-up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button type="button" class="form-card-delete-btn move-down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button type="button" class="form-card-delete-btn delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
      <div class="form-grid">
        <label>Role <input type="text" class="exp-role" value="${exp.role || ""}" placeholder="Undergraduate Research Assistant" /></label>
        <label>Duration <input type="text" class="exp-dur" value="${exp.duration || ""}" placeholder="June 2020 -- Present" /></label>
        <label>Company/Institution <input type="text" class="exp-comp" value="${exp.company || ""}" placeholder="Texas A&M University" /></label>
        <label>Location <input type="text" class="exp-loc" value="${exp.location || ""}" placeholder="College Station, TX" /></label>
        
        <div class="full-width" style="margin-top: 10px;">
          <span style="font-size: 0.75rem; font-weight:600; color: var(--text-muted);">Bullet Achievements</span>
          <div class="bullets-list-container">
            ${bulletsHtml}
          </div>
          <button type="button" class="btn btn-secondary btn-small add-bullet-btn" style="margin-top:8px; font-size:0.7rem; padding: 4px 8px;">
            <i class="fas fa-plus"></i> Add Bullet
          </button>
        </div>
      </div>
    `;

    card.querySelector(".exp-comp").oninput = (e) => { exp.company = e.target.value; syncFormToEditor(); };
    card.querySelector(".exp-loc").oninput = (e) => { exp.location = e.target.value; syncFormToEditor(); };
    card.querySelector(".exp-role").oninput = (e) => { exp.role = e.target.value; syncFormToEditor(); };
    card.querySelector(".exp-dur").oninput = (e) => { exp.duration = e.target.value; syncFormToEditor(); };
    
    card.querySelectorAll(".exp-bullet").forEach(bulletInput => {
      const bIdx = parseInt(bulletInput.getAttribute("data-bullet-idx"));
      bulletInput.oninput = (e) => {
        exp.bullets[bIdx] = e.target.value;
        syncFormToEditor();
      };
    });

    card.querySelectorAll(".delete-bullet-btn").forEach(btn => {
      const bIdx = parseInt(btn.getAttribute("data-bullet-idx"));
      btn.onclick = () => {
        exp.bullets.splice(bIdx, 1);
        renderExperienceForm();
        syncFormToEditor();
      };
    });

    card.querySelector(".add-bullet-btn").onclick = () => {
      if (!exp.bullets) exp.bullets = [];
      exp.bullets.push("");
      renderExperienceForm();
      syncFormToEditor();
    };

    card.querySelector(".move-up").onclick = () => {
      swapItems(formData.experience, idx, idx - 1);
      renderExperienceForm();
      syncFormToEditor();
    };
    card.querySelector(".move-down").onclick = () => {
      swapItems(formData.experience, idx, idx + 1);
      renderExperienceForm();
      syncFormToEditor();
    };
    card.querySelector(".delete-btn").onclick = () => {
      formData.experience.splice(idx, 1);
      renderExperienceForm();
      syncFormToEditor();
    };

    makeCardCollapsible(card, exp);
    els.formExperienceContainer.appendChild(card);
  });
}

function renderProjectsForm() {
  els.formProjectsContainer.innerHTML = "";
  formData.projects.forEach((proj, idx) => {
    const card = document.createElement("div");
    card.className = "form-card-item";
    
    let bulletsHtml = "";
    (proj.bullets || []).forEach((bullet, bIdx) => {
      bulletsHtml += `
        <div class="bullet-input-row">
          <input type="text" class="proj-bullet" data-bullet-idx="${bIdx}" value="${bullet || ""}" placeholder="Write project bullet point..." />
          <button type="button" class="form-card-delete-btn delete-proj-bullet-btn" data-bullet-idx="${bIdx}"><i class="fas fa-minus-circle"></i></button>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="form-card-header">
        <span class="form-card-title">Project #${idx + 1}</span>
        <div class="form-card-actions" style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="form-card-delete-btn move-up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button type="button" class="form-card-delete-btn move-down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button type="button" class="form-card-delete-btn delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
      <div class="form-grid">
        <label>Project Title <input type="text" class="proj-title" value="${proj.title || ""}" placeholder="Gitlytics" /></label>
        <label>Technologies <input type="text" class="proj-tech" value="${proj.technologies || ""}" placeholder="Python, Flask, React" /></label>
        <label>Date <input type="text" class="proj-date" value="${proj.date || ""}" placeholder="June 2020 -- Present" /></label>
        
        <div class="full-width" style="margin-top: 10px;">
          <span style="font-size: 0.75rem; font-weight:600; color: var(--text-muted);">Bullet Descriptions</span>
          <div class="bullets-list-container">
            ${bulletsHtml}
          </div>
          <button type="button" class="btn btn-secondary btn-small add-proj-bullet-btn" style="margin-top:8px; font-size:0.7rem; padding: 4px 8px;">
            <i class="fas fa-plus"></i> Add Bullet
          </button>
        </div>
      </div>
    `;

    card.querySelector(".proj-title").oninput = (e) => { proj.title = e.target.value; syncFormToEditor(); };
    card.querySelector(".proj-tech").oninput = (e) => { proj.technologies = e.target.value; syncFormToEditor(); };
    card.querySelector(".proj-date").oninput = (e) => { proj.date = e.target.value; syncFormToEditor(); };
    
    card.querySelectorAll(".proj-bullet").forEach(bulletInput => {
      const bIdx = parseInt(bulletInput.getAttribute("data-bullet-idx"));
      bulletInput.oninput = (e) => {
        proj.bullets[bIdx] = e.target.value;
        syncFormToEditor();
      };
    });

    card.querySelectorAll(".delete-proj-bullet-btn").forEach(btn => {
      const bIdx = parseInt(btn.getAttribute("data-bullet-idx"));
      btn.onclick = () => {
        proj.bullets.splice(bIdx, 1);
        renderProjectsForm();
        syncFormToEditor();
      };
    });

    card.querySelector(".add-proj-bullet-btn").onclick = () => {
      if (!proj.bullets) proj.bullets = [];
      proj.bullets.push("");
      renderProjectsForm();
      syncFormToEditor();
    };

    card.querySelector(".move-up").onclick = () => {
      swapItems(formData.projects, idx, idx - 1);
      renderProjectsForm();
      syncFormToEditor();
    };
    card.querySelector(".move-down").onclick = () => {
      swapItems(formData.projects, idx, idx + 1);
      renderProjectsForm();
      syncFormToEditor();
    };
    card.querySelector(".delete-btn").onclick = () => {
      formData.projects.splice(idx, 1);
      renderProjectsForm();
      syncFormToEditor();
    };

    makeCardCollapsible(card, proj);
    els.formProjectsContainer.appendChild(card);
  });
}

function renderCertificatesForm() {
  els.formCertificatesContainer.innerHTML = "";
  if (!formData.certificates) formData.certificates = [];
  
  formData.certificates.forEach((cert, idx) => {
    const card = document.createElement("div");
    card.className = "form-card-item";
    card.innerHTML = `
      <div class="form-card-header">
        <span class="form-card-title">Certificate #${idx + 1}</span>
        <div class="form-card-actions" style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="form-card-delete-btn move-up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button type="button" class="form-card-delete-btn move-down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button type="button" class="form-card-delete-btn delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
      <div class="form-grid">
        <label>Certificate Title <input type="text" class="cert-title" value="${cert.title || ""}" placeholder="AWS Certified Solutions Architect" /></label>
        <label>Issuer <input type="text" class="cert-issuer" value="${cert.issuer || ""}" placeholder="Amazon Web Services" /></label>
        <label class="full-width">Date Issued <input type="text" class="cert-date" value="${cert.date || ""}" placeholder="Jan. 2021" /></label>
      </div>
    `;

    card.querySelector(".cert-title").oninput = (e) => { cert.title = e.target.value; syncFormToEditor(); };
    card.querySelector(".cert-issuer").oninput = (e) => { cert.issuer = e.target.value; syncFormToEditor(); };
    card.querySelector(".cert-date").oninput = (e) => { cert.date = e.target.value; syncFormToEditor(); };
    
    card.querySelector(".move-up").onclick = () => {
      swapItems(formData.certificates, idx, idx - 1);
      renderCertificatesForm();
      syncFormToEditor();
    };
    card.querySelector(".move-down").onclick = () => {
      swapItems(formData.certificates, idx, idx + 1);
      renderCertificatesForm();
      syncFormToEditor();
    };
    card.querySelector(".delete-btn").onclick = () => {
      formData.certificates.splice(idx, 1);
      renderCertificatesForm();
      syncFormToEditor();
    };

    makeCardCollapsible(card, cert);
    els.formCertificatesContainer.appendChild(card);
  });
}

function renderSkillsForm() {
  els.formSkillsContainer.innerHTML = "";
  if (!formData.skills || !Array.isArray(formData.skills)) {
    formData.skills = [
      { label: "Languages", value: "Java, Python, C/C++, SQL (Postgres), JavaScript, HTML/CSS, R" },
      { label: "Frameworks", value: "React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI" },
      { label: "Developer Tools", value: "Git, Docker, TravisCI, Google Cloud Platform, VS Code, Visual Studio, PyCharm, IntelliJ, Eclipse" },
      { label: "Libraries", value: "pandas, NumPy, Matplotlib" }
    ];
  }
  
  formData.skills.forEach((skill, idx) => {
    const card = document.createElement("div");
    card.className = "form-card-item";
    card.innerHTML = `
      <div class="form-card-header">
        <span class="form-card-title">Skill Category #${idx + 1}</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="form-card-delete-btn move-up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button type="button" class="form-card-delete-btn move-down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button type="button" class="form-card-delete-btn delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
      <div class="form-grid">
        <label>Category Label <input type="text" class="skill-label" value="${skill.label || ""}" placeholder="Languages" /></label>
        <label>Skills Values <input type="text" class="skill-val" value="${skill.value || ""}" placeholder="Java, Python, C++" /></label>
      </div>
    `;

    card.querySelector(".skill-label").oninput = (e) => { skill.label = e.target.value; syncFormToEditor(); };
    card.querySelector(".skill-val").oninput = (e) => { skill.value = e.target.value; syncFormToEditor(); };
    
    card.querySelector(".move-up").onclick = () => {
      swapItems(formData.skills, idx, idx - 1);
      renderSkillsForm();
      syncFormToEditor();
    };
    card.querySelector(".move-down").onclick = () => {
      swapItems(formData.skills, idx, idx + 1);
      renderSkillsForm();
      syncFormToEditor();
    };
    card.querySelector(".delete-btn").onclick = () => {
      formData.skills.splice(idx, 1);
      renderSkillsForm();
      syncFormToEditor();
    };

    els.formSkillsContainer.appendChild(card);
  });
}

function renderDynamicAccordions() {
  const container = els.formEditorContent;
  
  // Keep only the first accordion (Personal Details)
  const personalDetails = container.querySelector(".accordion-item");
  if (!personalDetails) return;
  
  container.innerHTML = "";
  container.appendChild(personalDetails);
  
  const order = state.sectionOrder || ["education", "experience", "projects", "certificates", "skills"];
  
  order.forEach(secKey => {
    const secLower = secKey.toLowerCase();
    
    let title = "";
    let iconClass = "fas fa-folder";
    let bodyId = "";
    let renderFn = null;
    let addBtnText = "";
    let addFn = null;
    
    if (secLower === "education") {
      title = "Education";
      iconClass = "fas fa-graduation-cap";
      bodyId = "formEducationContainer";
      renderFn = renderEducationForm;
      addBtnText = "Add Education Entry";
      addFn = () => {
        formData.education.push({ institution: "", location: "", degree: "", duration: "", _justAdded: true });
        renderEducationForm();
        syncFormToEditor();
      };
    } else if (secLower === "experience") {
      title = "Work Experience";
      iconClass = "fas fa-briefcase";
      bodyId = "formExperienceContainer";
      renderFn = renderExperienceForm;
      addBtnText = "Add Experience Entry";
      addFn = () => {
        formData.experience.push({ company: "", location: "", role: "", duration: "", bullets: [""], _justAdded: true });
        renderExperienceForm();
        syncFormToEditor();
      };
    } else if (secLower === "projects") {
      title = "Projects";
      iconClass = "fas fa-project-diagram";
      bodyId = "formProjectsContainer";
      renderFn = renderProjectsForm;
      addBtnText = "Add Project Entry";
      addFn = () => {
        formData.projects.push({ title: "", technologies: "", date: "", bullets: [""], _justAdded: true });
        renderProjectsForm();
        syncFormToEditor();
      };
    } else if (secLower === "certificates") {
      title = "Certificates";
      iconClass = "fas fa-certificate";
      bodyId = "formCertificatesContainer";
      renderFn = renderCertificatesForm;
      addBtnText = "Add Certificate Entry";
      addFn = () => {
        formData.certificates.push({ title: "", issuer: "", date: "", _justAdded: true });
        renderCertificatesForm();
        syncFormToEditor();
      };
    } else if (secLower === "skills" || secLower === "technical skills") {
      title = "Technical Skills";
      iconClass = "fas fa-cogs";
      bodyId = "formSkillsContainer";
      renderFn = renderSkillsForm;
      addBtnText = "Add Skill Category";
      addFn = () => {
        formData.skills.push({ label: "", value: "", _justAdded: true });
        renderSkillsForm();
        syncFormToEditor();
      };
    } else {
      // Custom section!
      const cSec = (formData.customSections || []).find(cs => cs.title.toLowerCase() === secLower);
      if (!cSec) return;
      
      title = cSec.title;
      iconClass = "fas fa-folder";
      bodyId = `customSection_${secLower.replace(/[^a-z0-9]/g, "_")}`;
      renderFn = () => renderCustomSectionForm(cSec, bodyId);
      addBtnText = `Add ${title} Entry`;
      addFn = () => {
        if (!cSec.items) cSec.items = [];
        cSec.items.push({ title: "", subtitle: "", date: "", bullets: [""], _justAdded: true });
        renderCustomSectionForm(cSec, bodyId);
        syncFormToEditor();
      };
    }
    
    // Create Accordion Item DOM Node
    const accItem = document.createElement("div");
    accItem.className = "accordion-item";
    accItem.setAttribute("data-section-key", secLower);
    
    accItem.innerHTML = `
      <div class="accordion-header">
        <span><i class="${iconClass}"></i> ${title}</span>
        <i class="fas fa-chevron-down toggle-icon"></i>
      </div>
      <div class="accordion-body">
        <div id="${bodyId}"></div>
        <button type="button" class="btn btn-secondary" style="width: 100%; margin-top: 12px;">
          <i class="fas fa-plus"></i> ${addBtnText}
        </button>
      </div>
    `;
    
    accItem.querySelector("button").onclick = addFn;
    container.appendChild(accItem);
  });

  // Re-map global refs in els
  els.formEducationContainer = document.getElementById("formEducationContainer");
  els.formExperienceContainer = document.getElementById("formExperienceContainer");
  els.formProjectsContainer = document.getElementById("formProjectsContainer");
  els.formCertificatesContainer = document.getElementById("formCertificatesContainer");
  els.formSkillsContainer = document.getElementById("formSkillsContainer");

  // Call the actual render functions
  order.forEach(secKey => {
    const secLower = secKey.toLowerCase();
    if (secLower === "education") renderEducationForm();
    else if (secLower === "experience") renderExperienceForm();
    else if (secLower === "projects") renderProjectsForm();
    else if (secLower === "certificates") renderCertificatesForm();
    else if (secLower === "skills" || secLower === "technical skills") renderSkillsForm();
    else {
      const cSec = (formData.customSections || []).find(cs => cs.title.toLowerCase() === secLower);
      if (cSec) {
        const bodyId = `customSection_${secLower.replace(/[^a-z0-9]/g, "_")}`;
        renderCustomSectionForm(cSec, bodyId);
      }
    }
  });
  
  initAccordions();
  initDraggableAccordions();
}

function renderCustomSectionForm(cSec, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = "";
  
  if (!cSec.items || !cSec.items.length) {
    container.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:12px;">No items in this section. Click the button below to add one.</div>`;
    return;
  }
  
  cSec.items.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "form-card-item";
    
    let bulletsHtml = "";
    (item.bullets || []).forEach((bullet, bIdx) => {
      bulletsHtml += `
        <div class="bullet-input-row">
          <input type="text" class="custom-bullet" data-bullet-idx="${bIdx}" value="${bullet || ""}" placeholder="Write bullet point..." />
          <button type="button" class="form-card-delete-btn delete-bullet-btn" data-bullet-idx="${bIdx}"><i class="fas fa-minus-circle"></i></button>
        </div>
      `;
    });
    
    card.innerHTML = `
      <div class="form-card-header">
        <span class="form-card-title">${cSec.title} Entry #${idx + 1}</span>
        <div class="form-card-actions" style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="form-card-delete-btn move-up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button type="button" class="form-card-delete-btn move-down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button type="button" class="form-card-delete-btn delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
      <div class="form-grid">
        <label>Heading / Title <input type="text" class="custom-title" value="${item.title || ""}" placeholder="E.g. LeetCode or FEELGAN" /></label>
        <label>Subheading / Details <input type="text" class="custom-subtitle" value="${item.subtitle || ""}" placeholder="E.g. Python, TensorFlow or Solved 350+ problems" /></label>
        <label>Date / Duration <input type="text" class="custom-date" value="${item.date || ""}" placeholder="E.g. Jan. 2024" /></label>
        
        <div class="full-width" style="margin-top: 10px;">
          <span style="font-size: 0.75rem; font-weight:600; color: var(--text-muted);">Bullet Items (Optional)</span>
          <div class="bullets-list-container">
            ${bulletsHtml}
          </div>
          <button type="button" class="btn btn-secondary btn-small add-bullet-btn" style="margin-top:8px; font-size:0.7rem; padding: 4px 8px;">
            <i class="fas fa-plus"></i> Add Bullet
          </button>
        </div>
      </div>
    `;
    
    card.querySelector(".custom-title").oninput = (e) => { item.title = e.target.value; syncFormToEditor(); };
    card.querySelector(".custom-subtitle").oninput = (e) => { item.subtitle = e.target.value; syncFormToEditor(); };
    card.querySelector(".custom-date").oninput = (e) => { item.date = e.target.value; syncFormToEditor(); };
    
    card.querySelectorAll(".custom-bullet").forEach(bulletInput => {
      const bIdx = parseInt(bulletInput.getAttribute("data-bullet-idx"));
      bulletInput.oninput = (e) => {
        item.bullets[bIdx] = e.target.value;
        syncFormToEditor();
      };
    });
    
    card.querySelectorAll(".delete-bullet-btn").forEach(btn => {
      const bIdx = parseInt(btn.getAttribute("data-bullet-idx"));
      btn.onclick = () => {
        item.bullets.splice(bIdx, 1);
        renderCustomSectionForm(cSec, containerId);
        syncFormToEditor();
      };
    });
    
    card.querySelector(".add-bullet-btn").onclick = () => {
      if (!item.bullets) item.bullets = [];
      item.bullets.push("");
      renderCustomSectionForm(cSec, containerId);
      syncFormToEditor();
    };
    
    card.querySelector(".move-up").onclick = () => {
      swapItems(cSec.items, idx, idx - 1);
      renderCustomSectionForm(cSec, containerId);
      syncFormToEditor();
    };
    card.querySelector(".move-down").onclick = () => {
      swapItems(cSec.items, idx, idx + 1);
      renderCustomSectionForm(cSec, containerId);
      syncFormToEditor();
    };
    card.querySelector(".delete-btn").onclick = () => {
      cSec.items.splice(idx, 1);
      renderCustomSectionForm(cSec, containerId);
      syncFormToEditor();
    };
    
    makeCardCollapsible(card, item);
    container.appendChild(card);
  });
}

// 8. Load Project Data & Sync
function loadProjectData() {
  loadLocalOrTemplate();
  els.projectTitleInput.value = state.projectName;
  
  // Settings Restoring
  els.fontSizeSelect.value = state.fontSize || "14px";
  editor.getWrapperElement().style.fontSize = state.fontSize || "14px";
  els.editorThemeSelect.value = state.editorTheme || "dracula";
  editor.setOption("theme", state.editorTheme || "dracula");
  els.lineWrappingCheckbox.checked = state.lineWrapping !== undefined ? state.lineWrapping : true;
  editor.setOption("lineWrapping", state.lineWrapping !== undefined ? state.lineWrapping : true);
  
  els.pageBudgetSelect.value = state.pageBudget || "auto";
  els.compactnessSelect.value = state.compactness || "normal";
  els.sectionSpacingSelect.value = state.sectionSpacing || "-15pt";
  
  applySpacingClasses();
  
  // Sort/Reorder Accordion nodes inside visual DOM tree
  reorderAccordionsInDOM();
  
  renderFileTree();
  initForms();
  
  editor.setValue(state.files[state.activeFile] || "");
  compileLatex();
}

function applySpacingClasses() {
  els.resumeSheet.className = "resume-sheet";
  els.resumeSheet.classList.add(`spacing-${state.compactness}`);
  if (state.pageBudget !== "auto") {
    els.resumeSheet.classList.add(`page-budget-${state.pageBudget}`);
  }
  
  // Set the CSS Custom Property for the resume preview font size
  const previewSize = state.fontSize || "14px";
  els.resumeSheet.style.setProperty("--preview-font-size", previewSize);
}

function loadDefaultWorkspace() {
  state.projectName = "My LaTeX Document";
  state.activeFile = "resume.tex";
  state.sectionOrder = ["education", "experience", "projects", "certificates", "skills"];
  
  formData = JSON.parse(JSON.stringify(TEMPLATE_FORM_DATA.jakes_resume));
  
  const gen = generateLatexFromForm(formData, "jakes_resume", "normal", state.sectionOrder);
  state.files = {
    "resume.tex": gen
  };
}

function loadLocalOrTemplate() {
  const localProject = localStorage.getItem("overleaf_live_project_v6");
  const localForm = localStorage.getItem("overleaf_form_data_v6");
  
  if (localForm) {
    try {
      formData = JSON.parse(localForm);
    } catch(e) {
      console.error(e);
    }
  }

  if (localProject) {
    try {
      const parsed = JSON.parse(localProject);
      state.projectName = parsed.projectName || "My LaTeX Document";
      state.activeFile = parsed.activeFile || "resume.tex";
      state.files = parsed.files || {};
      state.fontSize = parsed.fontSize || "14px";
      state.editorTheme = parsed.editorTheme || "dracula";
      state.lineWrapping = parsed.lineWrapping !== undefined ? parsed.lineWrapping : true;
      state.pageBudget = parsed.pageBudget || "auto";
      state.compactness = parsed.compactness || "normal";
      state.sectionSpacing = parsed.sectionSpacing || "-15pt";
      state.sectionOrder = parsed.sectionOrder || ["education", "experience", "projects", "certificates", "skills"];
      return;
    } catch (e) {
      console.error(e);
    }
  }
  loadDefaultWorkspace();
}

function saveDraftLocal() {
  const data = {
    projectName: state.projectName,
    activeFile: state.activeFile,
    files: state.files,
    fontSize: state.fontSize,
    editorTheme: state.editorTheme,
    lineWrapping: state.lineWrapping,
    pageBudget: state.pageBudget,
    compactness: state.compactness,
    sectionSpacing: state.sectionSpacing,
    sectionOrder: state.sectionOrder
  };
  localStorage.setItem("overleaf_live_project_v6", JSON.stringify(data));
  localStorage.setItem("overleaf_form_data_v6", JSON.stringify(formData));
  
  // Autosave notification animations indicator triggers
  triggerAutosaveBadge();
}

function triggerAutosaveBadge() {
  if (!els.autosaveBadge) return;
  clearTimeout(saveIndicatorTimeout);
  els.autosaveBadge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  els.autosaveBadge.style.color = 'var(--warning)';
  els.autosaveBadge.style.background = 'rgba(245, 158, 11, 0.1)';
  
  saveIndicatorTimeout = setTimeout(() => {
    els.autosaveBadge.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Saved';
    els.autosaveBadge.style.color = 'var(--success)';
    els.autosaveBadge.style.background = 'rgba(16, 185, 129, 0.1)';
  }, 400);
}

// 9. File tree renderer
function renderFileTree() {
  els.fileTreeContainer.innerHTML = "";
  Object.keys(state.files).forEach(filename => {
    const item = document.createElement("li");
    item.className = `file-item ${filename === state.activeFile ? "active" : ""}`;
    
    const fileLeft = document.createElement("div");
    fileLeft.className = "file-item-left";
    fileLeft.innerHTML = `<i class="far fa-file-alt"></i> <span>${filename}</span>`;
    fileLeft.addEventListener("click", () => {
      switchActiveFile(filename);
    });
    item.appendChild(fileLeft);

    const actions = document.createElement("div");
    actions.className = "file-actions";
    
    const renameBtn = document.createElement("button");
    renameBtn.className = "file-action-btn";
    renameBtn.innerHTML = '<i class="fas fa-edit"></i>';
    renameBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      renameFilePrompt(filename);
    });
    actions.appendChild(renameBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "file-action-btn";
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteFilePrompt(filename);
    });
    actions.appendChild(deleteBtn);

    item.appendChild(actions);
    els.fileTreeContainer.appendChild(item);
  });
}

function switchActiveFile(filename) {
  if (state.activeFile === filename) return;
  state.activeFile = filename;
  editor.setValue(state.files[filename] || "");
  renderFileTree();
  compileLatex();
  saveDraftLocal();
}

function renameFilePrompt(filename) {
  const newName = prompt(`Enter a new name for ${filename}:`, filename);
  if (!newName || newName.trim() === "" || newName === filename) return;
  
  const trimmed = newName.trim();
  state.files[trimmed] = state.files[filename];
  delete state.files[filename];
  
  if (state.activeFile === filename) {
    state.activeFile = trimmed;
  }
  renderFileTree();
  saveDraftLocal();
}

function deleteFilePrompt(filename) {
  const keys = Object.keys(state.files);
  if (keys.length <= 1) {
    alert("You must keep at least one file in your LaTeX project.");
    return;
  }
  
  if (confirm(`Are you sure you want to delete ${filename}?`)) {
    delete state.files[filename];
    if (state.activeFile === filename) {
      state.activeFile = Object.keys(state.files)[0];
      editor.setValue(state.files[state.activeFile]);
    }
    renderFileTree();
    compileLatex();
    saveDraftLocal();
  }
}

// 10. Draggable sections implementation
function initDraggableAccordions() {
  const container = els.formEditorContent;
  const items = container.querySelectorAll(".accordion-item");
  
  items.forEach((item, idx) => {
    // Keep Personal Details locked at index 0
    if (idx === 0) return;
    
    item.setAttribute("draggable", "true");
    
    // Insert drag handle lines next to header titles
    const header = item.querySelector(".accordion-header");
    if (!header.querySelector(".drag-handle")) {
      const handle = document.createElement("i");
      handle.className = "fas fa-grip-lines drag-handle";
      handle.style.cssText = "cursor: grab; margin-right: 12px; color: var(--text-muted); font-size: 0.85rem; padding: 4px;";
      header.insertBefore(handle, header.firstChild);
      
      // Stop accordion collapse trigger when clicking dragging grip
      handle.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }
    
    item.addEventListener("dragstart", (e) => {
      item.classList.add("dragging");
      e.dataTransfer.setData("text/plain", idx);
      e.dataTransfer.effectAllowed = "move";
    });
    
    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      updateSectionOrderFromDOM();
    });
    
    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingItem = container.querySelector(".dragging");
      const siblings = [...container.querySelectorAll(".accordion-item:not(.dragging)")];
      
      // Prevent dragging above index 0 (Personal Details card)
      const nextSibling = siblings.find(sibling => {
        if (sibling === siblings[0]) return false;
        const box = sibling.getBoundingClientRect();
        return e.clientY <= box.top + box.height / 2;
      });
      
      if (nextSibling) {
        container.insertBefore(draggingItem, nextSibling);
      } else {
        container.appendChild(draggingItem);
      }
    });
  });
}

function reorderAccordionsInDOM() {
  renderDynamicAccordions();
}

function updateSectionOrderFromDOM() {
  const container = els.formEditorContent;
  const items = [...container.querySelectorAll(".accordion-item")];
  
  const newOrder = [];
  items.forEach(item => {
    const key = item.getAttribute("data-section-key");
    if (key) {
      newOrder.push(key);
    }
  });
  
  state.sectionOrder = newOrder;
  saveDraftLocal();
  syncFormToEditor();
}

// 11. Event bindings
function bindEvents() {
  els.recompileBtn.addEventListener("click", compileLatex);
  
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      compileLatex();
    }
  });

  els.downloadTexBtn.addEventListener("click", () => {
    const filename = state.activeFile;
    const content = editor.getValue();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  els.printPdfBtn.addEventListener("click", () => {
    window.print();
  });

  els.copyCodeBtn.addEventListener("click", () => {
    const text = editor.getValue();
    navigator.clipboard.writeText(text).then(() => {
      const prevHtml = els.copyCodeBtn.innerHTML;
      els.copyCodeBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        els.copyCodeBtn.innerHTML = prevHtml;
      }, 1500);
    }).catch(err => {
      console.error("Clipboard copy failed", err);
    });
  });

  els.themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
  });

  els.projectTitleInput.addEventListener("change", () => {
    state.projectName = els.projectTitleInput.value.trim() || "My LaTeX Document";
    saveDraftLocal();
  });

  els.templateSelect.addEventListener("change", () => {
    const selected = els.templateSelect.value;
    if (TEMPLATE_FORM_DATA[selected]) {
      if (confirm("Loading a template will overwrite your current details. Continue?")) {
        formData = JSON.parse(JSON.stringify(TEMPLATE_FORM_DATA[selected]));
        initForms();
        syncFormToEditor();
      }
    }
  });

  els.newFileBtn.addEventListener("click", () => {
    const name = prompt("Enter filename (e.g. sections.tex):");
    if (!name || name.trim() === "") return;
    
    let filename = name.trim();
    if (!filename.endsWith(".tex")) {
      filename += ".tex";
    }
    
    if (state.files[filename] !== undefined) {
      alert("A file with that name already exists.");
      return;
    }
    
    state.files[filename] = `% ${filename}\n\\section{New Section}\nWrite your content here...`;
    state.activeFile = filename;
    editor.setValue(state.files[filename]);
    renderFileTree();
    compileLatex();
    saveDraftLocal();
  });

  els.autoCompileToggle.addEventListener("change", () => {
    state.autoCompile = els.autoCompileToggle.checked;
  });

  els.zoomInBtn.addEventListener("click", () => {
    state.zoom = Math.min(1.5, state.zoom + 0.05);
    updateZoom();
  });
  els.zoomOutBtn.addEventListener("click", () => {
    state.zoom = Math.max(0.5, state.zoom - 0.05);
    updateZoom();
  });

  els.fontSizeSelect.addEventListener("change", () => {
    const size = els.fontSizeSelect.value;
    editor.getWrapperElement().style.fontSize = size;
    editor.refresh();
    state.fontSize = size;
    applySpacingClasses();
    saveDraftLocal();
  });

  els.editorThemeSelect.addEventListener("change", () => {
    const theme = els.editorThemeSelect.value;
    editor.setOption("theme", theme);
    state.editorTheme = theme;
    saveDraftLocal();
  });

  els.lineWrappingCheckbox.addEventListener("change", () => {
    const wrap = els.lineWrappingCheckbox.checked;
    editor.setOption("lineWrapping", wrap);
    state.lineWrapping = wrap;
    saveDraftLocal();
  });

  els.pageBudgetSelect.addEventListener("change", () => {
    state.pageBudget = els.pageBudgetSelect.value;
    applySpacingClasses();
    saveDraftLocal();
    compileLatex();
  });

  els.compactnessSelect.addEventListener("change", () => {
    state.compactness = els.compactnessSelect.value;
    applySpacingClasses();
    syncFormToEditor();
  });

  els.sectionSpacingSelect.addEventListener("change", () => {
    state.sectionSpacing = els.sectionSpacingSelect.value;
    syncFormToEditor();
  });

  // Interactive Preview Click-to-Edit
  els.compiledContentContainer.addEventListener("click", (e) => {
    const target = e.target;
    
    const closestSection = target.closest(".latex-document h2.section-title");
    const inHeader = target.closest(".latex-document .text-center");
    
    if (inHeader) {
      openAccordionSection(0);
    } else if (closestSection) {
      const text = closestSection.textContent.toLowerCase();
      if (text.includes("education")) {
        const idx = state.sectionOrder.indexOf("education") + 1;
        openAccordionSection(idx);
      } else if (text.includes("experience")) {
        const idx = state.sectionOrder.indexOf("experience") + 1;
        openAccordionSection(idx);
      } else if (text.includes("project")) {
        const idx = state.sectionOrder.indexOf("projects") + 1;
        openAccordionSection(idx);
      } else if (text.includes("certificate")) {
        const idx = state.sectionOrder.indexOf("certificates") + 1;
        openAccordionSection(idx);
      } else if (text.includes("skills")) {
        const idx = state.sectionOrder.indexOf("skills") + 1;
        openAccordionSection(idx);
      }
    } else {
      let prev = target;
      while (prev) {
        if (prev.classList && prev.classList.contains("section-title")) {
          const text = prev.textContent.toLowerCase();
          if (text.includes("education")) openAccordionSection(state.sectionOrder.indexOf("education") + 1);
          else if (text.includes("experience")) openAccordionSection(state.sectionOrder.indexOf("experience") + 1);
          else if (text.includes("project")) openAccordionSection(state.sectionOrder.indexOf("projects") + 1);
          else if (text.includes("certificate")) openAccordionSection(state.sectionOrder.indexOf("certificates") + 1);
          else if (text.includes("skills")) openAccordionSection(state.sectionOrder.indexOf("skills") + 1);
          break;
        }
        if (prev.classList && prev.classList.contains("latex-document")) {
          openAccordionSection(0);
          break;
        }
        prev = prev.previousElementSibling || prev.parentElement;
      }
    }
  });

  els.aiPolishBtn.addEventListener("click", handleAiPolish);
}

function openAccordionSection(index) {
  switchTab("form");
  
  const items = document.querySelectorAll(".accordion-item");
  items.forEach((item, idx) => {
    if (idx === index) {
      item.classList.add("active");
      setTimeout(() => {
        scrollToAccordionItem(item);
      }, 180);
    } else {
      item.classList.remove("active");
    }
  });
}

function updateZoom() {
  document.documentElement.style.setProperty("--zoom-factor", state.zoom);
  els.zoomPercentText.textContent = `${Math.round(state.zoom * 100)}%`;
}

// 12. Gemini AI Polish helper
async function handleAiPolish() {
  const selectedText = editor.getSelection();
  const promptVal = els.aiPromptTextarea.value.trim();
  const apiKey = els.geminiApiKeyInput.value.trim();

  let targetText = selectedText || promptVal;
  if (!targetText) {
    alert("Please select some LaTeX code in the editor or write details in the input box first.");
    return;
  }

  els.aiPolishBtn.disabled = true;
  els.aiPolishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Polishing...';

  if (!apiKey) {
    setTimeout(() => {
      let polished = targetText;
      if (targetText.includes("Created web") || targetText.includes("made web")) {
        polished = "Architected and deployed a responsive web portal, enhancing server response times by 20% and driving a 15% increase in user retention.";
      } else if (targetText.includes("worked on") || targetText.includes("did data")) {
        polished = "Streamlined data engineering pipelines, increasing query execution efficiency by 35% using index tuning and caching layers.";
      } else {
        polished = targetText
          .replace(/\b(created|made)\b/gi, "engineered")
          .replace(/\b(helped|assisted)\b/gi, "spearheaded")
          .replace(/\b(improved|made better)\b/gi, "optimized")
          .replace(/\b(worked on)\b/gi, "architected");
      }
      
      if (selectedText) {
        editor.replaceSelection(polished);
      } else {
        els.aiPromptTextarea.value = polished;
      }
      els.aiPolishBtn.disabled = false;
      els.aiPolishBtn.innerHTML = '<i class="fas fa-sparkles"></i> Polish Content';
      alert("Local heuristic polish complete. For neural Gemini results, enter your Google Gemini API Key in the sidebar.");
      compileLatex();
    }, 1200);
    return;
  }

  try {
    const promptText = `You are an expert LaTeX writing assistant. Enhance this content to be highly professional, structured, and grammatically perfect. Ensure that any LaTeX formatting commands inside the selection (like \\section, \\begin, \\item, \\textbf, \\%, etc.) are preserved exactly. Only return the polished text/code inside a plain response without markdown wraps. Here is the input:\n\n${targetText}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini API request failed.");
    }
    
    let polished = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (polished) {
      polished = polished.trim();
      if (polished.startsWith("```")) {
        polished = polished.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
      }
      if (selectedText) {
        editor.replaceSelection(polished);
      } else {
        els.aiPromptTextarea.value = polished;
      }
      compileLatex();
      alert("Success! LaTeX content polished with Gemini AI.");
    } else {
      throw new Error("Empty response received from Gemini.");
    }
  } catch (err) {
    alert(`Gemini Error: ${err.message}`);
  } finally {
    els.aiPolishBtn.disabled = false;
    els.aiPolishBtn.innerHTML = '<i class="fas fa-sparkles"></i> Polish Content';
  }
}

// 13. Bi-directional LaTeX to Form Parser
function extractArguments(latexText, startIndex) {
  let curr = startIndex;
  const args = [];
  
  while (curr < latexText.length) {
    while (curr < latexText.length && /\s/.test(latexText[curr])) {
      curr++;
    }
    if (latexText[curr] !== '{') {
      break;
    }
    let start = curr + 1;
    let braceCount = 1;
    curr++;
    
    while (curr < latexText.length && braceCount > 0) {
      if (latexText[curr] === '{') braceCount++;
      else if (latexText[curr] === '}') braceCount--;
      curr++;
    }
    
    if (braceCount === 0) {
      args.push(latexText.slice(start, curr - 1));
    } else {
      break;
    }
  }
  return { args, nextIndex: curr };
}

function parseLatexToForm(latex) {
  if (!latex) return null;
  
  const cleanCode = latex;
  const data = {
    name: "",
    email: "",
    phone: "",
    github: "",
    linkedin: "",
    leetcode: "",
    education: [],
    experience: [],
    projects: [],
    certificates: [],
    skills: []
  };

  function cleanVal(str) {
    if (!str) return "";
    let s = str.trim();
    s = s.replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1');
    s = s.replace(/\\underline\{([^}]*)\}/g, '$1');
    s = s.replace(/\\textbf\{([^}]*)\}/g, '$1');
    s = s.replace(/\\emph\{([^}]*)\}/g, '$1');
    s = s.replace(/\\&/g, '&')
         .replace(/\\_/g, '_')
         .replace(/\\\$/g, '$')
         .replace(/\\%/g, '%')
         .replace(/\\#/g, '#')
         .replace(/\\\{/g, '{')
         .replace(/\\\}/g, '}')
         .replace(/\\textbackslash\{\}/g, '\\');
    return s.trim();
  }

  // 1. Header parsing
  const nameMatch = cleanCode.match(/\\textbf\s*\{\s*\\Huge\s*(?:\\scshape\s*)?\{?([^{}]+)\}?\}/i);
  if (nameMatch) {
    data.name = cleanVal(nameMatch[1]);
  } else {
    const hugeMatch = cleanCode.match(/\\Huge\s+([^\n\\}]+)/i);
    if (hugeMatch) data.name = cleanVal(hugeMatch[1]);
  }

  const lines = cleanCode.split("\n");
  lines.forEach(line => {
    if (line.includes("href") || line.includes("mailto") || line.includes("@") || line.includes("linkedin") || line.includes("github")) {
      const parts = line.split(/\|\s*~?|~\s*\|\s*|\\hfill/);
      parts.forEach(part => {
        const cleanPart = part.trim();
        if (cleanPart.includes("mailto:")) {
          const emailMatch = cleanPart.match(/mailto:([^}]+)/);
          if (emailMatch) data.email = cleanVal(emailMatch[1]);
        } else if (cleanPart.includes("linkedin.com")) {
          const liMatch = cleanPart.match(/href\{([^}]+)\}/);
          if (liMatch) data.linkedin = cleanVal(liMatch[1]);
        } else if (cleanPart.includes("github.com")) {
          const ghMatch = cleanPart.match(/href\{([^}]+)\}/);
          if (ghMatch) data.github = cleanVal(ghMatch[1]);
        } else if (cleanPart.includes("leetcode.com")) {
          const lcMatch = cleanPart.match(/href\{([^}]+)\}/);
          if (lcMatch) data.leetcode = cleanVal(lcMatch[1]);
        } else if (cleanPart.includes("@")) {
          const atMatch = cleanPart.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (atMatch) data.email = atMatch[1];
        } else {
          const stripPart = cleanPart.replace(/\\small\s+/g, "").replace(/[{}\\]/g, "").trim();
          if (/^\+?[\d\s-]{7,20}$/.test(stripPart)) {
            data.phone = stripPart;
          }
        }
      });
    }
  });

  function getSectionContent(secName) {
    let aliases = [secName];
    const secLower = secName.toLowerCase();
    
    if (secLower === "experience") {
      aliases = ["experience", "e\\\\xperience", "work experience", "professional experience"];
    } else if (secLower === "education") {
      aliases = ["education", "academic background"];
    } else if (secLower === "projects") {
      aliases = ["projects", "personal projects", "selected projects", "academic projects"];
    } else if (secLower === "certificates") {
      aliases = ["certificates", "certifications", "licenses"];
    } else if (secLower === "skills" || secLower === "technical skills") {
      aliases = ["technical skills", "skills", "technical expertise"];
    }
    
    const patternStr = `\\\\section\\{(?:${aliases.join("|")})\\}([\\s\\S]*?)(?=\\\\section|\\\\end\\{document\\}|$)`;
    const regex = new RegExp(patternStr, "i");
    const match = cleanCode.match(regex);
    return match ? match[1] : "";
  }

  // 2. Education parsing
  const eduContent = getSectionContent("Education");
  if (eduContent) {
    let idx = 0;
    while (true) {
      idx = eduContent.indexOf("\\resumeSubheading", idx);
      if (idx === -1) break;
      
      const { args, nextIndex } = extractArguments(eduContent, idx + "\\resumeSubheading".length);
      if (args.length >= 4) {
        data.education.push({
          institution: cleanVal(args[0]),
          location: cleanVal(args[1]),
          degree: cleanVal(args[2]),
          duration: cleanVal(args[3])
        });
      }
      idx = nextIndex;
    }
  }

  // 3. Experience parsing
  const expContent = getSectionContent("Experience");
  if (expContent) {
    let idx = 0;
    while (true) {
      idx = expContent.indexOf("\\resumeSubheading", idx);
      if (idx === -1) break;
      
      const { args, nextIndex } = extractArguments(expContent, idx + "\\resumeSubheading".length);
      idx = nextIndex;
      
      if (args.length >= 4) {
        const endOfBlock = expContent.indexOf("\\resumeSubheading", nextIndex);
        const blockText = expContent.slice(nextIndex, endOfBlock === -1 ? expContent.length : endOfBlock);
        
        const bullets = [];
        let bIdx = 0;
        while (true) {
          bIdx = blockText.indexOf("\\resumeItem", bIdx);
          if (bIdx === -1) break;
          const bArgs = extractArguments(blockText, bIdx + "\\resumeItem".length);
          if (bArgs.args.length >= 1) {
            bullets.push(cleanVal(bArgs.args[0]));
          }
          bIdx = bArgs.nextIndex;
        }
        
        data.experience.push({
          company: cleanVal(args[2]),
          location: cleanVal(args[3]),
          role: cleanVal(args[0]),
          duration: cleanVal(args[1]),
          bullets: bullets
        });
      }
    }
  }

  // 4. Projects parsing
  const projContent = getSectionContent("Projects");
  if (projContent) {
    let idx = 0;
    while (true) {
      idx = projContent.indexOf("\\resumeProjectHeading", idx);
      if (idx === -1) break;
      
      const { args, nextIndex } = extractArguments(projContent, idx + "\\resumeProjectHeading".length);
      idx = nextIndex;
      
      if (args.length >= 2) {
        const titleAndTech = args[0];
        const date = args[1];
        
        let title = "";
        let tech = "";
        const parts = titleAndTech.split(/\|\s*~?|~\s*\|\s*/);
        if (parts.length >= 2) {
          title = cleanVal(parts[0]);
          tech = cleanVal(parts[1]);
        } else {
          title = cleanVal(titleAndTech);
        }
        
        const endOfBlock = projContent.indexOf("\\resumeProjectHeading", nextIndex);
        const blockText = projContent.slice(nextIndex, endOfBlock === -1 ? projContent.length : endOfBlock);
        
        const bullets = [];
        let bIdx = 0;
        while (true) {
          bIdx = blockText.indexOf("\\resumeItem", bIdx);
          if (bIdx === -1) break;
          const bArgs = extractArguments(blockText, bIdx + "\\resumeItem".length);
          if (bArgs.args.length >= 1) {
            bullets.push(cleanVal(bArgs.args[0]));
          }
          bIdx = bArgs.nextIndex;
        }
        
        data.projects.push({
          title: title,
          technologies: tech,
          date: cleanVal(date),
          bullets: bullets
        });
      }
    }
  }

  // 5. Certificates parsing
  const certContent = getSectionContent("Certificates");
  if (certContent) {
    let idx = 0;
    while (true) {
      idx = certContent.indexOf("\\resumeProjectHeading", idx);
      if (idx === -1) break;
      
      const { args, nextIndex } = extractArguments(certContent, idx + "\\resumeProjectHeading".length);
      idx = nextIndex;
      
      if (args.length >= 2) {
        const titleAndIssuer = args[0];
        const date = args[1];
        
        let title = "";
        let issuer = "";
        const parts = titleAndIssuer.split(/\|\s*~?|~\s*\|\s*/);
        if (parts.length >= 2) {
          title = cleanVal(parts[0]);
          issuer = cleanVal(parts[1]);
        } else {
          title = cleanVal(titleAndIssuer);
        }
        
        data.certificates.push({
          title: title,
          issuer: issuer,
          date: cleanVal(date)
        });
      }
    }
  }

  // 6. Skills parsing
  const skillsContent = getSectionContent("Technical Skills");
  if (skillsContent) {
    const skillRegex = /\\textbf\{([^}]+)\}\s*\{:\s*([^\n\\}]+)\}/g;
    let match;
    while ((match = skillRegex.exec(skillsContent)) !== null) {
      data.skills.push({
        label: cleanVal(match[1]),
        value: match[2].trim()
      });
    }
  }

  // 7. Find all other custom sections
  const knownSectionNames = ["education", "experience", "projects", "certificates", "technical skills", "skills"];
  const allSectionHeaders = [];
  const sectionHeaderRegex = /\\section\{([^}]+)\}/g;
  let secMatch;
  while ((secMatch = sectionHeaderRegex.exec(cleanCode)) !== null) {
    allSectionHeaders.push(secMatch[1].trim());
  }

  data.customSections = [];

  allSectionHeaders.forEach(secName => {
    const secKey = secName.toLowerCase();
    // Skip known sections
    if (knownSectionNames.some(k => secKey.includes(k))) return;

    const content = getSectionContent(secName);
    if (!content) return;

    const customSec = {
      title: secName,
      items: []
    };

    // Case A: Contains subheadings or project headings
    if (content.includes("\\resumeProjectHeading") || content.includes("\\resumeSubheading")) {
      let idx = 0;
      while (true) {
        let headingType = "";
        const projIdx = content.indexOf("\\resumeProjectHeading", idx);
        const subIdx = content.indexOf("\\resumeSubheading", idx);
        
        if (projIdx === -1 && subIdx === -1) break;
        
        let foundIdx = -1;
        if (projIdx !== -1 && subIdx !== -1) {
          if (projIdx < subIdx) {
            foundIdx = projIdx;
            headingType = "project";
          } else {
            foundIdx = subIdx;
            headingType = "subheading";
          }
        } else if (projIdx !== -1) {
          foundIdx = projIdx;
          headingType = "project";
        } else {
          foundIdx = subIdx;
          headingType = "subheading";
        }
        
        const cmdLength = headingType === "project" ? "\\resumeProjectHeading".length : "\\resumeSubheading".length;
        const { args, nextIndex } = extractArguments(content, foundIdx + cmdLength);
        
        let title = "";
        let subtitle = "";
        let date = "";
        
        if (headingType === "project") {
          if (args.length >= 2) {
            const titleAndSub = args[0];
            date = cleanVal(args[1]);
            const parts = titleAndSub.split(/\|\s*~?|~\s*\|\s*/);
            if (parts.length >= 2) {
              title = cleanVal(parts[0]);
              subtitle = cleanVal(parts[1]);
            } else {
              title = cleanVal(titleAndSub);
            }
          }
        } else {
          if (args.length >= 4) {
            title = cleanVal(args[0]);
            date = cleanVal(args[1]);
            subtitle = cleanVal(args[2]);
            const extra = cleanVal(args[3]);
            if (extra) subtitle += " (" + extra + ")";
          }
        }
        
        // Find bullets in this item block
        let endOfBlock = content.indexOf("\\resumeProjectHeading", nextIndex);
        const subNextIdx = content.indexOf("\\resumeSubheading", nextIndex);
        if (endOfBlock === -1 || (subNextIdx !== -1 && subNextIdx < endOfBlock)) {
          endOfBlock = subNextIdx;
        }
        
        const blockText = content.slice(nextIndex, endOfBlock === -1 ? content.length : endOfBlock);
        const bullets = [];
        let bIdx = 0;
        while (true) {
          bIdx = blockText.indexOf("\\resumeItem", bIdx);
          if (bIdx === -1) break;
          const bArgs = extractArguments(blockText, bIdx + "\\resumeItem".length);
          if (bArgs.args.length >= 1) {
            bullets.push(cleanVal(bArgs.args[0]));
          }
          bIdx = bArgs.nextIndex;
        }
        
        customSec.items.push({
          title: title,
          subtitle: subtitle,
          date: date,
          bullets: bullets
        });
        
        idx = nextIndex;
      }
    } 
    // Case B: Simple bullet items
    else if (content.includes("\\resumeItem") || content.includes("\\item")) {
      const bullets = [];
      let bIdx = 0;
      
      while (true) {
        bIdx = content.indexOf("\\resumeItem", bIdx);
        if (bIdx === -1) break;
        const bArgs = extractArguments(content, bIdx + "\\resumeItem".length);
        if (bArgs.args.length >= 1) {
          bullets.push(cleanVal(bArgs.args[0]));
        }
        bIdx = bArgs.nextIndex;
      }
      
      if (bullets.length === 0) {
        let itemIdx = 0;
        while (true) {
          itemIdx = content.indexOf("\\item", itemIdx);
          if (itemIdx === -1) break;
          
          let endItem = content.indexOf("\\item", itemIdx + 5);
          if (endItem === -1) endItem = content.indexOf("\\end", itemIdx + 5);
          if (endItem === -1) endItem = content.length;
          
          let itemText = content.slice(itemIdx + 5, endItem).trim();
          if (itemText) bullets.push(cleanVal(itemText));
          
          itemIdx = itemIdx + 5;
        }
      }
      
      customSec.items.push({
        title: "",
        subtitle: "",
        date: "",
        bullets: bullets
      });
    }
    // Case C: Raw paragraph content
    else {
      const paragraphs = content.split("\n\n").map(p => cleanVal(p)).filter(p => p !== "");
      paragraphs.forEach(p => {
        customSec.items.push({
          title: p,
          subtitle: "",
          date: "",
          bullets: []
        });
      });
    }
    
    if (customSec.items.length) {
      data.customSections.push(customSec);
    }
  });

  if (allSectionHeaders.length) {
    state.sectionOrder = allSectionHeaders.map(s => s.toLowerCase());
  }

  // Extract section spacing if present (e.g. \vspace{-15pt} after a section)
  const spacingMatch = cleanCode.match(/\\section\{[^}]+\}\s*\\vspace\{([^}]+)\}/i);
  if (spacingMatch) {
    state.sectionSpacing = spacingMatch[1].trim();
    if (els.sectionSpacingSelect) {
      els.sectionSpacingSelect.value = state.sectionSpacing;
    }
  }

  // Fallback to default if everything is empty to prevent crashes
  if (!data.name && !data.education.length && !data.experience.length && !data.projects.length && !data.skills.length && !data.customSections.length) {
    return null;
  }

  return data;
}
