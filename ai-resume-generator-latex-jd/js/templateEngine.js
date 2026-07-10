const USER_FORMAT_LATEX_TEMPLATE = String.raw`\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{multicol}
\usepackage{fontawesome5}
\setlength{\multicolsep}{-3.0pt}
\setlength{\columnsep}{-1pt}
\IfFileExists{glyphtounicode.tex}{\input{glyphtounicode}}{}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

{{LAYOUT_SPACING_CONFIG}}

\begin{document}

{{HEADER}}

{{EDUCATION}}

{{EXPERIENCE}}

{{PATENTS}}

{{PROJECTS}}

{{SKILLS}}

{{CERTIFICATIONS}}

{{ACHIEVEMENTS}}

\end{document}
`;

function buildLatexResume(data, resume) {
  const spacingConfig = String.raw`\addtolength{\oddsidemargin}{-0.6in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1.19in}
\addtolength{\topmargin}{-.7in}
\addtolength{\textheight}{1.4in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large\bfseries
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\pdfgentounicode=1

\newcommand{\resumeItem}[1]{
  \item\small{
    {#1}
  }
}

\newcommand{\resumeSubheading}[4]{
  \item
    \begin{tabular*}{1.0\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & \textbf{\small #2} \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-4pt}
}

\newcommand{\resumeSubSubheading}[2]{
    \item
    \begin{tabular*}{1.0\textwidth}{l@{\extracolsep{\fill}}r}
      \textit{\small#1} & \textit{\small #2} \\
    \end{tabular*}\vspace{-4pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{1.001\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & \textbf{\small #2}\\
    \end{tabular*}\vspace{-4pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-2pt}}

\renewcommand\labelitemi{$\vcenter{\hbox{\tiny$\bullet$}}$}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.0in, label={}, itemsep=2.0pt, parsep=0pt, topsep=1.0pt, partopsep=0pt]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}[leftmargin=0.15in, itemsep=1.5pt, parsep=0pt, topsep=1.0pt, partopsep=0pt]}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-2pt}}`;

  const maxProj = (data.projectCount !== undefined && data.projectCount !== null) ? data.projectCount : 3;
  const maxCerts = (data.certificateCount !== undefined && data.certificateCount !== null) ? data.certificateCount : 3;
  const finalAchievementsLimit = (data.achievementCount !== undefined && data.achievementCount !== null) ? data.achievementCount : 3;
  const maxBullets = 4;
  const finalSkillsLimit = (data.skillsPerCategory !== undefined && data.skillsPerCategory !== null) ? data.skillsPerCategory : 6;

  const cleanProjects = (resume.selectedProjects || []).slice(0, maxProj).map(p => ({
    ...p,
    bullets: (p.bullets || []).slice(0, maxBullets)
  }));
  const cleanCertificates = (resume.selectedCertificates || []).slice(0, maxCerts);
  const cleanAchievements = (resume.achievements || data.achievements || []).slice(0, finalAchievementsLimit);
  
  const cleanExperience = (resume.experience || data.experience || []).map(exp => ({
    ...exp,
    bullets: (exp.bullets || []).slice(0, maxBullets)
  }));

  const cleanSkills = {};
  if (resume.skills) {
    Object.keys(resume.skills).forEach(cat => {
      cleanSkills[cat] = (resume.skills[cat] || []).slice(0, finalSkillsLimit);
    });
  } else if (data.skills) {
    // Fallback if resume.skills is empty
    const cats = optimizeSkills(data.skills, resume.jdKeywords || []);
    Object.keys(cats).forEach(cat => {
      cleanSkills[cat] = (cats[cat] || []).slice(0, finalSkillsLimit);
    });
  }

  const replacements = {
    FONT_SIZE: "11pt",
    LAYOUT_SPACING_CONFIG: spacingConfig,
    HEADER: formatHeaderLatex(data),
    EDUCATION: formatEducationLatex(resume.education || data.education),
    EXPERIENCE: formatExperienceLatex(cleanExperience),
    PATENTS: formatPatentsLatex(resume.patents || data.patents),
    PROJECTS: formatProjectsLatex(cleanProjects),
    SKILLS: formatSkillsLatex(cleanSkills),
    CERTIFICATIONS: formatCertificatesLatex(cleanCertificates),
    ACHIEVEMENTS: formatAchievementsLatex(cleanAchievements)
  };

  return Object.entries(replacements).reduce((latex, [key, value]) => latex.replace(`{{${key}}}`, value || ""), USER_FORMAT_LATEX_TEMPLATE).replace(/\n{3,}/g, "\n\n");
}

