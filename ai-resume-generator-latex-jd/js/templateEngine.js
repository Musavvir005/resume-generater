// ResuCraft AI - LaTeX Compiler & Templates Engine
// Features a custom recursive parser for resume LaTeX environments, tables, equations, and macros.

const TEMPLATES = {
  jakes_resume: {
    name: "Jake's Resume (Engineering)",
    filename: "resume.tex",
    latex: `%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
{{MARGINS}}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

{{LIST_DEFINITIONS}}

\\begin{document}

{{HEADER}}

{{BODY}}

\\end{document}
`
  }
};

function escapeLatex(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/_/g, "\\_")
    .replace(/\$/g, "\\$")
    .replace(/%/g, "\\%")
    .replace(/#/g, "\\#")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\~{}")
    .replace(/\^/g, "\\^{}");
}

function formatUrl(val) {
  if (!val) return "";
  let clean = val.trim();
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }
  return clean;
}

function generateLatexFromForm(data, templateId, compactness = "normal", sectionOrder = ["education", "experience", "projects", "skills"], sectionSpacing = "-15pt") {
  let template = TEMPLATES.jakes_resume.latex;

  // 1. Spacing and Margins Logic based on compactness
  let margins = "";
  let listDefs = "";
  
  if (compactness === "compact") {
    margins = `\\addtolength{\\oddsidemargin}{-0.65in}
\\addtolength{\\evensidemargin}{-0.65in}
\\addtolength{\\textwidth}{1.3in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}`;
    listDefs = `\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}, itemsep=1.0pt, parsep=0pt, topsep=1.0pt]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}[itemsep=0.8pt, parsep=0pt, topsep=0.5pt]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}`;
  } else if (compactness === "loose") {
    margins = `\\addtolength{\\oddsidemargin}{-0.4in}
\\addtolength{\\evensidemargin}{-0.4in}
\\addtolength{\\textwidth}{0.8in}
\\addtolength{\\topmargin}{-.3in}
\\addtolength{\\textheight}{0.6in}`;
    listDefs = `\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}, itemsep=4.0pt, parsep=1.0pt, topsep=3.0pt]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}[itemsep=3.0pt, parsep=1.0pt, topsep=2.0pt]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}`;
  } else {
    // normal
    margins = `\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}`;
    listDefs = `\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}`;
  }

  // 2. Generate Header block (Strictly follows Jake's formatting)
  const links = [];
  if (data.phone) links.push(`${escapeLatex(data.phone)}`);
  if (data.email) links.push(`\\href{mailto:${data.email}}{\\underline{${escapeLatex(data.email)}}}`);
  
  if (data.linkedin) {
    const cleanLnk = data.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "");
    links.push(`\\href{${formatUrl(data.linkedin)}}{\\underline{linkedin.com/in/${escapeLatex(cleanLnk)}}}`);
  }
  if (data.github) {
    const cleanGit = data.github.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "");
    links.push(`\\href{${formatUrl(data.github)}}{\\underline{github.com/${escapeLatex(cleanGit)}}}`);
  }
  
  const header = `%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeLatex(data.name || "Full Name")}} \\\\ \\vspace{1pt}
    \\small ${links.join(" $|$ ")}
\\end{center}`;

  // 3. Generate Education section
  let education = "";
  if (data.education && data.education.length) {
    const items = data.education.map(edu => {
      return `    \\resumeSubheading
      {${escapeLatex(edu.institution)}}{${escapeLatex(edu.location)}}
      {${escapeLatex(edu.degree)}}{${escapeLatex(edu.duration)}}`;
    }).join("\n");
    
    education = `%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd`;
  }

  // 4. Generate Experience section (strictly follows mapping: Role, Duration, Company, Location)
  let experience = "";
  if (data.experience && data.experience.length) {
    const items = data.experience.map(exp => {
      const bullets = (exp.bullets || []).filter(b => typeof b === "string" && b.trim() !== "").map(b => {
        return `        \\resumeItem{${escapeLatex(b)}}`;
      }).join("\n");

      // Jake's Resume Experience subheading argument order
      return `    \\resumeSubheading
      {${escapeLatex(exp.role)}}{${escapeLatex(exp.duration)}}
      {${escapeLatex(exp.company)}}{${escapeLatex(exp.location)}}
      \\resumeItemListStart
${bullets}
      \\resumeItemListEnd`;
    }).join("\n");

    experience = `%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd`;
  }

  // 5. Generate Projects section
  let projects = "";
  if (data.projects && data.projects.length) {
    const items = data.projects.map(proj => {
      const bullets = (proj.bullets || []).filter(b => typeof b === "string" && b.trim() !== "").map(b => `            \\resumeItem{${escapeLatex(b)}}`).join("\n");
      return `      \\resumeProjectHeading
          {\\textbf{${escapeLatex(proj.title)}} $|$ \\emph{${escapeLatex(proj.technologies)}}}{${escapeLatex(proj.date)}}
          \\resumeItemListStart
${bullets}
          \\resumeItemListEnd`;
    }).join("\n");
    
    projects = `%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
${items}
    \\resumeSubHeadingListEnd`;
  }

  // 6. Generate Certificates section
  let certificates = "";
  if (data.certificates && data.certificates.length) {
    const items = data.certificates.map(cert => {
      return `      \\resumeProjectHeading
          {\\textbf{${escapeLatex(cert.title)}} $|$ \\emph{${escapeLatex(cert.issuer)}}}{${escapeLatex(cert.date)}}`;
    }).join("\n");
    
    certificates = `%-----------CERTIFICATES-----------
\\section{Certificates}
    \\resumeSubHeadingListStart
${items}
    \\resumeSubHeadingListEnd`;
  }

  // 7. Generate Skills section
  let skills = "";
  if (data.skills && data.skills.length) {
    const rows = data.skills.map(skill => {
      return `     \\textbf{${escapeLatex(skill.label)}}{: ${escapeLatex(skill.value)}} \\\\`;
    });

    if (rows.length) {
      // Strip trailing double backslashes from the last row
      let rowsJoined = "";
      for (let i = 0; i < rows.length; i++) {
        if (i === rows.length - 1) {
          rowsJoined += rows[i].replace(/\s*\\\\\s*$/, "");
        } else {
          rowsJoined += rows[i] + "\n";
        }
      }

      skills = `%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small\\item{
${rowsJoined}
    }
 \\end{itemize}`;
    }
  }

  // 8. Generate Custom Sections
  const customLatexMap = {};
  if (data.customSections && data.customSections.length) {
    data.customSections.forEach(cSec => {
      let secHtml = `%-----------${cSec.title.toUpperCase()}-----------\n\\section{${cSec.title}}\n  \\resumeSubHeadingListStart\n`;
      
      cSec.items.forEach(item => {
        if (item.title || item.subtitle || item.date) {
          let headingArg1 = "";
          if (item.title && item.subtitle) {
            headingArg1 = `\\textbf{${escapeLatex(item.title)}} $|$ \\emph{${escapeLatex(item.subtitle)}}`;
          } else if (item.title) {
            headingArg1 = `\\textbf{${escapeLatex(item.title)}}`;
          } else {
            headingArg1 = `\\emph{${escapeLatex(item.subtitle)}}`;
          }
          
          secHtml += `      \\resumeProjectHeading\n          {${headingArg1}}{${escapeLatex(item.date)}}\n`;
          
          if (item.bullets && item.bullets.length) {
            secHtml += `          \\resumeItemListStart\n`;
            item.bullets.forEach(b => {
              if (b && b.trim()) secHtml += `            \\resumeItem{${escapeLatex(b)}}\n`;
            });
            secHtml += `          \\resumeItemListEnd\n`;
          }
        } else if (item.bullets && item.bullets.length) {
          // Simple item list
          item.bullets.forEach(b => {
            if (b && b.trim()) secHtml += `    \\resumeItem{${escapeLatex(b)}}\n`;
          });
        }
      });
      
      secHtml += `  \\resumeSubHeadingListEnd`;
      customLatexMap[cSec.title.toLowerCase()] = secHtml;
    });
  }

  // Assemble body segments in correct draggable order
  let bodyContent = "";
  (sectionOrder || ["education", "experience", "projects", "certificates", "skills"]).forEach(sec => {
    const secLower = sec.toLowerCase();
    let secLatex = "";
    if (secLower === "education" && education) secLatex = education;
    else if (secLower === "experience" && experience) secLatex = experience;
    else if (secLower === "projects" && projects) secLatex = projects;
    else if (secLower === "certificates" && certificates) secLatex = certificates;
    else if (secLower === "skills" && skills) secLatex = skills;
    else if (secLower === "technical skills" && skills) secLatex = skills;
    else if (customLatexMap[secLower]) secLatex = customLatexMap[secLower];
    
    if (secLatex) {
      if (bodyContent) {
        bodyContent += `\n\n\\vspace{${sectionSpacing}}\n\n` + secLatex;
      } else {
        bodyContent += secLatex;
      }
    }
  });

  // Replace templates placeholders
  return template
    .replace("{{MARGINS}}", margins)
    .replace("{{LIST_DEFINITIONS}}", listDefs)
    .replace("{{HEADER}}", header)
    .replace("{{BODY}}", bodyContent);
}

