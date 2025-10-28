//  PROPERLY FORMATTED, COMMENTED AND STRUCTURED BY THE CREATORS OF EDUSYNC

// --- 1. CONFIGURATION DATA ---
const SIGNATORY_ROLES = {
    'Principal': 'Principal, VPPCOE and VA',
    'HOD': 'Dr. Rais A. Mulla, HOD, Computer Engineering Dept.', 
    'Academic_Coordinator': 'Prof. Atul Shintre, Academic Coordinator', 
    'Exam_Coordinator': 'Exam Coordinator, VPPCOE',
};

// --- 1A. LocalStorage Signatory Logic ---
const SIGNATORIES_KEY = "notice_signatories_ai";
function loadSignatories() {
    let data = localStorage.getItem(SIGNATORIES_KEY);
    if (!data) return [
        {name: "Principal (Essential for policy)", img: null},
        {name: "HOD, Computer Engineering Dept.", img: null},
        {name: "Exam Coordinator", img: null},
        {name: "Academic Coordinator", img: null}
    ];
    return JSON.parse(data);
}
function saveSignatories(list) {
    localStorage.setItem(SIGNATORIES_KEY, JSON.stringify(list));
}

// --- 2. DOM ELEMENT REFERENCES ---
const toggle = document.getElementById('templateToggle');
const label = document.getElementById('templateLabel');
const generateBtn = document.querySelector(".generate-btn");
const outputSection = document.getElementById("output-section");
const noticeSubjectHeader = document.getElementById("notice-subject-header");
const noticeTitle = document.getElementById("notice-title");
const noticeText = document.getElementById("notice-text");
const noticeRefNum = document.getElementById("notice-ref-num");
const noticeDate = document.getElementById("notice-date");
const signaturesArea = document.getElementById("signatures-area");

// --- 3. THEME/EVENTS ---
// Toggle between Circular and Notice label
toggle.addEventListener('change', () => {
    label.textContent = toggle.checked ? 'Circular' : 'Notice';
});

// Theme toggle dark/light mode
document.getElementById('theme-switch').addEventListener('change', function() {
    document.body.setAttribute('data-theme', this.checked ? 'dark' : 'light');
});

// --- 3A. RENDER SIGNATORY SELECT FROM LOCALSTORAGE ---
function renderSignatoriesSelect(list) {
    const select = document.getElementById('signatories');
    select.innerHTML = "";
    list.forEach((s, i) => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        opt.dataset.idx = i;
        select.appendChild(opt);
    });
    // UI: show preview and image upload for each signatory 
    let preview = document.getElementById("signatory-previews");
    if (!preview) {
        preview = document.createElement('div');
        preview.id = "signatory-previews";
        select.parentElement.appendChild(preview);
    }
    renderSignatoryPreviews(list, preview);
}

function renderSignatoryPreviews(list, preview) {
    preview.innerHTML = "";
    list.forEach((s, i) => {
        let wrap = document.createElement('div');
        wrap.style.display = "inline-block";
        wrap.style.margin = "2px 6px 2px 0";
        // Show name
        let name = document.createElement('span');
        name.textContent = s.name;
        name.style.fontSize = "0.97em";
        name.style.marginRight = "4px";
        wrap.appendChild(name);
        // Upload/Replace image input
        let up = document.createElement('input');
        up.type = "file";
        up.accept = "image/*";
        up.className = "sign-upload-btn";
        up.title = "Upload/replace signature for " + s.name;
        up.onchange = async () => {
            let file = up.files[0];
            if (file) {
                let url = await toDataUrl(file);
                s.img = url;
                saveSignatories(list);
                renderSignatoriesSelect(list);
            }
        };
        wrap.appendChild(up);
        // Preview image if exists
        if (s.img) {
            let img = document.createElement('img');
            img.className = "signatory-preview-img";
            img.src = s.img;
            img.title = s.name + " signature";
            wrap.appendChild(img);
        }
        preview.appendChild(wrap);
    });
}