function formatHeaderLatex(data) {
  const links = [];
  if (data.github) links.push(`\\href{${escapeLatexUrl(data.github)}}{\\raisebox{0\\height}\\faGithub\\ {Github}}`);
  if (data.linkedin) links.push(`\\href{${escapeLatexUrl(data.linkedin)}}{\\raisebox{0\\height}\\faLinkedin\\ {Linkedin}}`);
  if (data.leetcode) links.push(`\\href{${escapeLatexUrl(data.leetcode)}}{\\raisebox{0\\height}\\faCode\\ {LeetCode}}`);
  if (data.email) links.push(`\\href{mailto:${escapeLatexUrl(data.email)}}{\\raisebox{-0.1\\height}\\faEnvelope\\  {${escapeLatex(data.email)}}}`);
  if (data.phone) links.push(`\\small \\raisebox{-0.01\\height}\\faPhone\\ ${escapeLatex(data.phone)}`);

  return String.raw`\begin{center}
    \textbf{\Huge \scshape ${escapeLatex(data.name || "Student Name")}} \\ \vspace{2pt}
    ${links.join("\n    ~ $|$ ~ \n    ")}
    \vspace{-12pt}
\end{center}`;
}

function formatEducationLatex(education = []) {
  const items = (education || []).filter(row => row && (row.institution || row.degree));
  if (!items.length) return "";
  return `\\section{Education}\n  \\resumeSubHeadingListStart\n${items.map(edu => `    \\resumeSubheading\n      {${escapeLatex(edu.institution)}}{${escapeLatex(edu.location)}}\n      {${formatDegreeLatex(edu.degree)}}{${escapeLatex(edu.duration)}}`).join("\n")}\n  \\resumeSubHeadingListEnd`;
}

function formatExperienceLatex(experience = []) {
  const items = (experience || []).filter(row => row && (row.role || row.company));
  if (!items.length) return "";
  return `\\section{Experience}\n  \\resumeSubHeadingListStart\n${items.map(exp => `    \\resumeSubheading\n      {${escapeLatex(exp.role)}}{${escapeLatex(exp.duration)}}\n      {${escapeLatex(exp.company)}}{${escapeLatex(exp.location)}}\n      \\resumeItemListStart\n${formatBulletItems(exp.bullets)}\n      \\resumeItemListEnd`).join("\n")}\n  \\resumeSubHeadingListEnd`;
}

function formatPatentsLatex(patents = []) {
  const items = (patents || []).filter(row => row && (row.title || row.detail));
  if (!items.length) return "";
  return `\\section{Patents \\& Publications}\n  \\resumeSubHeadingListStart\n${items.map(item => `    \\resumeProjectHeading\n        {\\textbf{${escapeLatex(item.title)}}}{}\n        \\resumeItemListStart\n            \\resumeItem{${escapeLatex(item.detail)}}\n        \\resumeItemListEnd`).join("\n")}\n  \\resumeSubHeadingListEnd`;
}

function formatProjectsLatex(projects = []) {
  const items = (projects || []).filter(project => project && project.title);
  if (!items.length) return "";
  return `\\section{Projects}\n    \\resumeSubHeadingListStart\n    \n${items.map((project, index) => {
    const titleText = escapeLatex(project.title);
    const titleHeader = project.link ? `\\href{${escapeLatexUrl(project.link)}}{${titleText}}` : titleText;
    return `      \\resumeProjectHeading\n          {\\textbf{${titleHeader}} $|$ \\emph{${escapeLatex(arrayToText(project.technologies))}}}{}\n          \\resumeItemListStart\n${formatBulletItems(project.bullets)}\n          \\resumeItemListEnd`;
  }).join("\n          \n")}\n          \n    \\resumeSubHeadingListEnd`;
}