function compileLatexToHtml(latex) {
  if (!latex) return `<div class="empty-state">No LaTeX content.</div>`;

  // 1. Strip comments safely
  let clean = latex.replace(/^[ \t]*%.*$/gm, '');
  clean = clean.replace(/([^\\])%.*$/gm, '$1');

  // Fix typos (such as E\xperience)
  clean = clean.replace(/E\\xperience/gi, 'Experience');

  // 2. Locate document body
  const docMatch = clean.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (!docMatch) {
    return `<div class="compile-error">
      <strong>Compilation Error:</strong><br>
      Could not find <code>\\begin{document}</code> and <code>\\end{document}</code> structure.
    </div>`;
  }
  let body = docMatch[1];

  // 3. Spacing Parser: Translate vertical spaces to CSS margins
  body = body.replace(/\\vspace\*?\{([^}]+)\}/g, (match, size) => {
    let pxVal = 4;
    const num = parseFloat(size);
    if (!isNaN(num)) {
      pxVal = num * 1.5; // conversion factor to pixel spaces
    }
    return `<div style="margin-top: ${pxVal}px;"></div>`;
  });

  // Clean up styling definitions/spacing tweaks that have no HTML equivalent
  body = body.replace(/\\raisebox\{[^}]*\}/g, '');
  body = body.replace(/\\hspace\*?\{[^{}]*\}/g, '');
  body = body.replace(/\\setlength\{[^{}]*\}\{[^{}]*\}/g, '');
  body = body.replace(/\\addtolength\{[^{}]*\}\{[^{}]*\}/g, '');
  body = body.replace(/\\pdfgentounicode[=\d]*/g, '');
  body = body.replace(/\\input\{[^{}]*\}/g, '');
  body = body.replace(/\\pagestyle\{[^{}]*\}/g, '');
  body = body.replace(/\\fancyhf\{\}/g, '');
  body = body.replace(/\\fancyfoot\{\}/g, '');
  body = body.replace(/\\renewcommand[^{}]*\{[^{}]*\}\{[^{}]*\}/g, '');
  body = body.replace(/\\titleformat[^{}]*\{[^{}]*\}\{[^{}]*\}\{[^{}]*\}\{[^{}]*\}\[[^\]]*\]/g, '');
  body = body.replace(/\\urlstyle\{[^{}]*\}/g, '');
  body = body.replace(/\\raggedbottom/g, '');
  body = body.replace(/\\raggedright/g, '');

  // 4. Center blocks and abstracts
  body = body.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, '<div class="text-center">$1</div>');
  body = body.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, '<div class="latex-abstract"><div class="abstract-title">Abstract</div>$1</div>');

  // Helper function for brace extraction
  function parseCommand(latexText, cmdName, numArgs, replaceFn) {
    const searchStr = "\\" + cmdName;
    let idx = 0;
    while (true) {
      idx = latexText.indexOf(searchStr, idx);
      if (idx === -1) break;

      const nextChar = latexText[idx + searchStr.length];
      if (nextChar && /[a-zA-Z]/.test(nextChar)) {
        idx += searchStr.length;
        continue;
      }

      let curr = idx + searchStr.length;
      const args = [];
      let failed = false;

      for (let a = 0; a < numArgs; a++) {
        while (curr < latexText.length && /\s/.test(latexText[curr])) {
          curr++;
        }
        if (latexText[curr] !== '{') {
          failed = true;
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

        if (braceCount > 0) {
          failed = true;
          break;
        }
        args.push(latexText.slice(start, curr - 1));
      }

      if (failed) {
        idx += searchStr.length;
        continue;
      }

      const replacement = replaceFn(...args);
      latexText = latexText.slice(0, idx) + replacement + latexText.slice(curr);
      idx += replacement.length;
    }
    return latexText;
  }

  // 5. Parse custom formatting switches in header
  body = body.replace(/\\textbf\s*\{\s*\\Huge\s*\\scshape\s*([^{}]+)\}/g, '<span class="text-huge scshape"><strong>$1</strong></span>');
  body = body.replace(/\\textbf\s*\{\s*\\Huge\s*([^{}]+)\}/g, '<span class="text-huge"><strong>$1</strong></span>');
  body = body.replace(/\\small\s+([^\n]*)/g, '<span class="text-small">$1</span>');

  // 6. Parse LaTeX commands using brace-matching extractor
  body = parseCommand(body, "resumeSubheading", 4, (a, b, c, d) => {
    return `
      <div class="subheading">
        <div class="subheading-row subheading-header">
          <span class="subheading-title">${a.trim()}</span>
          <span class="subheading-location">${b.trim()}</span>
        </div>
        <div class="subheading-row subheading-details">
          <span class="subheading-role">${c.trim()}</span>
          <span class="subheading-duration">${d.trim()}</span>
        </div>
      </div>
    `;
  });

  body = parseCommand(body, "resumeProjectHeading", 2, (a, b) => {
    return `
      <div class="project-heading">
        <div class="subheading-row">
          <span class="project-title">${a.trim()}</span>
          <span class="project-date">${b.trim()}</span>
        </div>
      </div>
    `;
  });

  body = parseCommand(body, "resumeSubSubheading", 2, (a, b) => {
    return `
      <div class="subsubheading">
        <div class="subheading-row subheading-details">
          <span class="subheading-role">${a.trim()}</span>
          <span class="subheading-duration">${b.trim()}</span>
        </div>
      </div>
    `;
  });

  body = parseCommand(body, "section", 1, (title) => {
    return `<h2 class="section-title">${title.trim()}</h2>`;
  });

  body = parseCommand(body, "resumeItem", 1, (content) => {
    return `<li class="bullet-item">${content.trim()}</li>`;
  });
  
  body = parseCommand(body, "resumeSubItem", 1, (content) => {
    return `<li class="bullet-item">${content.trim()}</li>`;
  });

  body = parseCommand(body, "textbf", 1, (text) => `<strong>${text}</strong>`);
  body = parseCommand(body, "textit", 1, (text) => `<em>${text}</em>`);
  body = parseCommand(body, "emph", 1, (text) => `<em>${text}</em>`);
  body = parseCommand(body, "underline", 1, (text) => `<span style="text-decoration: underline;">${text}</span>`);

  body = parseCommand(body, "href", 2, (url, text) => {
    return `<a href="${url.trim()}" target="_blank" class="preview-link">${text.trim()}</a>`;
  });

  // 7. Process List Environments
  body = body.replace(/\\resumeSubHeadingListStart/g, '<div class="subheading-list">');
  body = body.replace(/\\resumeSubHeadingListEnd/g, '</div>');
  body = body.replace(/\\resumeItemListStart/g, '<ul class="bullet-list">');
  body = body.replace(/\\resumeItemListEnd/g, '</ul>');
  
  // Parse itemize environments and detect inline font switches like \small
  body = body.replace(/\\begin\{itemize\}(\[[^\]]*\])?([\s\S]*?)\\end\{itemize\}/g, (match, options, content) => {
    let hasSmall = false;
    let cleanContent = content;
    if (cleanContent.includes("\\small")) {
      hasSmall = true;
      cleanContent = cleanContent.replace(/\\small\s*/g, '');
    }
    const listClass = hasSmall ? 'bullet-list text-small' : 'bullet-list';
    return `<ul class="${listClass}">${cleanContent}</ul>`;
  });

  body = body.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (match, content) => {
    let hasSmall = false;
    let cleanContent = content;
    if (cleanContent.includes("\\small")) {
      hasSmall = true;
      cleanContent = cleanContent.replace(/\\small\s*/g, '');
    }
    const listClass = hasSmall ? 'numbered-list text-small' : 'numbered-list';
    return `<ol class="${listClass}">${cleanContent}</ol>`;
  });

  body = body.replace(/\\item/g, '<li class="bullet-item">');

  // 8. Clean up remaining standalone grouping braces
  let hasBraces = true;
  while (hasBraces) {
    const braceMatch = body.match(/(?<!\\[a-zA-Z]+)\{([^{}]+)\}/);
    if (braceMatch) {
      body = body.replace(braceMatch[0], braceMatch[1]);
    } else {
      hasBraces = false;
    }
  }

  // 9. Math equations $ ... $
  body = body.replace(/\$([^$]+)\$/g, (match, mathContent) => {
    let formatted = mathContent
      .replace(/\^([^{}\s]+)/g, '<sup>$1</sup>')
      .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
      .replace(/_([^{}\s]+)/g, '<sub>$1</sub>')
      .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
      .replace(/\\alpha/g, '&alpha;')
      .replace(/\\beta/g, '&beta;')
      .replace(/\\gamma/g, '&gamma;')
      .replace(/\\theta/g, '&theta;')
      .replace(/\\pi/g, '&pi;')
      .replace(/\\sigma/g, '&sigma;')
      .replace(/\\sum/g, '&sum;')
      .replace(/\\int/g, '&int;')
      .replace(/\\times/g, '&times;')
      .replace(/\\div/g, '&divide;')
      .replace(/\\le/g, '&le;')
      .replace(/\\ge/g, '&ge;')
      .replace(/\\ne/g, '&ne;')
      .replace(/\\nabla/g, '&nabla;')
      .replace(/\\eta/g, '&eta;')
      .replace(/\\infty/g, '&infin;');
    return `<span class="latex-math">${formatted}</span>`;
  });

  // 10. Replace FontAwesome macros
  body = body.replace(/\\faGithub/g, '<i class="fab fa-github fa-fw"></i>');
  body = body.replace(/\\faLinkedin/g, '<i class="fab fa-linkedin fa-fw"></i>');
  body = body.replace(/\\faEnvelope/g, '<i class="fas fa-envelope fa-fw"></i>');
  body = body.replace(/\\faPhone/g, '<i class="fas fa-phone fa-fw"></i>');
  body = body.replace(/\\faCode/g, '<i class="fas fa-code fa-fw"></i>');

  // 11. Format spacings and inline dividers
  body = body.replace(/~?\|\s*~/g, ' <span class="divider">|</span> ');
  body = body.replace(/~|\\ /g, ' ');
  body = body.replace(/\\hfill/g, '<span class="hfill"></span>');

  // 12. Escape characters
  body = body.replace(/\\&/g, '&amp;');
  body = body.replace(/\\_/g, '_');
  body = body.replace(/\\\$/g, '$');
  body = body.replace(/\\%/g, '%');
  body = body.replace(/\\#/g, '#');
  body = body.replace(/\\\{/g, '{');
  body = body.replace(/\\\}/g, '}');

  body = body.replace(/\\\\/g, '<br>');
  body = body.replace(/\n\s*\n/g, '<div class="space-break"></div>');

  return `<div class="latex-document">${body}</div>`;
}

// Node export support if required, otherwise browser global
if (typeof module !== "undefined" && module.exports) {
  module.exports = { TEMPLATES, compileLatexToHtml, generateLatexFromForm };
} else {
  const globalObj = typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this);
  globalObj.TEMPLATES = TEMPLATES;
  globalObj.compileLatexToHtml = compileLatexToHtml;
  globalObj.generateLatexFromForm = generateLatexFromForm;
}
