// ─── Form Selection & Variables ──────────────────────────────────────────
let currentFormType = 'A';
let isScaleFitEnabled = false; // Enabled by default for mobile viewports

// ─── Smart Input Formatters ───────────────────────────────────────────────

/**
 * Formats a raw digit string as Aadhar: XXXX XXXX XXXX
 * Strips all non-digits, inserts spaces every 4 digits, caps at 12 digits.
 */
function formatAadhar(raw) {
    const digits = raw.replace(/\D/g, '').substring(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Formats a raw digit string as Indian mobile: XXXXX XXXXX
 * Strips non-digits, inserts space after 5th digit, caps at 10 digits.
 */
function formatMobile(raw) {
    const digits = raw.replace(/\D/g, '').substring(0, 10);
    if (digits.length > 5) {
        return digits.slice(0, 5) + ' ' + digits.slice(5);
    }
    return digits;
}

/**
 * Attaches a formatter to an input that runs on every keystroke.
 * Preserves caret position so typing feels natural.
 */
function attachFormatter(id, formatterFn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
        const pos = el.selectionStart;
        const before = el.value;
        const formatted = formatterFn(before);
        if (formatted !== before) {
            el.value = formatted;
            // Restore caret — nudge forward if a space was just inserted
            const diff = formatted.length - before.length;
            el.setSelectionRange(pos + diff, pos + diff);
        }
    });
}

