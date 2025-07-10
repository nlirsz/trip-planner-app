
// Importa as configurações e o app inicializado do Firebase, e a chave do Gemini
import { geminiApiKey } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    let trips = JSON.parse(localStorage.getItem('trips')) || [];
    let currentTripId = null;

    const mainTitle = document.getElementById('main-title');
    const tripContext = document.getElementById('trip-context');
    const addTripButton = document.getElementById('add-trip-button');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const dayDetailModal = document.getElementById('day-detail-modal');
    const modalCloseButton = dayDetailModal.querySelector('.modal-close-button'); // Certifique-se de que este elemento existe no HTML

    // Modal de adicionar viagem
    const addTripModal = document.getElementById('add-trip-modal');
    const closeAddTripModalButton = document.getElementById('close-add-trip-modal');
    const addTripForm = document.getElementById('add-trip-form');
    const tripNameInput = document.getElementById('trip-name-input');
    const tripDestinationInput = document.getElementById('trip-destination-input');


    function saveData() {
        localStorage.setItem('trips', JSON.stringify(trips));
    }

    async function callGeminiAPI(prompt) {
        const apiKey = geminiApiKey;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            const errorMessage = errorBody.error?.message || `API Error: ${response.statusText}`;
            console.error("Erro ao chamar a API do Gemini:", errorMessage);
            throw new Error(`Falha na comunicação com a IA: ${errorMessage}`);
        }

        const result = await response.json();

        if (!result.candidates || result.candidates.length === 0) {
            console.error("Resposta da IA inválida:", result);
            throw new Error("A IA não retornou uma resposta válida. A requisição pode ter sido bloqueada.");
        }

        try {
            return result.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("Erro ao extrair texto da resposta da IA:", error);
            throw new Error("Não foi possível processar a resposta da IA.");
        }
    }
    
    function renderTripDashboard() {
        const tripGrid = document.getElementById('trip-grid');
        tripGrid.innerHTML = '';
        if (trips.length === 0) {
            tripGrid.nextElementSibling.style.display = 'block';
        } else {
            tripGrid.nextElementSibling.style.display = 'none';
            trips.forEach(trip => {
                const cardTemplate = document.getElementById('trip-card-template');
                const cardNode = cardTemplate.content.cloneNode(true);
                cardNode.querySelector('.country-name').textContent = trip.name;
                cardNode.querySelector('.card-image').src = `https://placehold.co/600x400/1c1c1f/ffffff?text=${trip.destination}`;
                const manageButton = cardNode.querySelector('.manage-button');
                manageButton.dataset.tripId = trip.id;
                manageButton.addEventListener('click', () => selectTrip(trip.id));
                tripGrid.appendChild(cardNode);
            });
        }
    }

    function renderTabContent(tabName) {
        const trip = trips.find(t => t.id === currentTripId);
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
            if(calendarContainer && trip.itinerary) {
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
    
    function showTab(tabId) {
        tabContents.forEach(tab => tab.classList.toggle('active', tab.id === `${tabId}-tab`));
        navItems.forEach(item => item.classList.toggle('active', item.dataset.tab === tabId));
        
        if(tabId === 'trips') {
            mainTitle.textContent = "Minhas Viagens";
            tripContext.style.display = 'none';
            addTripButton.style.display = 'flex';
        } else {
            const trip = trips.find(t => t.id === currentTripId);
            if (trip) {
                mainTitle.textContent = trip.name;
                tripContext.textContent = trip.destination;
                tripContext.style.display = 'block';
            }
            addTripButton.style.display = 'none';
            renderTabContent(tabId);
        }
    }

    function selectTrip(tripId) {
        currentTripId = tripId;
        navItems.forEach(item => item.classList.remove('disabled'));
        // Mostra a primeira aba após criar a viagem (exemplo: itinerary)
        showTab('itinerary');
    }
    
    function deselectTrip() {
        currentTripId = null;
        navItems.forEach(item => {
            if(item.dataset.tab !== 'trips') item.classList.add('disabled');
        });
        showTab('trips');
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

    modalCloseButton.addEventListener('click', () => dayDetailModal.classList.remove('active'));
    dayDetailModal.addEventListener('click', (e) => {
        if(e.target === dayDetailModal) dayDetailModal.classList.remove('active');
    });


    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('disabled')) return;
            if (item.dataset.tab === 'trips') {
                deselectTrip();
            } else {
                showTab(item.dataset.tab);
            }
        });
    });
    
    addTripButton.addEventListener('click', () => {
        console.log('Botão Adicionar Viagem clicado!');
        addTripModal.classList.add('active');
        tripNameInput.value = '';
        tripDestinationInput.value = '';
    });

    // Fechar modal ao clicar no X ou fora do conteúdo
    closeAddTripModalButton.addEventListener('click', () => {
        addTripModal.classList.remove('active');
    });
    addTripModal.addEventListener('click', (e) => {
        if (e.target === addTripModal) {
            addTripModal.classList.remove('active');
        }
    });

    // Lógica do formulário do modal
    addTripForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('trip-name-input').value.trim();
        const destination = document.getElementById('trip-destination-input').value.trim();
        if (name && destination) {
            trips.push({
                id: Date.now(), name, destination,
                flights: [], accommodations: [], itinerary: [], packing: [], expenses: []
            });
            selectTrip(trips[trips.length - 1].id);
            saveData();
            renderTripDashboard(); // Atualiza o dashboard após adicionar a viagem
            addTripModal.classList.remove('active');
        }
    });

    document.querySelector('main').addEventListener('submit', async (e) => {
        const form = e.target;
        if(form.classList.contains('add-item-form')) {
            e.preventDefault();
            const type = form.dataset.type;
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip) return;

            const formData = new FormData(form);
            const newItem = {};
            formData.forEach((value, key) => newItem[key] = value);
            
            if (!trip[type]) trip[type] = [];
            trip[type].push(newItem);
            
            saveData();
            renderTabContent(type);
            form.reset();
        } else if (form.id === 'ai-planner-form') {
            e.preventDefault();
            const loadingIndicator = form.querySelector('.loading-indicator');
            const submitButton = form.querySelector('button');

            try {
                const trip = trips.find(t => t.id === currentTripId);
                if (!trip) return;

                loadingIndicator.style.display = 'block';
                submitButton.disabled = true;

                const formData = new FormData(form);
                const duration = formData.get('duration');
                const style = formData.get('style');
                const interests = formData.get('interests');
                const extraInfo = formData.get('extraInfo');

                const prompt = `
                    Crie um plano de viagem para ${trip.destination} com duração de ${duration} dias.
                    O estilo da viagem é: ${style}.
                    Meus principais interesses são: ${interests}.
                    Informações adicionais: ${extraInfo}.

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
                saveData();
                alert('Plano de viagem gerado com sucesso! Verifique as abas correspondentes.');
                showTab('itinerary');
            } catch (error) {
                console.error("Erro ao gerar plano de viagem:", error);
                alert(`Não foi possível gerar o plano: ${error.message}`);
            } finally {
                loadingIndicator.style.display = 'none';
                submitButton.disabled = false;
            }
        }
    });

    document.querySelector('main').addEventListener('click', (e) => {
        const trip = trips.find(t => t.id === currentTripId);
        if (!trip) return;

        if (e.target.classList.contains('google-flights-button')) {
            const url = `https://www.google.com/flights?q=Voos+para+${encodeURIComponent(trip.destination)}`;
            window.open(url, '_blank');
        }
        if (e.target.classList.contains('google-hotels-button')) {
            const url = `https://www.google.com/travel/hotels/${encodeURIComponent(trip.destination)}`;
            window.open(url, '_blank');
        }
    });

    // Inicialização
    deselectTrip();
    renderTripDashboard();
});
