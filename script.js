// === NOTICE FLOW AI – FINAL INSTITUTION BUILD ===

// --- 1. CONFIGURATION DATA ---
const SIGNATORY_ROLES = {
  'Principal': 'Principal, VPPCOE and VA',
  'HOD': 'Dr. Rais A. Mulla, HOD, Computer Engineering Dept.',
  'Academic_Coordinator': 'Prof. Atul Shintre, Academic Coordinator',
  'Exam_Coordinator': 'Exam Coordinator, VPPCOE'
};

// --- 2. ELEMENT REFERENCES ---
const toggle = document.getElementById('templateToggle');
const label = document.getElementById('templateLabel');
const generateBtn = document.querySelector(".generate-btn");
const outputSection = document.getElementById("output-section");
const noticeTitle = document.getElementById("notice-title");
const noticeSubjectHeader = document.getElementById("notice-subject-header");
const noticeText = document.getElementById("notice-text");
const noticeRefNum = document.getElementById("notice-ref-num");
const noticeDate = document.getElementById("notice-date");
const signaturesArea = document.getElementById("signatures-area");

// --- 3. TOGGLES & THEME ---
toggle.addEventListener('change', () => {
  label.textContent = toggle.checked ? 'Circular' : 'Notice';
});
document.getElementById('theme-switch').addEventListener('change', function () {
  document.body.setAttribute('data-theme', this.checked ? 'dark' : 'light');
});

// --- 4. CORE NOTICE GENERATION ---
async function generateNotice() {
  const title = document.getElementById("title").value.trim();
  const summary = document.getElementById("summary").value.trim();
  const ref_number_input = document.getElementById("ref_number").value.trim();
  const signatoryElements = document.getElementById("signatories").selectedOptions;
  const selectedSignatories = Array.from(signatoryElements).map(o => o.value);
  const isCircular = toggle.checked;
  const type = isCircular ? "Circular" : "Notice";

  if (!title || !summary || selectedSignatories.length === 0) {
    alert("Please enter Title, Summary, and select at least one Signatory!");
    return;
  }

  const originalText = generateBtn.textContent;
  generateBtn.textContent = "🧠 Generating...";
  generateBtn.disabled = true;
  outputSection.classList.add("hidden");

  try {
    // Local AI backend call
    const response = await fetch('http://localhost:3000/generate-notice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, summary, sign: selectedSignatories.join(', '), type })
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);

    const data = await response.json();
    const generatedText = data.text || summary;

    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric"
    });
    const refNum = ref_number_input === "VPP/Trust-Office/2025-26/AUTO"
      ? generateRefNumber() : ref_number_input;

    noticeSubjectHeader.textContent = type.toUpperCase();
    noticeTitle.textContent = title;
    noticeRefNum.textContent = refNum;
    noticeDate.textContent = today;
    noticeText.innerHTML = generatedText.replace(/\n/g, "<br>");
    generateSignatures(selectedSignatories);

    outputSection.classList.remove("hidden");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  } catch (err) {
    alert("Error generating notice: " + err.message);
    console.error(err);
  } finally {
    generateBtn.textContent = originalText;
    generateBtn.disabled = false;
  }
}

// --- 5. SIGNATURE HANDLER ---
function generateSignatures(signatories) {
  signaturesArea.innerHTML = "";
  if (signatories.length === 0) return;

  const ordered = signatories.sort((a, b) => {
    if (a === 'Principal') return 1;
    if (b === 'Principal') return -1;
    return 0;
  });

  if (ordered.length === 1)
    signaturesArea.classList.add('single-signature');
  else
    signaturesArea.classList.remove('single-signature');

  signaturesArea.innerHTML = ordered.map(k => {
    const fullRole = SIGNATORY_ROLES[k] || k;
    const [namePart, ...rest] = fullRole.split(',');
    return `
      <div class="signature-block" contenteditable="true" draggable="true">
        <p class="signature-name">${namePart.trim()}</p>
        <p class="signature-role">${rest.join(', ').trim()}</p>
      </div>`;
  }).join('');
}

// --- 6. REF NUMBER SEQUENCE ---
function generateRefNumber() {
  let counter = parseInt(localStorage.getItem('noticeCounter')) || 207;
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const yearString = `${currentYear % 100}-${nextYear % 100}`;
  const newRef = `VPP/Trust-Office/${yearString}/${counter}`;
  localStorage.setItem('noticeCounter', counter + 1);
  return newRef;
}

// --- 7. CLEAN PDF EXPORT ---
// function downloadPDF() {
//   const notice = document.getElementById("notice-template");
//   if (!notice) return alert("Notice template not found.");

//   const title = document.getElementById("title").value.trim() || "College_Notice";
//   const cleanName = title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
//   const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).replace(/\s/g, "");
//   const fileName = `${cleanName}_${today}.pdf`;

//   // Temporarily clean layout
//   const appContainer = document.querySelector('.app-container');
//   const originalBoxShadow = appContainer.style.boxShadow;
//   const originalBackground = document.body.style.background;
//   appContainer.style.boxShadow = "none";
//   document.body.style.background = "#fff";

