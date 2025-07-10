// Element Selectors
const mainTitle = document.getElementById('main-title');
const tripContext = document.getElementById('trip-context');
const addTripButton = document.getElementById('add-trip-button');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const dayDetailModal = document.getElementById('day-detail-modal');
const addTripModal = document.getElementById('add-trip-modal');
const authContainer = document.getElementById('auth-container');
const appContainer = document.querySelector('.app-container');
const logoutButton = document.createElement('button');
logoutButton.textContent = 'Sair';
logoutButton.className = 'logout-button';

// --- Authentication UI ---

export function showLoginScreen() {
    authContainer.classList.add('active');
    appContainer.classList.remove('active');
    if (document.querySelector('.logout-button')) {
        document.querySelector('.main-header').removeChild(logoutButton);
    }
}

export function showAppScreen() {
    authContainer.classList.remove('active');
    appContainer.classList.add('active');
    document.querySelector('.main-header').appendChild(logoutButton);
}

export function setupAuthForms(loginHandler, signupHandler) {
    document.getElementById('login-form').addEventListener('submit', loginHandler);
    document.getElementById('signup-form').addEventListener('submit', signupHandler);

    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form-container').style.display = 'none';
        document.getElementById('signup-form-container').style.display = 'block';
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-form-container').style.display = 'none';
        document.getElementById('login-form-container').style.display = 'block';
    });
}

export function setupLogoutButton(logoutHandler) {
    logoutButton.addEventListener('click', logoutHandler);
}


let currentDayData = null; // Variável para guardar os dados do dia atual no modal

export function getCurrentDayData() {
    return currentDayData;
}

export function getUpdatedDayDetails() {
    const title = document.getElementById('modal-day-title-input').value;
    const eventItems = document.querySelectorAll('#modal-day-events-container .event-item');
    const events = Array.from(eventItems).map(item => ({
        time: item.querySelector('.event-time-input').value,
        description: item.querySelector('.event-description-input').value
    }));
    return { ...currentDayData, title, events };
}

export function toggleDayModalEditMode(isEditMode) {
    const titleInput = document.getElementById('modal-day-title-input');
    const eventInputs = document.querySelectorAll('.event-time-input, .event-description-input');
    const removeButtons = document.querySelectorAll('.remove-event-button');
    const editButton = document.getElementById('edit-day-button');
    const saveButton = document.getElementById('save-day-button');

    titleInput.readOnly = !isEditMode;
    eventInputs.forEach(input => input.readOnly = !isEditMode);
    removeButtons.forEach(btn => btn.style.display = isEditMode ? 'inline-block' : 'none');
    
    editButton.style.display = isEditMode ? 'none' : 'inline-block';
    saveButton.style.display = isEditMode ? 'inline-block' : 'none';
}

function populateDayDetailModal(dayData) {
    currentDayData = dayData;
    document.getElementById('modal-day-title-input').value = `Dia ${dayData.day}: ${dayData.title}`;
    const eventsContainer = document.getElementById('modal-day-events-container');
    eventsContainer.innerHTML = '';
    const eventTemplate = document.getElementById('event-item-template');

    dayData.events.forEach(event => {
        const eventNode = eventTemplate.content.cloneNode(true);
        eventNode.querySelector('.event-time-input').value = event.time || '';
        eventNode.querySelector('.event-description-input').value = event.description || '';
        eventNode.querySelector('.remove-event-button').onclick = (e) => e.target.closest('.event-item').remove();
        eventsContainer.appendChild(eventNode);
    });

    toggleDayModalEditMode(false); // Garante que o modal abre em modo de visualização
    dayDetailModal.classList.add('active');
}

// --- Itinerary Rendering ---
function renderItineraryTable(container, tableMarkdown) {
    if (!tableMarkdown) {
        container.innerHTML = '<p>Gere um plano de viagem para ver o itinerário.</p>';
        return;
    }
    // Basic markdown to HTML conversion for the table
    let html = tableMarkdown
        .replace(/^\|/gm, '<tr><td>')
        .replace(/\|$/gm, '</td></tr>')
        .replace(/\|/g, '</td><td>');
    html = `<table><thead>${html.substring(0, html.indexOf('</tr>') + 5)}</thead><tbody>${html.substring(html.indexOf('</tr>') + 5)}</tbody></table>`;
    // Clean up header row
    html = html.replace(/<td>-----<\/td>/g, '');
    container.innerHTML = html;
}

export function createDownloadLink(csvContent, fileName) {
    const container = document.getElementById('download-links-container');
    container.innerHTML = ''; // Clear previous links
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.textContent = 'Baixar Geolocalizações (CSV)';
    link.className = 'download-link';
    container.appendChild(link);
}

export function clearDownloadLinks() {
    const container = document.getElementById('download-links-container');
    if(container) container.innerHTML = '';
}


// --- Trip Dashboard & Tabs ---

export function renderTripDashboard(trips, selectTripHandler) {
    const tripGrid = document.getElementById('trip-grid');
    const noTripsMessage = document.getElementById('no-trips-message');
    tripGrid.innerHTML = '';

    if (trips.length === 0) {
        noTripsMessage.style.display = 'block';
    } else {
        noTripsMessage.style.display = 'none';
        trips.forEach(trip => {
            const cardTemplate = document.getElementById('trip-card-template');
            const cardNode = cardTemplate.content.cloneNode(true);
            cardNode.querySelector('.country-name').textContent = trip.name;
            cardNode.querySelector('.card-image').src = `https://placehold.co/600x400/1c1c1f/ffffff?text=${trip.destination}`;
            const manageButton = cardNode.querySelector('.manage-button');
            manageButton.dataset.tripId = trip.id;
            manageButton.addEventListener('click', () => selectTripHandler(trip.id));
            tripGrid.appendChild(cardNode);
        });
    }
}