// ─── Initialize the page on startup ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    // Set present date dynamically in DD-MM-YYYY format
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const currentDateStr = `${dd}-${mm}-${yyyy}`;

    const initialDateA = document.getElementById('camp-date');
    const initialDateB = document.getElementById('b-camp-date');
    if (initialDateA) initialDateA.value = currentDateStr;
    if (initialDateB) initialDateB.value = currentDateStr;

    updateFooter();

    // Link header values to dynamic footer info
    const campLocationInput = document.getElementById('camp-location');
    const campDateInput = document.getElementById('camp-date');

    campLocationInput.addEventListener('input', updateFooter);
    campDateInput.addEventListener('input', updateFooter);

    const bCampLocationInput = document.getElementById('b-camp-location');
    const bCampDateInput = document.getElementById('b-camp-date');

    if (bCampLocationInput) bCampLocationInput.addEventListener('input', updateFooter);
    if (bCampDateInput) bCampDateInput.addEventListener('input', updateFooter);

    // Sync dates and operator names across forms
    const dateInputA = document.getElementById('camp-date');
    const dateInputB = document.getElementById('b-camp-date');
    if (dateInputA && dateInputB) {
        dateInputA.addEventListener('input', () => {
            dateInputB.value = dateInputA.value;
            adjustInputWidth(dateInputB);
            updateFooter();
        });
        dateInputB.addEventListener('input', () => {
            dateInputA.value = dateInputB.value;
            adjustInputWidth(dateInputA);
            updateFooter();
        });
    }

    const operatorInputA = document.getElementById('camp-operator');
    const operatorInputB = document.getElementById('b-camp-operator');
    if (operatorInputA && operatorInputB) {
        operatorInputA.addEventListener('input', () => {
            operatorInputB.value = operatorInputA.value;
            adjustInputWidth(operatorInputB);
        });
        operatorInputB.addEventListener('input', () => {
            operatorInputA.value = operatorInputB.value;
            adjustInputWidth(operatorInputA);
        });
    }

    // ── Form A: Aadhar: XXXX XXXX XXXX ──────────────────────────────────────────
    attachFormatter('aadhar-no', formatAadhar);

    // ── Form A: Mobile: XXXXX XXXXX ──────────────────────────────────────────────
    attachFormatter('mobile-no', formatMobile);

    // ── Form A EPIC No.: uppercase alphanumeric only ────────────────────────────
    const epicInput = document.getElementById('epic-no');
    if (epicInput) {
        epicInput.addEventListener('input', () => {
            const clean = epicInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (clean !== epicInput.value) epicInput.value = clean;
        });
    }

    // ── Form A AC / PS / SL: digits only ────────────────────────────────────────
    ['ac-no', 'ps-no', 'sl-no'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => {
            const clean = el.value.replace(/\D/g, '');
            if (clean !== el.value) el.value = clean;
        });
    });

    // ── Form A DOB: auto-insert dashes → DD-MM-YYYY ────────────────────────────
    const dobInput = document.getElementById('dob');
    if (dobInput) {
        dobInput.addEventListener('input', (e) => {
            let val = dobInput.value.replace(/[\/.]/g, '-');
            val = val.replace(/[^0-9-]/g, '');
            val = val.replace(/-{2,}/g, '-');

            if (e.inputType !== 'deleteContentBackward') {
                if (/^\d{2}$/.test(val)) {
                    val += '-';
                } else if (/^\d{2}-\d{2}$/.test(val)) {
                    val += '-';
                }
            }

            if (val.length > 10) val = val.substring(0, 10);
            dobInput.value = val;

            // Trigger category recalculation instantly
            updateCategoryFromDOB();
        });
    }

    // ── Form B: Setup formatting and validation listeners ───────────────────
    document.querySelectorAll('.b-common-epic, .b-father-epic, .b-mother-epic, #b-epic-2002-1').forEach(input => {
        input.addEventListener('input', () => {
            const clean = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (clean !== input.value) {
                input.value = clean;
                // Dispatch event to make sure syncing triggers
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });

    document.querySelectorAll('.b-common-serial, .b-father-serial, .b-mother-serial, #b-serial-2002-1').forEach(input => {
        input.addEventListener('input', () => {
            const clean = input.value.replace(/\D/g, '');
            if (clean !== input.value) {
                input.value = clean;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });

    // ── Form B DOB: auto-insert dashes → DD-MM-YYYY ────────────────────────────
    const bDobInput = document.getElementById('b-dob');
    if (bDobInput) {
        bDobInput.addEventListener('input', (e) => {
            let val = bDobInput.value.replace(/[\/.]/g, '-');
            val = val.replace(/[^0-9-]/g, '');
            val = val.replace(/-{2,}/g, '-');

            if (e.inputType !== 'deleteContentBackward') {
                if (/^\d{2}$/.test(val)) {
                    val += '-';
                } else if (/^\d{2}-\d{2}$/.test(val)) {
                    val += '-';
                }
            }

            if (val.length > 10) val = val.substring(0, 10);
            bDobInput.value = val;

            // Trigger column update
            updateFormBActiveColumnFromDOB();
        });
    }

    // ── Set up Class-Based Syncing for Form B columns ────────────────────
    const syncClasses = [
        'b-common-elector', 'b-common-epic', 'b-common-district', 
        'b-common-ac', 'b-common-part', 'b-common-serial',
        'b-father-name', 'b-father-epic', 'b-father-district', 'b-father-ac', 'b-father-part', 'b-father-serial', 'b-father-house',
        'b-mother-name', 'b-mother-epic', 'b-mother-district', 'b-mother-ac', 'b-mother-part', 'b-mother-serial', 'b-mother-house'
    ];

    syncClasses.forEach(cls => {
        document.querySelectorAll('.' + cls).forEach(input => {
            input.addEventListener('input', (e) => {
                const val = e.target.value;
                document.querySelectorAll('.' + cls).forEach(other => {
                    if (other !== e.target && other.value !== val) {
                        other.value = val;
                    }
                });
            });
        });
    });

    // ── Auto-resize header inputs to match their content ─────────────────
    const autoResizeInputs = [
        'camp-title', 'camp-location', 'camp-date', 'camp-operator', 'category-box', 'dob',
        'b-camp-title', 'b-camp-society', 'b-camp-location', 'b-camp-date', 'b-camp-operator', 'b-dob'
    ];
    autoResizeInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            adjustInputWidth(el);
            el.addEventListener('input', () => adjustInputWidth(el));
        }
    });

    // Set up Column focus triggers (makes typing in columns highlight them if DOB is empty)
    for (let i = 1; i <= 3; i++) {
        const col = document.getElementById(`col-${i}`);
        if (col) {
            col.querySelectorAll('input').forEach(input => {
                input.addEventListener('focus', () => {
                    const dobVal = document.getElementById('b-dob').value.trim();
                    if (!dobVal) {
                        setActiveColumnB(i);
                    }
                });
            });
        }
    }

    // ── Normalize date format on blur ────────────────────────────────────
    const dateInputs = ['camp-date', 'dob', 'b-camp-date', 'b-dob'];
    dateInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('blur', () => {
                const formatted = normalizeDateFormat(el.value);
                if (formatted && formatted !== el.value) {
                    el.value = formatted;
                    el.dispatchEvent(new Event('input'));
                    if (id === 'b-dob') updateFormBActiveColumnFromDOB();
                    if (id === 'dob') updateCategoryFromDOB();
                }
            });
        }
    });

    // Initialize scale fit button visual state
    const scaleBtn = document.getElementById('btn-scale-fit');
    if (scaleBtn) {
        if (isScaleFitEnabled) {
            scaleBtn.className = "px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 bg-indigo-900/40 border-indigo-700 text-indigo-300 hover:bg-indigo-900/60 shadow";
        } else {
            scaleBtn.className = "px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white";
        }
    }

    // Initial scale check and bind resize listener
    updateScale();
    window.addEventListener('resize', updateScale);
    window.addEventListener('beforeprint', updateFooter);
});