//   const controls = notice.querySelectorAll('.delete-btn, .drag-btn, .sign-upload-input, .sign-upload-btn, .signatory-checkbox');
//   controls.forEach(ctrl => (ctrl.style.display = "none"));

//   const editableElements = notice.querySelectorAll('[contenteditable="true"]');
//   const prevStyles = Array.from(editableElements).map(el => ({
//     el, border: el.style.border, bg: el.style.backgroundColor, outline: el.style.outline
//   }));
//   editableElements.forEach(el => {
//     el.style.border = "none";
//     el.style.backgroundColor = "transparent";
//     el.style.outline = "none";
//   });

//   const opt = {
//     margin: 0.4,
//     filename: fileName,
//     image: { type: "jpeg", quality: 0.98 },
//     html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
//     jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
//     pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
//   };

//   html2pdf().set(opt).from(notice).save().then(() => {
//     // Restore styles
//     controls.forEach(ctrl => (ctrl.style.display = ""));
//     prevStyles.forEach(({ el, border, bg, outline }) => {
//       el.style.border = border;
//       el.style.backgroundColor = bg;
//       el.style.outline = outline;
//     });
//     appContainer.style.boxShadow = originalBoxShadow;
//     document.body.style.background = originalBackground;
//   }).catch(err => alert("Error while saving PDF: " + err.message));
// }

function downloadPDF() {
  const notice = document.getElementById("notice-template");
  if (!notice) return alert("Notice template not found.");

  // --- Prepare filename ---
  const title = document.getElementById("title").value.trim() || "College_Notice";
  const cleanName = title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).replace(/\s/g, "");
  const fileName = `${cleanName}_${today}.pdf`;

  // --- Force Light Mode Temporarily ---
  const previousTheme = document.body.getAttribute("data-theme");
  document.body.setAttribute("data-theme", "light");
  document.body.style.background = "#ffffff";

  // --- Hide interface elements ---
  const controls = notice.querySelectorAll('.delete-btn, .drag-btn, .sign-upload-input, .sign-upload-btn, .signatory-checkbox');
  controls.forEach(ctrl => (ctrl.style.display = "none"));

  // --- Remove outlines/borders for export ---
  const editableElements = notice.querySelectorAll('[contenteditable="true"]');
  const prevStyles = Array.from(editableElements).map(el => ({
    el,
    border: el.style.border,
    bg: el.style.backgroundColor,
    color: el.style.color,
    outline: el.style.outline
  }));
  editableElements.forEach(el => {
    el.style.border = "none";
    el.style.backgroundColor = "transparent";
    el.style.color = "#000";      // ensure black text
    el.style.outline = "none";
  });

  // --- PDF Export Options ---
  const opt = {
    margin: 0.4,
    filename: fileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"  // always white
    },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  html2pdf().set(opt).from(notice).save().then(() => {
    // --- Restore Original Styles ---
    controls.forEach(ctrl => (ctrl.style.display = ""));
    prevStyles.forEach(({ el, border, bg, color, outline }) => {
      el.style.border = border;
      el.style.backgroundColor = bg;
      el.style.color = color;
      el.style.outline = outline;
    });

    // Restore previous theme
    if (previousTheme) document.body.setAttribute("data-theme", previousTheme);
  }).catch(err => {
    alert("Error while saving PDF: " + err.message);
    if (previousTheme) document.body.setAttribute("data-theme", previousTheme);
  });
}