function formatSkillsLatex(skills = {}) {
  const rows = Object.entries(skills)
    .map(([category, values]) => [category, values])
    .filter(([, values]) => arrayToText(values));

  if (!rows.length) return "";

  return `\\section{Technical Skills}\n \\begin{itemize}[leftmargin=0.15in, label={}, itemsep=0pt, parsep=0pt, topsep=0pt]\n    \\small{\\item{\n${rows.map(([label, values]) => `     \\textbf{${escapeLatex(label)}}{: ${escapeLatex(arrayToText(values))}} \\\\`).join("\n")}\n    }}\n \\end{itemize}`;
}

function formatCertificatesLatex(certificates = []) {
  const items = (certificates || []).filter(cert => cert && cert.title);
  if (!items.length) return "";
  return `\\section{Certifications}\n    \\resumeSubHeadingListStart\n${items.map(cert => {
    const titleText = escapeLatex(cert.title);
    const titleHeader = cert.link ? `\\href{${escapeLatexUrl(cert.link)}}{${titleText}}` : titleText;
    return `        \\resumeProjectHeading\n            {\\textbf{${titleHeader}} -- ${escapeLatex(cert.issuer || "")}}{${escapeLatex(cert.date || "")}}`;
  }).join("\n")}\n    \\resumeSubHeadingListEnd`;
}

function formatAchievementsLatex(achievements = []) {
  const items = (achievements || []).filter(Boolean);
  if (!items.length) return "";
  return `\\section{Achievements}\n    \\resumeSubHeadingListStart\n${items.map(item => `        \\resumeProjectHeading\n            {${formatAchievementLatex(item)}}{}`).join("\n")}\n    \\resumeSubHeadingListEnd`;
}

function formatBulletItems(bullets = []) {
  const items = Array.isArray(bullets) ? bullets : String(bullets || "").split(/\n|\u2022/);
  return items.filter(Boolean).map(item => `        \\resumeItem{${escapeLatex(item)}}`).join("\n");
}

function formatDegreeLatex(value) {
  const escaped = escapeLatex(value || "");
  return escaped.replace(/(CGPA:\s*[^;]+)/i, "\\textbf{$1}");
}

function formatAchievementLatex(value) {
  const text = String(value || "");
  const parts = text.split("--");
  if (parts.length > 1) {
    return `\\textbf{${escapeLatex(parts[0].trim())}} -- ${escapeLatex(parts.slice(1).join("--").trim())}`;
  }
  return escapeLatex(text);
}