// Function to dynamically adjust input width based on text content length
function adjustInputWidth(input) {
    if (!input) return;
    const autoResizeIds = [
        'camp-title', 'camp-location', 'camp-date', 'camp-operator', 'category-box', 'dob',
        'b-camp-title', 'b-camp-society', 'b-camp-location', 'b-camp-date', 'b-camp-operator', 'b-dob'
    ];
    if (!autoResizeIds.includes(input.id)) return;

    const text = input.value || input.placeholder || '';
    
    // Create temporary span to measure the text width
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'pre';
    
    // Copy key styling that affects text measurement
    const style = window.getComputedStyle(input);
    tempSpan.style.fontFamily = style.fontFamily;
    tempSpan.style.fontSize = style.fontSize;
    tempSpan.style.fontWeight = style.fontWeight;
    tempSpan.style.letterSpacing = style.letterSpacing;
    tempSpan.style.textTransform = style.textTransform;
    
    tempSpan.textContent = text;
    document.body.appendChild(tempSpan);
    
    // Calculate width + computed horizontal padding + safety buffer
    const textWidth = tempSpan.getBoundingClientRect().width;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const borderRight = parseFloat(style.borderRightWidth) || 0;
    
    const totalWidth = textWidth + paddingLeft + paddingRight + borderLeft + borderRight + 12;

    // Cap at document card width so content never bleeds outside the page card
    const docContainer = input.closest('.doc-container');
    const maxAllowedWidth = (docContainer && docContainer.clientWidth > 0)
        ? docContainer.clientWidth - 60
        : 800;
    const finalWidth = Math.min(Math.max(totalWidth, 24), maxAllowedWidth);
    input.style.width = finalWidth + 'px';
    
    document.body.removeChild(tempSpan);
}

function getCurrentTime12Hr() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
}

function updateFooter() {
    const timeStr = getCurrentTime12Hr();

    // Form A
    const locA = document.getElementById('camp-location').value;
    const dateA = document.getElementById('camp-date').value;
    const fLeftA = document.getElementById('footer-left');
    const fRightA = document.getElementById('footer-right');
    if (fLeftA) fLeftA.innerText = `SIR 2026 Camp - ${locA}`;
    if (fRightA) {
        fRightA.innerText = `Printed: ${dateA ? dateA + ' - ' : ''}${timeStr}`;
    }

    // Form B
    const locB = document.getElementById('b-camp-location').value;
    const dateB = document.getElementById('b-camp-date').value;
    const fLeftB = document.getElementById('b-footer-left');
    const fRightB = document.getElementById('b-footer-right');
    if (fLeftB) fLeftB.innerText = `${locB}`;
    if (fRightB) {
        fRightB.innerText = `Printed: ${dateB ? dateB + ' - ' : ''}${timeStr}`;
    }
}