// --- 3B. ADD NEW SIGNATORY (with upload/draw) ---
document.getElementById("add-signatory-btn").onclick = async function() {
    let name = document.getElementById("new-signatory-name").value.trim();
    if (!name) { 
        alert("Enter signatory name"); 
        return; 
    }
    let img = null;
    const fileInput = document.getElementById("new-signature-upload");
    if (fileInput.files && fileInput.files.length > 0) {
        img = await toDataUrl(fileInput.files[0]);
    } else {
        // Try canvas drawing capture
        let blank = document.createElement("canvas");
        blank.width = canvas.width; 
        blank.height = canvas.height;
        if (canvas.toDataURL() !== blank.toDataURL())
            img = canvas.toDataURL();
    }
    let list = loadSignatories();
    // Update existing or add new
    let ex = list.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (ex) ex.img = img;
    else list.push({name, img});
    saveSignatories(list);
    renderSignatoriesSelect(list);
    // Clear form inputs and canvas
    document.getElementById("new-signatory-name").value = "";
    document.getElementById("new-signature-upload").value = "";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

// --- Helper function to convert file to Data URL ---
function toDataUrl(file) {
    return new Promise(res => {
        let r = new FileReader();
        r.onload = e => res(e.target.result);
        r.readAsDataURL(file);
    });
}

// --- 4. CANVAS SETUP FOR SIGNATURE DRAWING ---
const canvas = document.getElementById('signature-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;

canvas.addEventListener("mousedown", () => { 
    drawing = true; 
    ctx.beginPath(); 
});
canvas.addEventListener("mouseup", () => { drawing = false; });
canvas.addEventListener("mouseout", () => { drawing = false; });
canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = "#222";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
});
document.getElementById('clear-signature').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// --- 5. EVENT LISTENER TOGGLE LABEL FOR NOTICE/CIRCULAR ---
toggle.addEventListener('change', () => {
    label.textContent = toggle.checked ? 'Circular' : 'Notice';
});

// --- 6. SIGNATURE PREVIEW AND SELECT INIT ON DOMContentLoaded ---
window.addEventListener("DOMContentLoaded", () => {
    renderSignatoriesSelect(loadSignatories());
});

