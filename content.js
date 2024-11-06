//TODO: fix table filtering after card view
//TODO: fix table search after card view

let isCardView = false;
let originalTable = null;
let originalConfig = null;

function sanitize(str) {
    return str ? str.replace(/[<>&"']/g, '') : '';
}

function storeOriginalTable() {
    const table = document.querySelector('.wpDataTable');
    if (!table) return;

    // Store the original table
    originalTable = table.cloneNode(true);

    // Store the DataTable configuration
    const tableDesc = document.getElementById('table_1_desc');
    if (tableDesc) {
        try {
            originalConfig = JSON.parse(tableDesc.value);
        } catch (error) {
            console.error('Error parsing table configuration:', error);
        }
    }
}

function transformTableToCards() {
    const table = document.querySelector('.wpDataTable');
    if (!table) {
        console.log('No table found');
        return;
    }

    // Store original state if not already stored
    if (!originalTable) {
        storeOriginalTable();
    }

    try {
        // Hide the search bar
        const searchBar = document.querySelector('#table_1_filter');
        if (searchBar) {
            searchBar.style.display = 'none';
        }

        // Remove any existing card containers
        const existingContainer = document.querySelector('.wr-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Create cards from original table data
        const headers = Array.from(originalTable.querySelectorAll('th')).map(th => th.textContent.trim());
        const rows = Array.from(originalTable.querySelectorAll('tbody tr'));

        // Create search input
        const searchContainer = document.createElement('div');
        searchContainer.className = 'wr-search-container';
        searchContainer.innerHTML = `
            <input type="text" 
                   id="cardSearch" 
                   placeholder="Search players..." 
                   class="wr-search-input">
        `;

        // Create cards container
        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'wr-cards-grid';

        // Create container
        const container = document.createElement('div');
        container.className = 'wr-container';
        container.appendChild(searchContainer);
        container.appendChild(cardsGrid);

        // Add search functionality
        searchContainer.querySelector('#cardSearch').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const cards = cardsGrid.querySelectorAll('.wr-card');
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        });

        // Transform rows to cards
        rows.forEach(row => {
            const rowData = {};
            Array.from(row.cells).forEach((cell, index) => {
                rowData[headers[index]] = cell.textContent.trim();
            });
            cardsGrid.appendChild(createCard(rowData));
        });

        // Replace table with container
        table.parentNode.replaceChild(container, table);

    } catch (error) {
        console.error('Error transforming table:', error);
        isCardView = false;
    }
}

function revertToTable() {
    const container = document.querySelector('.wr-container');
    if (!container || !originalTable) return;

    try {
        // Create a fresh copy of the original table
        const newTable = originalTable.cloneNode(true);

        // Replace container with the table
        container.parentNode.replaceChild(newTable, container);

        // Show the search bar
        const searchBar = document.querySelector('#table_1_filter');
        if (searchBar) {
            searchBar.style.display = 'block';
        }

        // Reinitialize DataTable
        if (originalConfig && originalConfig.dataTableParams) {
            if ($.fn.DataTable.isDataTable('#table_1')) {
                $('#table_1').DataTable().destroy();
            }
            $('#table_1').DataTable(originalConfig.dataTableParams);
        }
    } catch (error) {
        console.error('Error reverting to table:', error);
    }
}

function createCard(data) {
    const card = document.createElement('div');
    card.className = 'wr-card';

    card.innerHTML = `
    <div class="wr-card-header">
      <div class="wr-card-title">
        <div class="wr-card-name-group">
          <div class="wr-card-name">${sanitize(data['Wide Receiver'])}</div>
          <div class="wr-card-team">${sanitize(data['Team'])}</div>
        </div>
        
        <div class="wr-card-rankings">
          <div class="wr-card-rank">
            <div class="wr-card-rank-label">ROS</div>
            <div class="wr-card-rank-value">#${sanitize(data['ROS Ranking'])}</div>
          </div>
          <div class="wr-card-rank">
            <div class="wr-card-rank-label">Dynasty</div>
            <div class="wr-card-rank-value">#${sanitize(data['Dynasty Ranking'])}</div>
          </div>
        </div>
      </div>
      
      <div class="wr-card-performance-group">
        <div class="wr-card-performance-label">Performance:</div>
        <div class="wr-card-performance wr-performance-${getPerformanceClass(data['Relative Performance'])}">
          ${sanitize(data['Relative Performance'])}
        </div>
      </div>
    </div>

    <div class="wr-card-notes">
      <strong>Notes:</strong><br/>
      ${sanitize(data['Notes'])}
    </div>
    
    <div class="wr-card-games">
      <strong>Games Sampled:</strong> ${sanitize(data['Games Sampled'])}
    </div>
  `;

    return card;
}

function getPerformanceClass(performance) {
    const performanceMap = {
        'Wow': 'wow',
        'Good': 'good',
        'Right On': 'right-on',
        'Oof': 'oof',
        'Yikes': 'yikes'
    };
    return performanceMap[performance] || 'right-on';
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getState') {
        sendResponse({view: isCardView ? 'cards' : 'table'});
    } else if (request.action === 'toggleView') {
        isCardView = request.view === 'cards';
        if (isCardView) {
            transformTableToCards();
        } else {
            revertToTable();
        }
    }
    return true;
});

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    storeOriginalTable();
}); 