// Helper to extract year from various date string formats robustly
function extractYear(dobString) {
    if (!dobString) return null;
    
    const parts = dobString.split(/[-./]/);
    if (parts.length === 3) {
        const yearPart = parts[2].trim();
        // If year is 4 digits
        if (/^\d{4}$/.test(yearPart)) {
            return parseInt(yearPart, 10);
        }
        // If year is 2 digits
        if (/^\d{2}$/.test(yearPart)) {
            const yr = parseInt(yearPart, 10);
            return yr >= 50 ? 1900 + yr : 2000 + yr;
        }
    }
    
    // Fallback: matches any 4 digit number that starts with 19 or 20
    const match = dobString.match(/\b(19\d\d|20\d\d)\b/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

// Helper to dynamically normalize and zero-pad date entries to dd-mm-yyyy format
function normalizeDateFormat(dateString) {
    if (!dateString) return '';
    // Replace slashes or dots with dashes
    let cleaned = dateString.replace(/[\/.]/g, '-').trim();
    
    const parts = cleaned.split('-');
    if (parts.length === 3) {
        let day = parts[0].trim();
        let month = parts[1].trim();
        let year = parts[2].trim();
        
        // Zero-pad day and month if they are numeric
        if (/^\d{1,2}$/.test(day)) {
            day = day.padStart(2, '0');
        }
        if (/^\d{1,2}$/.test(month)) {
            month = month.padStart(2, '0');
        }
        // Ensure year is 4-digits
        if (/^\d{2}$/.test(year)) {
            const yr = parseInt(year, 10);
            year = (yr >= 50 ? '19' : '20') + year;
        }
        
        return `${day}-${month}-${year}`;
    }
    return cleaned;
}

// Determine category based on year of birth for Form A
function updateCategoryFromDOB() {
    const dobValue = document.getElementById('dob').value.trim();
    const categoryBox = document.getElementById('category-box');
    if (!categoryBox) return;

    if (!dobValue) {
        categoryBox.value = '';
        adjustInputWidth(categoryBox);
        return;
    }

    const year = extractYear(dobValue);
    if (!year) {
        // Stay empty while typing instead of showing "Invalid Date Format"
        categoryBox.value = '';
        adjustInputWidth(categoryBox);
        return;
    }

    if (year < 1985) {
        categoryBox.value = 'Category A – Born Before "1985"';
    } else if (year >= 1985 && year <= 2004) {
        categoryBox.value = 'Category B – Born Between "1985 - 2004"';
    } else if (year > 2004) {
        categoryBox.value = 'Category C – Born After "2004"';
    }
    
    adjustInputWidth(categoryBox);
}

// ─── Form Type B Column Control & DOB Highlights ──────────────────────

/**
 * Returns active column index in Form B based on DOB:
 * 1 -> Born before 01-07-1987
 * 2 -> Born from 01-07-1987 to 02-12-2004
 * 3 -> Born after 02-12-2004
 * 0 -> No DOB entered / All columns active
 */
function getActiveColumnB() {
    const dobValue = document.getElementById('b-dob').value.trim();
    if (!dobValue) return 0;
    
    const normalized = normalizeDateFormat(dobValue);
    if (!normalized || normalized.split('-').length !== 3) return 0;
    
    const parts = normalized.split('-');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const dobDate = new Date(year, month, day);
    
    if (isNaN(dobDate.getTime())) return 0;
    
    const limit1 = new Date(1987, 6, 1);     // 01-07-1987 (July is 6)
    const limit2 = new Date(2004, 11, 2);    // 02-12-2004 (December is 11)
    
    if (dobDate < limit1) {
        return 1;
    } else if (dobDate >= limit1 && dobDate <= limit2) {
        return 2;
    } else {
        return 3;
    }
}

function updateFormBActiveColumnFromDOB() {
    const idx = getActiveColumnB();
    setActiveColumnB(idx);
}

function setActiveColumnB(activeIndex) {
    const cardB = document.getElementById('form-card-b');
    const controls = document.getElementById('controls-panel');
    let pageStyle = document.getElementById('page-print-style');
    if (!pageStyle) {
        pageStyle = document.createElement('style');
        pageStyle.id = 'page-print-style';
        document.head.appendChild(pageStyle);
    }

    for (let i = 1; i <= 3; i++) {
        const col = document.getElementById(`col-${i}`);
        if (!col) continue;

        if (activeIndex === 0) {
            // No DOB — restore default 3-column wide layout
            col.className = "column-card default-col transition-all duration-500";
            col.querySelectorAll('input').forEach(input => {
                input.removeAttribute('disabled');
            });
        } else if (i === activeIndex) {
            col.className = "column-card active-col expanded transition-all duration-500";
            col.querySelectorAll('input').forEach(input => {
                input.removeAttribute('disabled');
            });
        } else {
            col.className = "column-card inactive-col collapsed transition-all duration-500";
            col.querySelectorAll('input').forEach(input => {
                input.setAttribute('disabled', 'true');
            });
        }
    }

    const wrapper = document.getElementById('columns-wrapper');
    if (wrapper) {
        if (activeIndex > 0) {
            wrapper.classList.add('single-active');
            if (cardB) cardB.classList.add('single-col-mode');
        } else {
            wrapper.classList.remove('single-active');
            if (cardB) cardB.classList.remove('single-col-mode');
        }
    }

    // Update print margins based on whether a column is active
    if (activeIndex > 0) {
        pageStyle.innerHTML = '@media print { @page { margin: 10mm; } }';
    } else {
        pageStyle.innerHTML = '@media print { @page { margin: 6mm; } }';
    }
    updateScale();
}

// ─── Form Selection & Synchronizations ───────────────────────────────

function setFormType(type) {
    currentFormType = type;
    const btnA = document.getElementById('btn-type-a');
    const btnB = document.getElementById('btn-type-b');
    const cardA = document.getElementById('form-card-a');
    const cardB = document.getElementById('form-card-b');
    const controls = document.getElementById('controls-panel');
    const hint = document.getElementById('swipe-hint');
    const hintText = document.getElementById('swipe-text');
    
    if (type === 'B') {
        // Sync data state from A to B
        syncState('A');
        
        // Toggle visibility
        cardA.classList.add('hidden');
        cardB.classList.remove('hidden');
        
        // Toggle active buttons
        btnA.className = "px-3.5 py-1.5 text-xs font-bold rounded-md transition-all text-slate-400 hover:text-white";
        btnB.className = "px-3.5 py-1.5 text-xs font-bold rounded-md transition-all bg-indigo-600 text-white shadow";
        
        // Switch styling classes on body for scaling and page rules
        document.body.classList.remove('type-a-active');
        document.body.classList.add('type-b-active');
        // Note: controls width and print orientation are handled by setActiveColumnB() below
        
        // Show hint helper with specific text for Form B
        if (hintText) hintText.innerText = "Swipe horizontally to view/edit the full 3-column printable sheet";
        
        // Recalculate columns active states (also resizes controls and sets print orientation)
        updateFormBActiveColumnFromDOB();
    } else {
        // Sync data state from B to A
        syncState('B');
        
        // Toggle visibility
        cardB.classList.add('hidden');
        cardA.classList.remove('hidden');
        
        // Toggle active buttons
        btnB.className = "px-3.5 py-1.5 text-xs font-bold rounded-md transition-all text-slate-400 hover:text-white";
        btnA.className = "px-3.5 py-1.5 text-xs font-bold rounded-md transition-all bg-indigo-600 text-white shadow";
        
        // Restore body container sizes and classes for portrait printing
        document.body.classList.remove('type-b-active');
        document.body.classList.add('type-a-active');
        // Controls panel stays at max-w-[850px] — same width for both forms
        
        // Print margins stylesheet injection
        let pageStyle = document.getElementById('page-print-style');
        if (!pageStyle) {
            pageStyle = document.createElement('style');
            pageStyle.id = 'page-print-style';
            document.head.appendChild(pageStyle);
        }
        pageStyle.innerHTML = '@media print { @page { margin: 10mm; } }';
        
        if (hintText) hintText.innerText = "Swipe horizontally to view/edit the full printable slip";

        // Recalculate Form A category box
        updateCategoryFromDOB();
    }
    
    // Adjust all text input widths
    const autoResizeInputs = [
        'camp-title', 'camp-location', 'camp-date', 'camp-operator', 'category-box', 'dob',
        'b-camp-title', 'b-camp-society', 'b-camp-location', 'b-camp-date', 'b-camp-operator', 'b-dob'
    ];
    autoResizeInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) adjustInputWidth(el);
    });
    updateScale();
}

