document.addEventListener('DOMContentLoaded', () => {
    let trips = JSON.parse(localStorage.getItem('trips')) || [];
    let currentTripId = null;

    const mainTitle = document.getElementById('main-title');
    const tripContext = document.getElementById('trip-context');
    const addTripButton = document.getElementById('add-trip-button');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const dayDetailModal = document.getElementById('day-detail-modal');
    const modalCloseButton = dayDetailModal.querySelector('.modal-close-button');

    function saveData() {
        localStorage.setItem('trips', JSON.stringify(trips));
    }

    async function callGeminiAPI(prompt) {
        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const result = await response.json();
            return result.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("Erro ao chamar a API do Gemini:", error);
            return "Desculpe, não consegui conectar com a IA no momento.";
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
        showTab('ai-planner'); 
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
        const name = prompt("Qual o nome da viagem?");
        const destination = prompt("Qual o destino?");
        if (name && destination) {
            trips.push({ 
                id: Date.now(), name, destination, 
                flights: [], accommodations: [], itinerary: [], packing: [], expenses: []
            });
            saveData();
            renderTripDashboard();
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
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip) return;
            
            const loadingIndicator = form.querySelector('.loading-indicator');
            loadingIndicator.style.display = 'block';
            form.querySelector('button').disabled = true;

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
            
            try {
                const plan = JSON.parse(aiResponse);
                trip.itinerary = plan.itinerary || [];
                trip.accommodations = plan.accommodations || [];
                trip.packing = plan.packing || [];
            } catch (err) {
                console.error("Erro ao processar JSON da IA:", err);
                alert("Não foi possível processar o plano da IA. Tente novamente.");
            }
            
            saveData();
            alert('Plano de viagem gerado com sucesso! Verifique as abas correspondentes.');
            loadingIndicator.style.display = 'none';
            form.querySelector('button').disabled = false;
            showTab('itinerary');
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
