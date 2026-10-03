
// ==========================================
// JEANN
// ==========================================

// HISTORY VIEW — List / Cards with Pagination

let historyStyle = 'list';   // 'list' | 'cards'
let listPage = 1;            // Current page for list view (5 per page)
let cardsPage = 1;           // Current day index for cards view
const ITEMS_PER_PAGE = 5;    // 5 records per page in list view


// SWITCH BETWEEN LIST AND CARDS


function setHistoryStyle(style) {
    historyStyle = style;
    listPage = 1;      // Reset pagination
    cardsPage = 1;

    // Highlight active button
    document.querySelectorAll('.history-style-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.style === style);
    });

    // Show/hide containers
    const listBox = document.getElementById('historyListContainer');
    const cardsBox = document.getElementById('historyCardsContainer');

    if (listBox) listBox.classList.toggle('hidden', style !== 'list');
    if (cardsBox) cardsBox.classList.toggle('hidden', style !== 'cards');

    renderHistoryView();
}


// MAIN RENDER


function renderHistoryView() {
    if (!Array.isArray(moodLogs)) moodLogs = [];

    if (historyStyle === 'list') {
        renderHistoryList();
    } else {
        renderHistoryCards();
    }
}


// LIST VIEW — 5 records per page


function renderHistoryList() {
    const tbody = document.getElementById('history-list-body');
    if (!tbody) return;

    const totalPages = Math.max(1, Math.ceil(moodLogs.length / ITEMS_PER_PAGE));
    
    // Clamp page number
    if (listPage > totalPages) listPage = totalPages;
    if (listPage < 1) listPage = 1;

    // Update page indicator
    const indicator = document.getElementById('listPageIndicator');
    if (indicator) {
        indicator.textContent = `Page ${listPage} / ${totalPages}`;
    }

    // Disable/enable buttons
    const paginationBox = document.getElementById('listPagination');
    if (paginationBox) {
        const prevBtn = paginationBox.querySelector('button:first-child');
        const nextBtn = paginationBox.querySelector('button:last-child');
        if (prevBtn) prevBtn.disabled = listPage <= 1;
        if (nextBtn) nextBtn.disabled = listPage >= totalPages;
    }

    if (moodLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:1.5rem 0;">No logs yet. Go to Dashboard to log your first mood!</td></tr>`;
        return;
    }

    // Get records for current page
    const startIdx = (listPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pageLogs = moodLogs.slice(startIdx, endIdx);

    tbody.innerHTML = pageLogs.map(log => `
        <tr>
            <td>${log.log_date}</td>
            <td>
                <span class="badge-emotion" style="background:${getEmotionBg(log.emotion)}">
                    <i data-lucide="${log.iconName || 'smile'}" style="width:14px;"></i> ${log.emotion}
                </span>
            </td>
            <td style="color:var(--text-muted);">${log.note || '—'}</td>
            <td>
                <button class="btn-delete" onclick="deleteLog(${log.id})">
                    <i data-lucide="trash-2" style="width:14px;"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

function prevListPage() {
    if (listPage > 1) {
        listPage--;
        renderHistoryList();
    }
}

function nextListPage() {
    const totalPages = Math.max(1, Math.ceil(moodLogs.length / ITEMS_PER_PAGE));
    if (listPage < totalPages) {
        listPage++;
        renderHistoryList();
    }
}


// CARDS VIEW — 1 day per page (shows all moods of that day)


function renderHistoryCards() {
    const container = document.getElementById('history-cards-body');
    if (!container) return;

    // Group logs by date
    const byDate = {};
    moodLogs.forEach(l => {
        if (!byDate[l.log_date]) byDate[l.log_date] = [];
        byDate[l.log_date].push(l);
    });

    // Sort dates descending (newest first)
    const dates = Object.keys(byDate).sort().reverse();
    const totalDays = dates.length;

    // Update page indicator
    const indicator = document.getElementById('cardsPageIndicator');
    if (indicator) {
        indicator.textContent = totalDays > 0 
            ? `Page ${cardsPage} / ${totalDays}` 
            : 'Page 0 / 0';
    }

    // Disable/enable buttons
    const paginationBox = document.getElementById('cardsPagination');
    if (paginationBox) {
        const prevBtn = paginationBox.querySelector('button:first-child');
        const nextBtn = paginationBox.querySelector('button:last-child');
        if (prevBtn) prevBtn.disabled = cardsPage <= 1;
        if (nextBtn) nextBtn.disabled = cardsPage >= totalDays;
    }

    if (totalDays === 0) {
        container.innerHTML = `<p style="color:var(--text-muted);font-weight:600;text-align:center;padding:2rem;">No mood entries logged yet.</p>`;
        return;
    }

    // Clamp page number
    if (cardsPage > totalDays) cardsPage = totalDays;
    if (cardsPage < 1) cardsPage = 1;

    // Get current date and its entries
    const currentDate = dates[cardsPage - 1];
    const entries = byDate[currentDate];

    // Render the single day
    container.innerHTML = `
        <div class="day-group-card">
            <div class="day-group-header">
                <span> ${currentDate}</span>
                <span style="font-size:0.75rem;color:var(--text-muted);">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            <div class="day-group-entries">
                ${entries.map(entry => `
                    <div class="day-entry-card">
                        <!-- Time in top-right corner -->
                        ${entry.created_at ? `
                            <div class="entry-time">${new Date(entry.created_at).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</div>
                        ` : ''}

                        <!-- Emotion -->
                        <div class="entry-emotion">
                            <i data-lucide="${entry.iconName || 'smile'}" style="width:18px;"></i>
                            ${entry.emotion}
                        </div>

                        <!-- Note -->
                        <div class="entry-note">${entry.note || 'No note'}</div>

                        <!-- Delete button in bottom-right -->
                        <div class="entry-footer">
                            <button class="btn-delete" onclick="deleteLog(${entry.id})" title="Delete">
                                <i data-lucide="trash-2" style="width:14px;"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}

function prevCardsPage() {
    if (cardsPage > 1) {
        cardsPage--;
        renderHistoryCards();
    }
}

function nextCardsPage() {
    // Group by date to get total
    const uniqueDates = [...new Set(moodLogs.map(l => l.log_date))];
    if (cardsPage < uniqueDates.length) {
        cardsPage++;
        renderHistoryCards();
    }
}