function setCommonB(selector, value) {
    document.querySelectorAll(selector).forEach(input => {
        input.value = value;
    });
}

function syncState(sourceForm) {
    if (sourceForm === 'A') {
        // Sync from Form A to Form B
        setCommonB('.b-common-elector', document.getElementById('elector-name').value);
        setCommonB('.b-common-epic', document.getElementById('epic-no').value);
        setCommonB('.b-common-ac', document.getElementById('ac-no-current').value);
        setCommonB('.b-common-part', document.getElementById('ps-no-current').value);
        
        const dobVal = document.getElementById('dob').value;
        document.getElementById('b-dob').value = dobVal;
        
        // 2002 details (Column 1 details)
        document.getElementById('b-ac-2002-1').value = document.getElementById('ac-no').value;
        document.getElementById('b-part-2002-1').value = document.getElementById('ps-no').value;
        document.getElementById('b-serial-2002-1').value = document.getElementById('sl-no').value;
        document.getElementById('b-house-2002-1').value = document.getElementById('address').value;
        
        // Parents mapping details
        const mappingDone = document.getElementById('mapping-done').value.toLowerCase();
        const relationName = document.getElementById('relation-name').value;
        if (mappingDone.includes('father')) {
            setCommonB('.b-father-name', relationName);
            setCommonB('.b-father-ac', document.getElementById('ac-no').value);
            setCommonB('.b-father-part', document.getElementById('ps-no').value);
            setCommonB('.b-father-serial', document.getElementById('sl-no').value);
            setCommonB('.b-father-house', document.getElementById('address').value);
        } else if (mappingDone.includes('mother')) {
            setCommonB('.b-mother-name', relationName);
            setCommonB('.b-mother-ac', document.getElementById('ac-no').value);
            setCommonB('.b-mother-part', document.getElementById('ps-no').value);
            setCommonB('.b-mother-serial', document.getElementById('sl-no').value);
            setCommonB('.b-mother-house', document.getElementById('address').value);
        }
    } else {
        // Sync from Form B to Form A
        const activeCol = getActiveColumnB();
        const colIdx = activeCol > 0 ? activeCol : 1;
        
        document.getElementById('elector-name').value = document.getElementById(`b-elector-name-${colIdx}`).value;
        document.getElementById('epic-no').value = document.getElementById(`b-epic-2026-${colIdx}`).value;
        document.getElementById('ac-no-current').value = document.getElementById(`b-ac-name-${colIdx}`).value;
        document.getElementById('ps-no-current').value = document.getElementById(`b-part-name-${colIdx}`).value;
        
        const dobVal = document.getElementById('b-dob').value;
        document.getElementById('dob').value = dobVal;
        
        if (colIdx === 1) {
            document.getElementById('ac-no').value = document.getElementById('b-ac-2002-1').value;
            document.getElementById('ps-no').value = document.getElementById('b-part-2002-1').value;
            document.getElementById('sl-no').value = document.getElementById('b-serial-2002-1').value;
            document.getElementById('address').value = document.getElementById('b-house-2002-1').value;
            
            // Only set mapping-done to 'Self' and sync relation-name if Category 1 is active or 2002 details are present
            const has2002Details = document.getElementById('b-epic-2002-1').value.trim() ||
                                   document.getElementById('b-ac-2002-1').value.trim() ||
                                   document.getElementById('b-part-2002-1').value.trim() ||
                                   document.getElementById('b-serial-2002-1').value.trim() ||
                                   document.getElementById('b-house-2002-1').value.trim();
            if (activeCol === 1 || has2002Details) {
                document.getElementById('mapping-done').value = 'Self';
                document.getElementById('relation-name').value = document.getElementById(`b-elector-name-1`).value;
            }
        } else {
            const fatherName = document.querySelector('.b-father-name').value;
            const motherName = document.querySelector('.b-mother-name').value;
            if (fatherName) {
                document.getElementById('mapping-done').value = 'Father';
                document.getElementById('relation-name').value = fatherName;
                document.getElementById('ac-no').value = document.querySelector('.b-father-ac').value;
                document.getElementById('ps-no').value = document.querySelector('.b-father-part').value;
                document.getElementById('sl-no').value = document.querySelector('.b-father-serial').value;
                document.getElementById('address').value = document.querySelector('.b-father-house').value;
            } else if (motherName) {
                document.getElementById('mapping-done').value = 'Mother';
                document.getElementById('relation-name').value = motherName;
                document.getElementById('ac-no').value = document.querySelector('.b-mother-ac').value;
                document.getElementById('ps-no').value = document.querySelector('.b-mother-part').value;
                document.getElementById('sl-no').value = document.querySelector('.b-mother-serial').value;
                document.getElementById('address').value = document.querySelector('.b-mother-house').value;
            }
        }
    }
    updateFooter();
}