export function renderTabContent(tabName, trip) {
    const tabContent = document.getElementById(`${tabName}-tab`);
    if (!trip || !tabContent) return;

    const template = document.getElementById(`${tabName}-tab-template`);
    if (!template) {
        tabContent.innerHTML = `<h3>${tabName.charAt(0).toUpperCase() + tabName.slice(1)} - Em construção</h3>`;
        return;
    }

    const tabNode = template.content.cloneNode(true);

    if (tabName === 'itinerary') {
        const tableContainer = tabNode.querySelector('#itinerary-table-container');
        if (tableContainer) {
            renderItineraryTable(tableContainer, trip.itineraryTable);
        }
        const chatButton = tabNode.querySelector('#chat-with-ai-button');
        if (chatButton) {
            if (trip.itineraryTable) {
                chatButton.style.display = 'block';
                chatButton.addEventListener('click', () => showAIChatModal());
            } else {
                chatButton.style.display = 'none';
            }
        }
    } else {
        const listContainer = tabNode.querySelector('.list-container');
        if (listContainer && trip[tabName]) {
            listContainer.innerHTML = '';
            trip[tabName].forEach(item => {
                const li = document.createElement('li');
                li.textContent = Object.values(item).join(' - ');
                listContainer.appendChild(li);
            });
        }
    }

    tabContent.innerHTML = '';
    tabContent.appendChild(tabNode);
}

export function showTab(tabId, trip) {
    tabContents.forEach(tab => tab.classList.toggle('active', tab.id === `${tabId}-tab`));
    navItems.forEach(item => item.classList.toggle('active', item.dataset.tab === tabId));

    if (tabId === 'trips') {
        mainTitle.textContent = "Minhas Viagens";
        tripContext.style.display = 'none';
        addTripButton.style.display = 'flex';
    } else {
        if (trip) {
            mainTitle.textContent = trip.name;
            tripContext.textContent = trip.destination;
            tripContext.style.display = 'block';
        }
        addTripButton.style.display = 'none';
        renderTabContent(tabId, trip);
    }
}

export function disableTripTabs() {
    navItems.forEach(item => {
        if (item.dataset.tab !== 'trips') item.classList.add('disabled');
    });
}

export function enableTripTabs() {
    navItems.forEach(item => item.classList.remove('disabled'));
}


// --- Modals ---

export function setupModals(chatFormHandler) {
    // Day Detail Modal
    const modalCloseButton = dayDetailModal.querySelector('.modal-close-button');
    modalCloseButton.addEventListener('click', () => dayDetailModal.classList.remove('active'));
    dayDetailModal.addEventListener('click', (e) => {
        if (e.target === dayDetailModal) dayDetailModal.classList.remove('active');
    });
    document.getElementById('edit-day-button').addEventListener('click', () => toggleDayModalEditMode(true));


    // Add Trip Modal
    const closeAddTripModalButton = document.getElementById('close-add-trip-modal');
    addTripButton.addEventListener('click', () => addTripModal.classList.add('active'));
    closeAddTripModalButton.addEventListener('click', () => addTripModal.classList.remove('active'));
    addTripModal.addEventListener('click', (e) => {
        if (e.target === addTripModal) addTripModal.classList.remove('active');
    });

    // AI Chat Modal
    const aiChatModal = document.getElementById('ai-chat-modal');
    const closeAIChatModalButton = document.getElementById('close-ai-chat-modal');
    closeAIChatModalButton.addEventListener('click', () => aiChatModal.classList.remove('active'));
    aiChatModal.addEventListener('click', (e) => {
        if (e.target === aiChatModal) aiChatModal.classList.remove('active');
    });
    document.getElementById('ai-chat-form').addEventListener('submit', chatFormHandler);
}

// --- AI Chat UI ---

export function showAIChatModal() {
    document.getElementById('ai-chat-modal').classList.add('active');
}

export function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('ai-chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', `${sender}-message`);
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
}

export function setAIChatLoading(isLoading) {
    const form = document.getElementById('ai-chat-form');
    const loadingIndicator = form.nextElementSibling; // Assumes loading indicator is next sibling
    form.querySelector('button').disabled = isLoading;
    loadingIndicator.style.display = isLoading ? 'block' : 'none';
}


export function hideAddTripModal() {
    addTripModal.classList.remove('active');
    document.getElementById('add-trip-form').reset();
}

// --- Event Handlers Setup ---

export function setupNav(navClickHandler) {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (!item.classList.contains('disabled')) {
                navClickHandler(item.dataset.tab);
            }
        });
    });
}

export function setupForm(formId, submitHandler) {
    document.getElementById(formId).addEventListener('submit', submitHandler);
}

export function setupMainEventListener(handlers) {
    document.querySelector('main').addEventListener('submit', (e) => {
        const form = e.target;
        if (form.classList.contains('add-item-form')) {
            e.preventDefault();
            handlers.onAddItemFormSubmit(form);
        } else if (form.id === 'ai-planner-form') {
            e.preventDefault();
            handlers.onAiPlannerFormSubmit(form);
        }
    });

    document.querySelector('main').addEventListener('click', (e) => {
        if (e.target.classList.contains('google-flights-button')) {
            handlers.onGoogleFlightsClick();
        }
        if (e.target.classList.contains('google-hotels-button')) {
            handlers.onGoogleHotelsClick();
        }
    });
}