// --- 7. CORE FUNCTION: GENERATE NOTICE ---
async function generateNotice() {
    const title = document.getElementById("title").value.trim();
    const summary = document.getElementById("summary").value.trim();
    const ref_number_input = document.getElementById("ref_number").value.trim();
    const department = document.getElementById("department").value;
    const signatoryElements = document.getElementById("signatories").selectedOptions;
    
    const selectedSignatories = Array.from(signatoryElements).map(option => option.value);
    const isCircular = toggle.checked;
    const type = isCircular ? "Circular" : "Notice";
    
    if (!title || !summary || selectedSignatories.length === 0) {
        alert("Please enter Title, Summary, and select at least one Signatory!");
        return;
    }
    
    const originalText = generateBtn.textContent;
    
    // Set Loading State
    generateBtn.textContent = "🧠 Generating...";
    generateBtn.disabled = true;
    outputSection.classList.add("hidden"); 

    try {
        const response = await fetch('http://localhost:3000/generate-notice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title, 
                summary, 
                sign: selectedSignatories.join(' and '), // send all signatories for tone
                type 
            }) 
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! Status: ${response.status}`;
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const generatedText = data.text; 

        // Set current date formatted for India
        const today = new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        // Reference number generation fallback
        const refNum = ref_number_input === "VPP/Trust-Office/2025-26/AUTO" 
                       ? generateRefNumber() : ref_number_input;

        // Populate UI
        noticeSubjectHeader.textContent = type.toUpperCase();
        noticeTitle.textContent = title;
        noticeRefNum.textContent = refNum;
        noticeDate.textContent = today;
        noticeText.innerHTML = generatedText.replace(/\n/g, '<br>'); 
        noticeText.focus(); 
        
        // Generate Signatures dynamically
        generateSignatures(selectedSignatories);

        // Show output and scroll smoothly
        outputSection.classList.remove("hidden");
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    } catch (error) {
        alert("Error generating document: " + error.message);
        console.error("Fetch/AI Error:", error);
    } finally {
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
    }
}

// --- 8. HELPER FUNCTION: DYNAMIC SIGNATURE GENERATION ---
function generateSignatures(signatories) {
    signaturesArea.innerHTML = '';
    if (signatories.length === 0) return;

    // Prioritize Principal to far right if present
    const orderedSignatories = signatories.sort((a, b) => {
        if (a === 'Principal') return 1;
        if (b === 'Principal') return -1;
        return 0;
    });

    // Layout class for single/multiple signatures
    if (orderedSignatories.length === 1) {
        signaturesArea.classList.add('single-signature');
    } else {
        signaturesArea.classList.remove('single-signature');
    }
     
    const signatureBlocks = [];

    orderedSignatories.forEach(key => {
        const fullRole = SIGNATORY_ROLES[key] || key;
        const parts = fullRole.split(',').map(s => s.trim());
        const namePart = parts[0];
        const rolePart = parts.slice(1).join(', ');
        
        // Special case: Principal uses full role as role text
        const finalName = namePart.includes('Principal') ? 'Principal' : namePart;
        const finalRole = namePart.includes('Principal') ? fullRole : rolePart;
        
        const signatureHTML = `
            <div class="signature-block" contenteditable="true" draggable="true" 
                 title="Click to edit or drag to reposition signatures">
                <p class="signature-name">${finalName.trim()}</p>
                <p class="signature-role">${finalRole.trim()}</p>
            </div>
        `;
        signatureBlocks.push(signatureHTML);
    });

    signaturesArea.innerHTML = signatureBlocks.join('');
    // Initialize drag and drop for signatures area
    initializeDragAndDrop(signaturesArea);
}

// --- 9. DRAG AND DROP INITIALIZATION (For moving components) ---
function initializeDragAndDrop(container) {
    let draggedItem = null;

    container.addEventListener('dragstart', (e) => {
        const target = e.target.closest('.signature-block, .official-header, .ref-date-row, .official-footer');
        if (target) {
            draggedItem = target;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', target.outerHTML);
            target.classList.add('dragging');
        }
    });

    container.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    });

    container.addEventListener('dragover', (e) => {
        e.preventDefault(); 
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedItem) {
            const dropTarget = e.target.closest('.signature-block, .official-header, .ref-date-row, .official-footer');
            if (dropTarget && dropTarget !== draggedItem) {
                const rect = dropTarget.getBoundingClientRect();
                const isSignatureBlock = dropTarget.classList.contains('signature-block');
                
                if (isSignatureBlock) {
                    // Horizontal signature block reordering based on mouse X
                    const insertBefore = e.clientX < rect.left + rect.width / 2;
                    if (insertBefore) {
                        container.insertBefore(draggedItem, dropTarget);
                    } else {
                        container.insertBefore(draggedItem, dropTarget.nextSibling);
                    }
                } else {
                    // Vertical major sections reordering
                    const elements = Array.from(document.querySelectorAll('#notice-template > div:not(.header-divider)'));
                    const draggedIndex = elements.indexOf(draggedItem);
                    const targetIndex = elements.indexOf(dropTarget);

                    if (draggedIndex !== -1 && targetIndex !== -1) {
                        if (draggedIndex < targetIndex) {
                            container.insertBefore(draggedItem, dropTarget.nextSibling);
                        } else {
                            container.insertBefore(draggedItem, dropTarget);
                        }
                    }
                }
            }
        }
    });
}

// --- 10. NOTICE TEMPLATE DRAG AND DROP ---
document.addEventListener('DOMContentLoaded', () => {
    const notice = document.getElementById('notice-template');
    const draggables = notice.querySelectorAll('[draggable="true"]');
    let dragged = null;

    draggables.forEach(block => {
        block.addEventListener('dragstart', (e) => {
            dragged = block;
            block.classList.add('dragging');
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData('text/plain', 'drag'); 
        });
        block.addEventListener('dragend', () => {
            dragged = null;
            block.classList.remove('dragging');
        });
        block.addEventListener('selectstart', (e) => {
            if (dragged) e.preventDefault();
        });
    });

    notice.addEventListener('dragover', (e) => {
        e.preventDefault();
        const sections = Array.from(notice.children).filter(
            el => el.hasAttribute('draggable')
        );
        const mouseY = e.clientY;
        let insertBefore = null;

        for (let sec of sections) {
            if (sec === dragged) continue;
            const box = sec.getBoundingClientRect();
            if (mouseY < box.top + box.height / 2) {
                insertBefore = sec;
                break;
            }
        }
        if (dragged) {
            if (insertBefore) {
                notice.insertBefore(dragged, insertBefore);
            } else {
                notice.appendChild(dragged);
            }
        }
    });

    // Initialize drag and drop for signatures area also on page load
    initializeDragAndDrop(signaturesArea);
});

// --- 11. REFERENCE NUMBER GENERATOR ---
function generateRefNumber() {
    let counter = parseInt(localStorage.getItem('noticeCounter')) || 207; 
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const yearString = `${currentYear % 100}-${nextYear % 100}`;
    const newRef = `VPP/Trust-Office/${yearString}/${counter}`;
    localStorage.setItem('noticeCounter', counter + 1);
    return newRef;
}

// --- 12. UTILITIES: DOWNLOAD PDF AND EDIT NOTICE ---
function downloadPDF() {
    const notice = document.getElementById("notice-template");
    const editableElements = notice.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(el => {
        el.style.border = 'none';
        el.style.backgroundColor = 'transparent';
        el.style.outline = 'none';
        el.classList.remove('dragging');
    });
    const opt = {
        margin: 0.5,
        filename: 'College_Notice.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(notice).save().then(() => {
        // Restore styles after save
        editableElements.forEach(el => {
            el.style.border = '';
            el.style.backgroundColor = '';
            el.style.outline = '';
        });
    });
}

function editNotice() {
    outputSection.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 13. CLICK EVENT FOR DELETE BUTTONS ---
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-btn')) {
        const parentBlock = e.target.closest('.signature-block, .official-header, .notice-body, .ref-date-row, .official-footer');
        if (parentBlock) {
            parentBlock.remove();
        }
    }
});


function renderSignatoryTable(list, selectedArr=[]) {
  const table = document.getElementById('signatory-table');
  table.innerHTML = '';
  list.forEach((s, idx) => {
    const row = document.createElement('div');
    row.classList.add('signatory-row');

    // Checkbox
    const ch = document.createElement('input');
    ch.type = 'checkbox';
    ch.className = 'signatory-checkbox';
    ch.checked = selectedArr.includes(s.name);
    ch.onchange = () => {
      if (ch.checked) { selectedArr.push(s.name); }
      else { selectedArr = selectedArr.filter(x => x!==s.name); }
    };

    // Name
    const n = document.createElement('span');
    n.className = 'signatory-name';
    n.textContent = s.name;

    // Upload signature
    const label = document.createElement('label');
    label.className = 'sign-upload-label';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'sign-upload-input';
    fileInput.onchange = async (e) => {
      let file = fileInput.files[0];
      if (file) {
        let reader = new FileReader();
        reader.onload = ev => {
          s.img = ev.target.result;
          saveSignatories(list);
          renderSignatoryTable(list, selectedArr);
        };
        reader.readAsDataURL(file);
      }
    };
    const btnSpan = document.createElement('span');
    btnSpan.className = 'sign-upload-btn';
    btnSpan.textContent = s.img ? 'Change Signature' : 'Upload Signature';
    label.appendChild(fileInput);
    label.appendChild(btnSpan);

    // Image preview
    const img = document.createElement('img');
    img.className = 'signatory-preview-img';
    img.src = s.img || '';
    img.style.display = s.img ? 'inline-block' : 'none';

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-signatory-btn';
    delBtn.innerHTML = '×';
    delBtn.title = "Delete this signatory";
    delBtn.onclick = () => {
      list.splice(idx, 1);
      saveSignatories(list);
      renderSignatoryTable(list, selectedArr);
    };

    row.appendChild(ch);
    row.appendChild(n);
    row.appendChild(label);
    row.appendChild(img);
    row.appendChild(delBtn);
    table.appendChild(row);
  });
}



// end 
//  PROPERLY FORMATTED, COMMENTED AND STRUCTURED BY THE CREATORS OF EDUSYNC