// Wipe all inputs clean
function clearForm() {
    if (currentFormType === 'A') {
        const inputs = document.querySelectorAll('#form-card-a input');
        inputs.forEach(input => {
            if (input.id !== 'camp-title' && input.id !== 'camp-location' && input.id !== 'camp-date' && input.id !== 'camp-operator') {
                input.value = '';
            }
        });
        const categoryBox = document.getElementById('category-box');
        if (categoryBox) {
            categoryBox.value = '';
            adjustInputWidth(categoryBox);
        }
        showToast('Form A fields cleared!', '🗑', 'text-red-400');
    } else {
        const inputs = document.querySelectorAll('#form-card-b input');
        inputs.forEach(input => {
            if (input.id !== 'b-camp-title' && input.id !== 'b-camp-society' && input.id !== 'b-camp-location' && input.id !== 'b-camp-date' && input.id !== 'b-camp-operator') {
                input.value = '';
            }
        });
        setActiveColumnB(0);
        showToast('Form B fields cleared!', '🗑', 'text-red-400');
    }
    
    // Recalculate auto-resized input widths after clearing
    const autoResizeInputs = [
        'camp-title', 'camp-location', 'camp-date', 'camp-operator', 'category-box', 'dob',
        'b-camp-title', 'b-camp-society', 'b-camp-location', 'b-camp-date', 'b-camp-operator', 'b-dob'
    ];
    autoResizeInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) adjustInputWidth(el);
    });
}

