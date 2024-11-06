let currentView = 'table';

document.addEventListener('DOMContentLoaded', async () => {
    // Load saved view
    chrome.storage.sync.get(['currentView'], (result) => {
        currentView = result.currentView || 'table';
        updateStatus();
    });

    // Add event listeners
    document.getElementById('showCards').addEventListener('click', () => toggleView('cards'));
    document.getElementById('showTable').addEventListener('click', () => toggleView('table'));

    // Query current tab to check if content script is ready
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getState'}, (response) => {
            if (response && response.view) {
                currentView = response.view;
                updateStatus();
            }
        });
    });
});

function toggleView(view) {
    currentView = view;
    updateStatus();

    // Send message to content script
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'toggleView',
            view: view
        });
    });

    chrome.storage.sync.set({currentView: view});
}

function updateStatus() {
    const status = document.getElementById('status');
    status.textContent = `Current view: ${currentView.charAt(0).toUpperCase() + currentView.slice(1)}`;

    const cardsBtn = document.getElementById('showCards');
    const tableBtn = document.getElementById('showTable');

    if (currentView === 'cards') {
        cardsBtn.className = 'primary-btn';
        tableBtn.className = 'secondary-btn';
    } else {
        cardsBtn.className = 'secondary-btn';
        tableBtn.className = 'primary-btn';
    }
} 