function buildHtmlPreview(data, resume) {
  const maxProj = (data.projectCount !== undefined && data.projectCount !== null) ? data.projectCount : 3;
  const maxCerts = (data.certificateCount !== undefined && data.certificateCount !== null) ? data.certificateCount : 3;
  const finalAchievementsLimit = (data.achievementCount !== undefined && data.achievementCount !== null) ? data.achievementCount : 3;
  const maxBullets = 4;
  const finalSkillsLimit = (data.skillsPerCategory !== undefined && data.skillsPerCategory !== null) ? data.skillsPerCategory : 6;

  const cleanProjects = (resume.selectedProjects || []).slice(0, maxProj).map(p => ({
    ...p,
    bullets: (p.bullets || []).slice(0, maxBullets)
  }));
  const cleanCertificates = (resume.selectedCertificates || []).slice(0, maxCerts);
  const cleanAchievements = (resume.achievements || data.achievements || []).slice(0, finalAchievementsLimit);
  
  const cleanExperience = (resume.experience || data.experience || []).map(exp => ({
    ...exp,
    bullets: (exp.bullets || []).slice(0, maxBullets)
  }));

  const cleanSkills = {};
  if (resume.skills) {
    Object.keys(resume.skills).forEach(cat => {
      cleanSkills[cat] = (resume.skills[cat] || []).slice(0, finalSkillsLimit);
    });
  } else if (data.skills) {
    const cats = optimizeSkills(data.skills, resume.jdKeywords || []);
    Object.keys(cats).forEach(cat => {
      cleanSkills[cat] = (cats[cat] || []).slice(0, finalSkillsLimit);
    });
  }

  return `
    <div class="center">
      <div class="name">${escapeHtml(data.name || "Student Name")}</div>
      <div class="muted">${[data.github && "GitHub", data.linkedin && "LinkedIn", data.leetcode && "LeetCode", data.email, data.phone].filter(Boolean).map(escapeHtml).join(" | ")}</div>
    </div>
    ${htmlSection("Education", (resume.education || data.education || []).map(edu => `
      <div class="resume-row"><strong>${escapeHtml(edu.institution || "")}</strong><strong>${escapeHtml(edu.location || "")}</strong></div>
      <div class="resume-row"><em>${escapeHtml(edu.degree || "")}</em><em>${escapeHtml(edu.duration || "")}</em></div>
    `).join(""))}
    ${htmlSection("Experience", cleanExperience.map(exp => `
      <div class="resume-row"><strong>${escapeHtml(exp.role || "")}</strong><strong>${escapeHtml(exp.duration || "")}</strong></div>
      <div class="resume-row"><em>${escapeHtml(exp.company || "")}</em><em>${escapeHtml(exp.location || "")}</em></div>
      ${htmlBullets(exp.bullets)}
    `).join(""))}
    ${htmlSection("Patents & Publications", (resume.patents || []).map(item => `
      <p><strong>${escapeHtml(item.title || "")}</strong></p>${htmlBullets([item.detail])}
    `).join(""))}
    ${htmlSection("Projects", cleanProjects.map(project => {
      const titleHtml = project.link ? `<a href="${escapeHtml(project.link)}" target="_blank" style="color: var(--primary); text-decoration: underline;">${escapeHtml(project.title || "")}</a>` : escapeHtml(project.title || "");
      return `
        <p class="project-title"><strong>${titleHtml}</strong> | <em>${escapeHtml(arrayToText(project.technologies))}</em></p>
        ${htmlBullets(project.bullets)}
      `;
    }).join(""))}
    ${htmlSection("Technical Skills", Object.entries(cleanSkills).filter(([, v]) => arrayToText(v)).map(([k, v]) => `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(arrayToText(v))}</p>`).join(""))}
    ${htmlSection("Certifications", cleanCertificates.map(cert => {
      const titleHtml = cert.link ? `<a href="${escapeHtml(cert.link)}" target="_blank" style="color: var(--primary); text-decoration: underline;">${escapeHtml(cert.title || "")}</a>` : escapeHtml(cert.title || "");
      return `<div class="resume-row"><strong>${titleHtml} -- ${escapeHtml(cert.issuer || "")}</strong><strong>${escapeHtml(cert.date || "")}</strong></div>`;
    }).join(""))}
    ${htmlSection("Achievements", htmlBullets(cleanAchievements))}
  `;
}

function htmlSection(title, content) {
  if (!String(content || "").trim()) return "";
  return `<h2>${escapeHtml(title)}</h2>${content}`;
}

function htmlBullets(items = []) {
  const list = (Array.isArray(items) ? items : [items]).filter(Boolean);
  if (!list.length) return "";
  return `<ul>${list.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function arrayToText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value || "");
}

function escapeLatex(value) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  
  // Smart quotes conversion: Replace alternating double quotes with `` and ''
  let quoteToggle = true;
  text = text.replace(/"/g, () => {
    const replacement = quoteToggle ? "``" : "''";
    quoteToggle = !quoteToggle;
    return replacement;
  });

  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function escapeLatexUrl(value) {
  return String(value || "").trim().replace(/%/g, "\\%").replace(/#/g, "\\#").replace(/{/g, "\\{").replace(/}/g, "\\}");
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