// Save Form as a high-quality PNG
function exportToImage() {
    // Unfocus active inputs to prevent highlight in screenshot
    if (document.activeElement) {
        document.activeElement.blur();
    }

    // Refresh footer to capture the exact current time in the export
    updateFooter();

    const activeFormCard = document.getElementById('form-card-b').classList.contains('hidden')
        ? document.getElementById('form-card-a')
        : document.getElementById('form-card-b');

    if (!activeFormCard) return;

    // 1. Create a clone of the form card
    const clone = activeFormCard.cloneNode(true);
    
    // 2. Set styles to ensure it renders at full size off-screen and is unconstrained by mobile viewport
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    
    const isTypeB = activeFormCard.id === 'form-card-b';
    const cardWidth = '850px'; // Both Form A and Form B use 850px width
    clone.style.width = cardWidth;
    clone.style.minWidth = cardWidth;
    clone.style.transform = 'none';
    clone.style.zoom = '1';
    
    // 3. Append clone to body
    document.body.appendChild(clone);

    // 3.5. If it's Type B, prepare the columns for standard side-by-side export layout
    if (isTypeB) {
        const activeColIdx = getActiveColumnB();
        
        // Remove single-active and single-col-mode from the clone to prevent squished columns in image exports
        const cloneWrapper = clone.querySelector('#columns-wrapper');
        if (cloneWrapper) {
            cloneWrapper.classList.remove('single-active');
        }
        clone.classList.remove('single-col-mode');
        
        // Temporarily restore columns layout in the clone for export
        for (let i = 1; i <= 3; i++) {
            const colElement = clone.querySelector(`#col-${i}`);
            if (colElement) {
                colElement.className = "column-card default-col";
                
                // Clear inactive column inputs in the clone
                if (activeColIdx > 0 && i !== activeColIdx) {
                    colElement.querySelectorAll('input').forEach(input => {
                        input.value = '';
                    });
                }
            }
        }
    }

    // 4. Convert all inputs in the clone to standard span elements
    const originalInputs = activeFormCard.querySelectorAll('input');
    const clonedInputs = clone.querySelectorAll('input');
    originalInputs.forEach((originalInput, index) => {
        const clonedInput = clonedInputs[index];
        if (clonedInput) {
            const textSpan = document.createElement('span');
            
            // Copy classes and inline styles (including width, colors, layout)
            textSpan.className = clonedInput.className;
            textSpan.style.cssText = clonedInput.style.cssText;
            
            // Maintain block vs inline layout perfectly to prevent wrapping or squishing
            const hasInlineWidth = originalInput.style.width;
            if (hasInlineWidth) {
                if (originalInput.classList.contains('block')) {
                    textSpan.style.display = 'block';
                } else {
                    textSpan.style.display = 'inline-block';
                }
            } else {
                textSpan.style.display = 'block';
                textSpan.style.width = '100%';
            }
            
            // Copy value, or use placeholder in a lighter font weight/color if empty
            const val = clonedInput.value.trim();
            if (val) {
                textSpan.textContent = val;
            } else {
                textSpan.textContent = originalInput.placeholder || '';
                textSpan.style.color = '#94a3b8'; // Muted grey placeholder color
                textSpan.style.fontWeight = '400'; // Normal font weight for placeholder
                textSpan.style.textTransform = 'none'; // Keep placeholder case normal
            }
            
            // Replace the input node with the span node in the clone
            clonedInput.parentNode.replaceChild(textSpan, clonedInput);
        }
    });

    // 5. Render the perfectly styled clone using html2canvas
    html2canvas(clone, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
    }).then(canvas => {
        // Safely export to PNG
        const imgData = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');

        // Construct standard clean file name based on Elector Name
        let electorName = '';
        if (isTypeB) {
            const activeColIdx = getActiveColumnB() || 1;
            electorName = document.getElementById(`b-elector-name-${activeColIdx}`).value.trim();
        } else {
            electorName = document.getElementById('elector-name').value.trim();
        }
        const nameStr = electorName || 'Elector';
        const safeName = nameStr.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

        downloadLink.download = `SIR_2026_CAMP_${safeName}.png`;
        downloadLink.href = imgData;
        downloadLink.click();

        // 6. Clean up the clone from the DOM
        document.body.removeChild(clone);

        showToast('Successfully exported high-quality PNG image!', '✓', 'text-emerald-400');
    }).catch(err => {
        console.error(err);
        // Ensure DOM clean up on error
        if (clone.parentNode) {
            document.body.removeChild(clone);
        }
        showToast('Error generating image file.', '✕', 'text-red-500');
    });
}

