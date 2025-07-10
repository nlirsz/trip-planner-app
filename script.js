import { handleAuthStateChanges, login, signup, logout } from './auth.js';
import { getTrips, createTrip, updateTrip } from './firestore.js';
import { callGeminiAPI } from './api.js';
import * as ui from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // App state
    let currentUser = null;
    let trips = [];
    let currentTripId = null;

    // --- AUTHENTICATION ---
    const onLogin = async (user) => {
        currentUser = user;
        ui.showAppScreen();
        trips = await getTrips(currentUser.uid);
        ui.renderTripDashboard(trips, handleSelectTrip);
        handleDeselectTrip();
    };

    const onLogout = () => {
        currentUser = null;
        trips = [];
        currentTripId = null;
        ui.showLoginScreen();
        ui.renderTripDashboard([], handleSelectTrip);
    };

    handleAuthStateChanges(onLogin, onLogout);

    ui.setupAuthForms(
        (e) => { // Login handler
            e.preventDefault();
            const email = e.target.elements['login-email'].value;
            const password = e.target.elements['login-password'].value;
            login(email, password).catch(error => alert(`Erro no login: ${error.message}`));
        },
        (e) => { // Signup handler
            e.preventDefault();
            const email = e.target.elements['signup-email'].value;
            const password = e.target.elements['signup-password'].value;
            signup(email, password).catch(error => alert(`Erro no cadastro: ${error.message}`));
        }
    );

    ui.setupLogoutButton(() => logout());

    // --- TRIPS & NAVIGATION ---
    const handleSelectTrip = (tripId) => {
        currentTripId = tripId;
        ui.selectTrip(handleNavClick);
    };

    const handleDeselectTrip = () => {
        currentTripId = null;
        ui.deselectTrip(handleNavClick);
    };

    const handleNavClick = (tabId) => {
        if (tabId === 'trips') {
            handleDeselectTrip();
        } else {
            const trip = trips.find(t => t.id === currentTripId);
            ui.showTab(tabId, trip);
        }
    };

    ui.setupNav(handleNavClick);

    // --- FORMS & ACTIONS ---
    const handleAddTripSubmit = async (e) => {
        e.preventDefault();
        const name = e.target.elements['trip-name-input'].value.trim();
        const destination = e.target.elements['trip-destination-input'].value.trim();
        if (name && destination && currentUser) {
            const newTrip = {
                id: Date.now().toString(),
                name,
                destination,
                flights: [], accommodations: [], itinerary: [],
                packing: [], expenses: []
            };
            await createTrip(currentUser.uid, newTrip);
            trips.push(newTrip);
            ui.renderTripDashboard(trips, handleSelectTrip);
            handleSelectTrip(newTrip.id);
            ui.hideAddTripModal();
        }
    };

    ui.setupForm('add-trip-form', handleAddTripSubmit);

    const mainActionHandlers = {
        onAddItemFormSubmit: async (form) => {
            const type = form.dataset.type;
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip || !currentUser) return;

            const formData = new FormData(form);
            const newItem = {};
            formData.forEach((value, key) => newItem[key] = value);

            if (!trip[type]) trip[type] = [];
            trip[type].push(newItem);

            await updateTrip(currentUser.uid, trip.id, { [type]: trip[type] });
            ui.renderTabContent(type, trip);
            form.reset();
        },
        onAiPlannerFormSubmit: async (form) => {
            const loadingIndicator = form.querySelector('.loading-indicator');
            const submitButton = form.querySelector('button');
            try {
                const trip = trips.find(t => t.id === currentTripId);
                if (!trip) return;

                loadingIndicator.style.display = 'block';
                submitButton.disabled = true;

                const formData = new FormData(form);
                const prompt = `
                    Crie um plano de viagem para ${trip.destination} com duração de ${formData.get('duration')} dias.
                    O estilo da viagem é: ${formData.get('style')}.
                    Meus principais interesses são: ${formData.get('interests')}.
                    Informações adicionais: ${formData.get('extraInfo')}.

                    Gere uma resposta em formato JSON. O JSON deve ter três chaves principais: "itinerary", "accommodations", e "packing".
                    - A chave "itinerary" deve ser um array de objetos, onde cada objeto representa um dia e tem as propriedades "day" (número), "title" (um título curto para o dia), e "events" (um array de objetos, cada um com "time" e "description").
                    - A chave "accommodations" deve ser um array de objetos, cada um com uma propriedade "name" e "description".
                    - A chave "packing" deve ser um array de objetos, cada um com uma propriedade "item".
                    Não inclua nenhuma formatação markdown como \`\`\`json.
                `;

                const aiResponse = await callGeminiAPI(prompt);
                const plan = JSON.parse(aiResponse);

                trip.itinerary = plan.itinerary || [];
                trip.accommodations = plan.accommodations || [];
                trip.packing = plan.packing || [];

                await updateTrip(currentUser.uid, trip.id, {
                    itinerary: trip.itinerary,
                    accommodations: trip.accommodations,
                    packing: trip.packing
                });

                alert('Plano de viagem gerado com sucesso! Verifique as abas correspondentes.');
                ui.showTab('itinerary', trip);

            } catch (error) {
                console.error("Erro ao gerar plano de viagem:", error);
                alert(`Não foi possível gerar o plano: ${error.message}`);
            } finally {
                loadingIndicator.style.display = 'none';
                submitButton.disabled = false;
            }
        },
        onGoogleFlightsClick: () => {
            const trip = trips.find(t => t.id === currentTripId);
            if (trip) {
                const url = `https://www.google.com/flights?q=Voos+para+${encodeURIComponent(trip.destination)}`;
                window.open(url, '_blank');
            }
        },
        onGoogleHotelsClick: () => {
            const trip = trips.find(t => t.id === currentTripId);
            if (trip) {
                const url = `https://www.google.com/travel/hotels/${encodeURIComponent(trip.destination)}`;
                window.open(url, '_blank');
            }
        }
    };

    ui.setupMainEventListener(mainActionHandlers);
    ui.setupModals();
});