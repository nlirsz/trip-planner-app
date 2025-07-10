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
        const calendarContainer = tabNode.querySelector('.itinerary-calendar');
        if (calendarContainer && trip.itinerary) {
            calendarContainer.innerHTML = ''; // Clear previous content
            trip.itinerary.forEach(day => {
                const dayCard = document.createElement('div');
                dayCard.className = 'day-card';
                dayCard.innerHTML = `<div class="day-number">${day.day}</div><div class="day-title">${day.title}</div>`;
                dayCard.addEventListener('click', () => showDayDetailModal(day));
                calendarContainer.appendChild(dayCard);
            });
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

export function deselectTrip(showTabHandler) {
    navItems.forEach(item => {
        if (item.dataset.tab !== 'trips') item.classList.add('disabled');
    });
    showTabHandler('trips');
}

export function selectTrip(showTabHandler) {
    navItems.forEach(item => item.classList.remove('disabled'));
    showTabHandler('itinerary');
}


// --- Modals ---

export function setupModals() {
    // Day Detail Modal
    const modalCloseButton = dayDetailModal.querySelector('.modal-close-button');
    modalCloseButton.addEventListener('click', () => dayDetailModal.classList.remove('active'));
    dayDetailModal.addEventListener('click', (e) => {
        if (e.target === dayDetailModal) dayDetailModal.classList.remove('active');
    });

    // Add Trip Modal
    const closeAddTripModalButton = document.getElementById('close-add-trip-modal');
    addTripButton.addEventListener('click', () => addTripModal.classList.add('active'));
    closeAddTripModalButton.addEventListener('click', () => addTripModal.classList.remove('active'));
    addTripModal.addEventListener('click', (e) => {
        if (e.target === addTripModal) addTripModal.classList.remove('active');
    });
}

function showDayDetailModal(dayData) {
    document.getElementById('modal-day-title').textContent = `Dia ${dayData.day}: ${dayData.title}`;
    const eventsList = document.getElementById('modal-day-events');
    eventsList.innerHTML = '';
    dayData.events.forEach(event => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${event.time || ''}</strong> - ${event.description}`;
        eventsList.appendChild(li);
    });
    dayDetailModal.classList.add('active');
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