// Open local system standard print dialog
function triggerPrint() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    window.print();
}

// Custom beautiful Toast notifier helper
function showToast(message, icon, colorClass) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMsg = document.getElementById('toast-message');

    toastIcon.className = `font-extrabold text-base ${colorClass}`;
    toastIcon.innerText = icon;
    toastMsg.innerText = message;

    // Slide in
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        // Slide out
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 4000);
}

// Toggle scale fit state
function toggleScaleFit() {
    isScaleFitEnabled = !isScaleFitEnabled;
    const btn = document.getElementById('btn-scale-fit');
    if (btn) {
        if (isScaleFitEnabled) {
            btn.className = "px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 bg-indigo-900/40 border-indigo-700 text-indigo-300 hover:bg-indigo-900/60 shadow";
            showToast('Scale to Fit enabled!', '✓', 'text-indigo-400');
        } else {
            btn.className = "px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white";
            showToast('Scale to Fit disabled. Scroll horizontally.', 'ℹ', 'text-slate-400');
        }
    }
    updateScale();
}

// Calculate scale factor and apply it to the active form card
function updateScale() {
    const cardA = document.getElementById('form-card-a');
    const cardB = document.getElementById('form-card-b');
    const swipeHint = document.getElementById('swipe-hint');
    
    if (!cardA || !cardB) return;
    
    const viewportWidth = window.innerWidth;
    const padding = 24; // 12px each side on mobile
    const availableWidth = viewportWidth - padding;
    const targetWidth = 850;
    
    const activeCard = currentFormType === 'A' ? cardA : cardB;
    const inactiveCard = currentFormType === 'A' ? cardB : cardA;
    
    // Always reset the inactive card's zoom/transform to avoid layout bugs when switching form types
    inactiveCard.style.zoom = '1';
    inactiveCard.style.transform = 'none';
    if (inactiveCard.parentElement) {
        inactiveCard.parentElement.style.height = 'auto';
    }
    
    if (isScaleFitEnabled && availableWidth < targetWidth) {
        const scale = availableWidth / targetWidth;
        
        // Hide swipe hint since card fits screen
        if (swipeHint) {
            swipeHint.classList.add('hidden');
        }
        
        if ('zoom' in document.body.style) {
            activeCard.style.zoom = scale;
            activeCard.style.transform = 'none';
            if (activeCard.parentElement) {
                activeCard.parentElement.style.height = 'auto';
            }
        } else {
            // Firefox fallback using transform scale
            activeCard.style.transform = `scale(${scale})`;
            activeCard.style.transformOrigin = 'top center';
            activeCard.style.zoom = '1';
            
            // Adjust wrapper height to prevent empty space (layout collapse)
            if (activeCard.parentElement) {
                const cardHeight = activeCard.offsetHeight;
                activeCard.parentElement.style.height = (cardHeight * scale) + 'px';
            }
        }
    } else {
        // Reset scale
        activeCard.style.zoom = '1';
        activeCard.style.transform = 'none';
        if (activeCard.parentElement) {
            activeCard.parentElement.style.height = 'auto';
        }
        
        // Show/hide swipe hint based on overflow
        if (swipeHint) {
            if (availableWidth < targetWidth) {
                swipeHint.classList.remove('hidden');
            } else {
                swipeHint.classList.add('hidden');
            }
        }
    }
}

