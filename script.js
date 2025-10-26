
//  PROPERLY FORMATTED, COMMENTED AND STRUCTURED BY THE CREATORS OF EDUSYNC
// --- 1. CONFIGURATION DATA ---
const SIGNATORY_ROLES = {
    'Principal': 'Principal, VPPCOE and VA',
    'HOD': 'Dr. Rais A. Mulla, HOD, Computer Engineering Dept.', 
    'Academic_Coordinator': 'Prof. Atul Shintre, Academic Coordinator', 
    'Exam_Coordinator': 'Exam Coordinator, VPPCOE',
};

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


// --- 3. EVENT LISTENERS ---
toggle.addEventListener('change', () => {
    label.textContent = toggle.checked ? 'Circular' : 'Notice';
});

// Theme toggle
document.getElementById('theme-switch').addEventListener('change', function() {
  document.body.setAttribute('data-theme', this.checked ? 'dark' : 'light');
});


// Make all main notice sections draggable/reorderable
document.addEventListener('DOMContentLoaded', function() {
  const notice = document.getElementById('notice-template');
  const draggables = notice.querySelectorAll('[draggable="true"]');
  let dragged = null;

  draggables.forEach(block => {
    block.addEventListener('dragstart', (e) => {
      dragged = block;
      block.classList.add('dragging');
      // Fix drag image for better UX
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData('text/plain', 'drag'); 
    });
    block.addEventListener('dragend', () => {
      dragged = null;
      block.classList.remove('dragging');
    });
    // For accessibility/focus, prevent selection on drag
    block.addEventListener('selectstart', (e) => {
      if (dragged) e.preventDefault();
    });
  });

  // Attach dragover & drop on notice container
  notice.addEventListener('dragover', function(e) {
    e.preventDefault();
    // Get all drag-eligible notice direct children (skip, e.g., buttons)
    const sections = Array.from(notice.children).filter(
      el => el.hasAttribute('draggable')
    );
    const mouseY = e.clientY;
    let insertBefore = null;

    // Find where to insert (vertical drag, between elements)
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
});



function initializeNoticeDragAndDrop(container) {
    let draggedItem = null;

    container.querySelectorAll('[draggable="true"]').forEach(el => {
        el.addEventListener('dragstart', e => {
            draggedItem = el;
            el.classList.add('dragging');
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData('text/plain', 'drag');
        });
        el.addEventListener('dragend', () => {
            draggedItem = null;
            el.classList.remove('dragging');
        });
    });

    container.addEventListener('dragover', function(e) {
        e.preventDefault();
        // Find all draggable siblings in container
        const blocks = Array.from(container.children).filter(
            c => c.hasAttribute && c.hasAttribute('draggable')
        );
        // Calculate mouse position relative to block center
        let target = blocks.find(b =>
            b !== draggedItem &&
            b.getBoundingClientRect().top + b.offsetHeight / 2 > e.clientY
        );
        // Optionally highlight target
        blocks.forEach(b => b.classList.remove('drop-target'));
        if (target) target.classList.add('drop-target');
        else if (blocks.length > 0) blocks[blocks.length - 1].classList.add('drop-target');
    });

    container.addEventListener('drop', function(e) {
        e.preventDefault();
        // Remove previous highlights
        Array.from(container.children).forEach(b => b.classList.remove('drop-target'));
        const blocks = Array.from(container.children).filter(
            c => c.hasAttribute && c.hasAttribute('draggable')
        );
        let target = blocks.find(b =>
            b !== draggedItem &&
            b.getBoundingClientRect().top + b.offsetHeight / 2 > e.clientY
        );
        if (draggedItem) {
            if (target) container.insertBefore(draggedItem, target);
            else container.appendChild(draggedItem);
        }
        draggedItem = null;
    });
}

// When generating or showing notice, call:
const noticeContainer = document.getElementById('notice-template');
initializeNoticeDragAndDrop(noticeContainer);


// --- 4. CORE FUNCTION: GENERATE NOTICE ---
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
        // --- A. AI API Call to Backend ---
        const response = await fetch('http://localhost:3000/generate-notice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title, 
                summary, 
                sign: selectedSignatories.join(' and '), // Send all names to help AI tone
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

        // --- B. Populate Dynamic UI Elements ---
        
        // Date and Reference
        const today = new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
        const refNum = ref_number_input === "VPP/Trust-Office/2025-26/AUTO" 
                       ? generateRefNumber() : ref_number_input;
        
        // Subject
        noticeSubjectHeader.textContent = type.toUpperCase();
        noticeTitle.textContent = title;
        noticeRefNum.textContent = refNum;
        noticeDate.textContent = today;
        
        // AI Content
        noticeText.innerHTML = generatedText.replace(/\n/g, '<br>'); 
        noticeText.focus(); 
        
        // --- C. Generate Dynamic Signature Block ---
        generateSignatures(selectedSignatories);


        // Show the output and scroll down
        outputSection.classList.remove("hidden");
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    } catch (error) {
        alert("Error generating document: " + error.message);
        console.error("Fetch/AI Error:", error);
    } finally {
        // --- Reset Button State ---
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
    }
}

// --- 5. HELPER FUNCTION: DYNAMIC SIGNATURE GENERATION ---
function generateSignatures(signatories) {
    signaturesArea.innerHTML = '';
    
    if (signatories.length === 0) return;

    // Prioritize Principal to the far right if multiple exist
    const orderedSignatories = signatories.sort((a, b) => {
        if (a === 'Principal') return 1;
        if (b === 'Principal') return -1;
        return 0;
    });

    // Determine layout class
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
    
    // Initialize drag and drop functionality after generating signatures
    initializeDragAndDrop(signaturesArea);
}


// --- 6. NEW FUNCTION: DRAG AND DROP INITIALIZATION (For moving components) ---
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

    container.addEventListener('dragend', (e) => {
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
                // Determine insertion point based on mouse position
                const rect = dropTarget.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                // Simple check for vertical drop based on section order
                const isSignatureBlock = dropTarget.classList.contains('signature-block');
                
                if (isSignatureBlock) {
                    // Drop logic for signature blocks (horizontal movement)
                    const insertBefore = e.clientX < rect.left + rect.width / 2;
                    if (insertBefore) {
                        container.insertBefore(draggedItem, dropTarget);
                    } else {
                        container.insertBefore(draggedItem, dropTarget.nextSibling);
                    }
                } else {
                    // Drop logic for major sections (Header, Ref/Date, Footer - vertical movement)
                    const elements = Array.from(document.querySelectorAll('#notice-template > div:not(.header-divider)'));
                    const draggedIndex = elements.indexOf(draggedItem);
                    const targetIndex = elements.indexOf(dropTarget);

                    if (draggedIndex !== -1 && targetIndex !== -1) {
                        if (draggedIndex < targetIndex) {
                            // Move down
                            container.insertBefore(draggedItem, dropTarget.nextSibling);
                        } else {
                            // Move up
                            container.insertBefore(draggedItem, dropTarget);
                        }
                    }
                }
            }
        }
    });
}


