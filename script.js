import { handleAuthStateChanges, login, signup, logout } from './auth';
import { getTrips, createTrip, updateTrip } from './firestore';
import { callGeminiAPI } from './api';
import * as ui from './ui';

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
        ui.enableTripTabs();
        const trip = trips.find(t => t.id === currentTripId);
        ui.showTab('itinerary', trip);
    };

    const handleDeselectTrip = () => {
        currentTripId = null;
        ui.disableTripTabs();
        ui.showTab('trips', null);
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
        const startDate = e.target.elements['trip-start-date-input'].value;
        const endDate = e.target.elements['trip-end-date-input'].value;

        if (name && destination && startDate && endDate && currentUser) {
            if (new Date(startDate) > new Date(endDate)) {
                alert("A data de início não pode ser depois da data de fim.");
                return;
            }
            const newTrip = {
                id: Date.now().toString(),
                name,
                destination,
                startDate,
                endDate,
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

    const handleUpdateDayDetails = async (e) => {
        e.preventDefault();
        const trip = trips.find(t => t.id === currentTripId);
        const day = ui.getCurrentDayData();
        if (!trip || !day || !currentUser) return;

        const updatedDay = ui.getUpdatedDayDetails();
        const dayIndex = trip.itinerary.findIndex(d => d.day === day.day);
        if (dayIndex === -1) return;

        trip.itinerary[dayIndex] = updatedDay;

        await updateTrip(currentUser.uid, trip.id, { itinerary: trip.itinerary });
        ui.renderTabContent('itinerary', trip);
        ui.toggleDayModalEditMode(false);
    };

    ui.setupForm('day-detail-form', handleUpdateDayDetails);

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        const input = e.target.elements['ai-chat-input'];
        const userMessage = input.value.trim();
        if (!userMessage) return;

        const trip = trips.find(t => t.id === currentTripId);
        if (!trip || !trip.itineraryTable) {
            alert("Gere um itinerário antes de tentar refiná-lo.");
            return;
        }

        ui.addChatMessage('user', userMessage);
        ui.setAIChatLoading(true);
        input.value = '';

        try {
            const prompt = `
                **Contexto:** O usuário deseja refinar um roteiro de viagem existente.

                **Roteiro Atual (em Markdown):**
                ${trip.itineraryTable}

                **Solicitação do Usuário:** "${userMessage}"

                **Sua Tarefa:**
                1.  Analise o roteiro atual e a solicitação do usuário.
                2.  Gere uma resposta conversacional amigável explicando as alterações que você fará.
                3.  Modifique o roteiro conforme a solicitação, mantendo a estrutura e a qualidade do plano original.
                4.  Forneça a resposta em um objeto JSON com três chaves: chatResponse (sua resposta em texto), updatedItineraryTable (a nova tabela do roteiro em Markdown), e updatedGeolocationsCsv (o novo CSV de geolocalizações).
            `;

            const aiResponse = await callGeminiAPI(prompt);
            const plan = JSON.parse(aiResponse);

            ui.addChatMessage('ai', plan.chatResponse);

            if (plan.updatedItineraryTable && plan.updatedGeolocationsCsv) {
                trip.itineraryTable = plan.updatedItineraryTable;
                trip.geolocationsCsv = plan.updatedGeolocationsCsv;

                await updateTrip(currentUser.uid, trip.id, {
                    itineraryTable: trip.itineraryTable,
                    geolocationsCsv: trip.geolocationsCsv
                });

                ui.renderTabContent('itinerary', trip);
                ui.createDownloadLink(trip.geolocationsCsv, `roteiro_${trip.name.replace(/\s+/g, '_')}.csv`);
            }

        } catch (error) {
            console.error("Erro no chat com IA:", error);
            ui.addChatMessage('ai', `Desculpe, ocorreu um erro: ${error.message}`);
        } finally {
            ui.setAIChatLoading(false);
        }
    };

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
// Substitua TODA a sua função onAiPlannerFormSubmit por esta:
onAiPlannerFormSubmit: async (form) => {
    const loadingIndicator = form.querySelector('.loading-indicator');
    const submitButton = form.querySelector('button');
    try {
        const trip = trips.find(t => t.id === currentTripId);
        if (!trip) return;

        loadingIndicator.style.display = 'block';
        submitButton.disabled = true;
        ui.clearDownloadLinks();

        const formData = new FormData(form);
        const sDate = new Date(trip.startDate);
        const eDate = new Date(trip.endDate);
        const duration = Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;

        const prompt = `
            **PROMPT DE ROTEIRO DE VIAGEM PERSONALIZADO**

            **Objetivo:** Crie um roteiro de viagem completo, realista e hiperpersonalizado com base nas informações abaixo. Gere um cronograma diário detalhado, inclua sugestões de restaurantes, atrações, e locais para experiências únicas. Sugira regiões ideais para hospedagem. Seja prático, objetivo e detalhado.

            **DADOS de ENTRADA DO VIAJANTE:**
            - **Destino da Viagem:** ${trip.destination}
            - **Datas:** De ${trip.startDate} a ${trip.endDate} (${duration} dias)
            - **Perfil do Grupo:** ${formData.get('travelCompany')}
            - **Orçamento Médio Diário (por pessoa, sem hospedagem):** ${formData.get('dailyBudget')}
            - **Estilo de Viagem:** ${formData.get('travelStyle')}
            - **Transporte:** ${formData.get('transport')}
            - **Interesses Principais:** ${formData.get('interests')}
            - **Atividades Obrigatórias:** ${formData.get('mustDo') || "Nenhuma especificada."}
            - **Restrições e o que Evitar:** ${formData.get('restrictions') || "Nenhuma especificada."}
            - **Ritmo da Viagem:** ${formData.get('pace')}
            - **Incluir Tempo para Descanso:** ${formData.get('restTime') ? 'Sim' : 'Não'}
            - **Nível de Detalhe do Cronograma:** ${formData.get('scheduleDetail')}
            - **Sugestões Desejadas:**
                - Restaurantes: ${formData.get('suggestRestaurants') ? 'Sim' : 'Não'}
                - Bairros para Hospedagem: ${formData.get('suggestHotels') ? 'Sim' : 'Não'}
                - Vida Noturna: ${formData.get('suggestNightlife') ? 'Sim' : 'Não'}
                - Compras: ${formData.get('suggestShopping') ? 'Sim' : 'Não'}

            **REQUISITOS DE SAÍDA (GERAR RESPOSTA EM JSON):**

            1.  Roteiro em Tabela: Crie um roteiro detalhado em formato de tabela Markdown. As colunas devem ser: "Dia", "Data", "Horário", "Atividade", "Sugestão de Refeição", "Detalhes/Localização".
            2.  Geolocalizações: Forneça uma string CSV para todos os locais mencionados (atrações, restaurantes). O formato deve ser "name,latitude,longitude,description".
            3.  Formato JSON: A resposta final deve ser exclusivamente um objeto JSON com duas chaves: itineraryTable (contendo a tabela Markdown como uma string) e geolocationsCsv (contendo a string CSV).
        `; // <-- ERRO ESTAVA AQUI, FALTA O FECHO DO PROMPT

        const aiResponse = await callGeminiAPI(prompt);
        const plan = JSON.parse(aiResponse);

        trip.itineraryTable = plan.itineraryTable || "### Ocorreu um erro ao gerar a tabela do itinerário.";
        trip.geolocationsCsv = plan.geolocationsCsv || "";

        await updateTrip(currentUser.uid, trip.id, {
            itineraryTable: trip.itineraryTable,
            geolocationsCsv: trip.geolocationsCsv
        });

        alert('Roteiro hiperpersonalizado gerado com sucesso!');
        ui.renderTabContent('itinerary', trip);
        if (trip.geolocationsCsv) {
            ui.createDownloadLink(trip.geolocationsCsv, `roteiro_${trip.name.replace(/\s+/g, '_')}.csv`);
        }

    } catch (error) {
        console.error("Erro ao gerar plano de viagem:", error);
        alert(`Não foi possível gerar o plano: ${error.message}`);
    } finally {
        loadingIndicator.style.display = 'none';
        submitButton.disabled = false;
    }
},

// E substitua a sua função onGoogleHotelsClick por esta:
onGoogleHotelsClick: () => {
    const trip = trips.find(t => t.id === currentTripId);
    if (trip) {
        // URL Corrigida
        const url = `https://www.google.com/travel/hotels/${encodeURIComponent(trip.destination)}`;
        window.open(url, '_blank');
    }
    },
    onGoogleFlightsClick: () => {
        const trip = trips.find(t => t.id === currentTripId);
        if (trip) {
            const url = `https://www.google.com/flights?q=Voos+para+${encodeURIComponent(trip.destination)}`;
            window.open(url, '_blank');
        }
    },
};
    ui.setupMainEventListener(mainActionHandlers);
    ui.setupModals(handleChatSubmit);
});