// --- 8. DOCX EXPORT (Word-compatible) ---
function downloadDOCX() {
  const notice = document.getElementById("notice-template");
  if (!notice) return alert("Notice not found.");

  const title = document.getElementById("title").value.trim() || "College_Notice";
  const cleanName = title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).replace(/\s/g, "");
  const fileName = `${cleanName}_${today}.docx`;

  // Clone notice for DOCX export
  const clonedNotice = notice.cloneNode(true);
  // Make sure header image is included
  const headerImg = clonedNotice.querySelector('.official-header img');
  if (headerImg) {
    headerImg.setAttribute('crossorigin', 'anonymous');
    headerImg.src = headerImg.src; // ensure same origin link
  }

  // Inline minimal Word styling
  const htmlContent = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:w="urn:schemas-microsoft-com:office:word"
        xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8">
    <title>${cleanName}</title>
    <style>
      body { font-family: 'Times New Roman', serif; margin: 1in; }
      .notice { border: none; box-shadow: none; }
      h3, p { margin: 0 0 8px 0; }
      .signature-name { font-weight: bold; margin-top: 10px; border-top: 1px solid #000; display:inline-block; }
      .signature-role { font-size: 0.9em; color: #333; }
      .official-header img { width:100%; height:auto; display:block; margin-bottom:10px; }
      ol { padding-left:20px; }
    </style>
  </head>
  <body>${clonedNotice.innerHTML}</body>
  </html>`;

  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- 9. EDIT MODE RETURN ---
function editNotice() {
  outputSection.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- 10. GLOBAL EXPORTS ---
window.generateNotice = generateNotice;
window.downloadPDF = downloadPDF;
window.downloadDOCX = downloadDOCX;
window.editNotice = editNotice;


// === 11. SIGNATORY MANAGEMENT AND CANVAS DRAWING ===

// --- LocalStorage helpers ---
const SIGNATORIES_KEY = "notice_signatories_ai";
function loadSignatories() {
  let data = localStorage.getItem(SIGNATORIES_KEY);
  if (!data) return [
    { name: "Principal (Essential for policy)", img: null },
    { name: "HOD, Computer Engineering Dept.", img: null },
    { name: "Exam Coordinator", img: null },
    { name: "Academic Coordinator", img: null }
  ];
  return JSON.parse(data);
}
function saveSignatories(list) {
  localStorage.setItem(SIGNATORIES_KEY, JSON.stringify(list));
}

// --- Render Select Dropdown + Card View ---
function renderSignatoriesSelect(list) {
  const select = document.getElementById('signatories');
  if (!select) return;
  select.innerHTML = "";
  list.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = s.name;
    opt.textContent = s.name;
    opt.dataset.idx = i;
    select.appendChild(opt);
  });

  // Also render unified card table if available
  if (typeof renderSignatoryTable === "function") renderSignatoryTable(list);
}

// --- Scrollable “Select Signatories” Card Table ---
function renderSignatoryTable(list, selectedArr = []) {
  const table = document.getElementById('signatory-table');
  if (!table) return;
  table.innerHTML = "";

  list.forEach((s, idx) => {
    const row = document.createElement('div');
    row.classList.add('signatory-row');

    // Checkbox
    const ch = document.createElement('input');
    ch.type = 'checkbox';
    ch.className = 'signatory-checkbox';
    ch.checked = selectedArr.includes(s.name);
    ch.onchange = () => {
      if (ch.checked) selectedArr.push(s.name);
      else selectedArr = selectedArr.filter(x => x !== s.name);
    };

    // Name
    const n = document.createElement('span');
    n.className = 'signatory-name';
    n.textContent = s.name;

    // Upload
    const label = document.createElement('label');
    label.className = 'sign-upload-label';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'sign-upload-input';
    fileInput.onchange = async () => {
      let file = fileInput.files[0];
      if (file) {
        let reader = new FileReader();
        reader.onload = ev => {
          s.img = ev.target.result;
          saveSignatories(list);
          renderSignatoryTable(list, selectedArr);
          renderSignatoriesSelect(list);
        };
        reader.readAsDataURL(file);
      }
    };
    const btnSpan = document.createElement('span');
    btnSpan.className = 'sign-upload-btn';
    btnSpan.textContent = s.img ? 'Change Signature' : 'Upload Signature';
    label.appendChild(fileInput);
    label.appendChild(btnSpan);

    // Preview
    const img = document.createElement('img');
    img.className = 'signatory-preview-img';
    img.src = s.img || '';
    img.style.display = s.img ? 'inline-block' : 'none';

    // Delete
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-signatory-btn';
    delBtn.innerHTML = '×';
    delBtn.title = "Delete signatory";
    delBtn.onclick = () => {
      list.splice(idx, 1);
      saveSignatories(list);
      renderSignatoryTable(list, selectedArr);
      renderSignatoriesSelect(list);
    };

    row.append(ch, n, label, img, delBtn);
    table.appendChild(row);
  });
}

// --- Add New Signatory ---
document.getElementById("add-signatory-btn")?.addEventListener("click", async () => {
  const name = document.getElementById("new-signatory-name").value.trim();
  if (!name) return alert("Enter signatory name");

  const fileInput = document.getElementById("new-signature-upload");
  let img = null;
  if (fileInput.files && fileInput.files.length > 0) {
    img = await toDataUrl(fileInput.files[0]);
  } else {
    // fallback: from drawing canvas
    const canvas = document.getElementById("signature-canvas");
    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() !== blank.toDataURL()) img = canvas.toDataURL();
  }

  const list = loadSignatories();
  const existing = list.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (existing) existing.img = img;
  else list.push({ name, img });
  saveSignatories(list);
  renderSignatoriesSelect(list);
  renderSignatoryTable(list);

  // reset inputs
  document.getElementById("new-signatory-name").value = "";
  document.getElementById("new-signature-upload").value = "";
  const ctx = document.getElementById("signature-canvas").getContext("2d");
  ctx.clearRect(0, 0, 300, 100);
});

// --- Helper: File → DataURL ---
function toDataUrl(file) {
  return new Promise(res => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.readAsDataURL(file);
  });
}

// --- Signature Canvas Logic ---
const canvas = document.getElementById("signature-canvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  let drawing = false;

  canvas.addEventListener("mousedown", e => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });
  canvas.addEventListener("mouseup", () => (drawing = false));
  canvas.addEventListener("mouseleave", () => (drawing = false));
  canvas.addEventListener("mousemove", e => {
    if (!drawing) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#222";
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });

  document.getElementById("clear-signature")?.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

// --- Initialize both UIs on load ---
window.addEventListener("DOMContentLoaded", () => {
  const list = loadSignatories();
  renderSignatoriesSelect(list);
  renderSignatoryTable(list);
});