// --- 7. HELPER FUNCTION: REFERENCE NUMBER SEQUENCER ---
function generateRefNumber() {
    let counter = parseInt(localStorage.getItem('noticeCounter')) || 207; 
    
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const yearString = `${currentYear % 100}-${nextYear % 100}`;
    
    const newRef = `VPP/Trust-Office/${yearString}/${counter}`;
    
    localStorage.setItem('noticeCounter', counter + 1);
    
    return newRef;
}

// --- 8. UTILITY FUNCTIONS (Download and Edit) ---
function downloadPDF() {
    const notice = document.getElementById("notice-template");
    
    // Temporarily disable editing/hover styles for clean PDF output
    const editableElements = notice.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(el => {
        el.style.border = 'none';
        el.style.backgroundColor = 'transparent';
        el.style.outline = 'none';
        el.classList.remove('dragging'); // Ensure no dragging visual remains
    });
    
    const opt = {
        margin: 0.5,
        filename: 'College_Notice.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate PDF and then restore styles
    html2pdf().set(opt).from(notice).save().then(() => {
        // Restore styles by re-running the generation step which applies the correct styles
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

// SIGN DRAW
const canvas = document.getElementById('signature-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;

canvas.addEventListener('mousedown', () => { drawing = true; ctx.beginPath(); });
canvas.addEventListener('mouseup', () => { drawing = false; });
canvas.addEventListener('mouseout', () => { drawing = false; });
canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
});

document.getElementById('clear-signature').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});


document.getElementById('add-signatory-btn').addEventListener('click', () => {
  const name = document.getElementById('new-signatory-name').value.trim();
  if (!name) {
    alert('Enter signatory name');
    return;
  }

  // Get image either from file input or canvas
  const fileInput = document.getElementById('new-signature-upload');
  const signaturesArea = document.getElementById('signatures-area');

  if (fileInput.files.length > 0) {
    // Use uploaded file
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
      addSignature(name, event.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    // Use canvas drawing
    const dataURL = canvas.toDataURL();
    if (isCanvasBlank(canvas)) {
      alert('Please upload or draw signature.');
      return;
    }
    addSignature(name, dataURL);
  }
});

// Helper: check canvas blank
function isCanvasBlank(c) {
  const blank = document.createElement('canvas');
  blank.width = c.width;
  blank.height = c.height;
  return c.toDataURL() === blank.toDataURL();
}


// Adds a new signature block dynamically to signatures area
function addSignature(name, imgDataUrl) {
  const container = document.createElement('div');
  container.className = 'signature-block resizable draggable';
  container.setAttribute('draggable', 'true');
  container.setAttribute('contenteditable', 'false');
  container.style.position = 'relative';

  const img = document.createElement('img');
  img.src = imgDataUrl;
  img.alt = `${name}'s signature`;
  img.style.maxWidth = '120px';
  img.style.height = 'auto';
  img.style.display = 'block';
  img.style.margin = '0 auto';

  const nameEl = document.createElement('div');
  nameEl.className = 'signature-name';
  nameEl.textContent = name;

  container.appendChild(img);
  container.appendChild(nameEl);

  const signaturesArea = document.getElementById('signatures-area');
  signaturesArea.appendChild(container);

  // Clear inputs for next signature
  document.getElementById('new-signatory-name').value = '';
  document.getElementById('new-signature-upload').value = '';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Reinitialize drag and resize if needed
  initializeNoticeDragAndDrop(document.getElementById('notice-template'));
}
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('delete-btn')) {
    const parentBlock = e.target.closest('.signature-block, .official-header, .notice-body, .ref-date-row, .official-footer');
    if (parentBlock) {
      parentBlock.remove();
    }
  }
});



//  PROPERLY FORMATTED, COMMENTED AND STRUCTURED BY THE CREATORS OF EDUSYNC