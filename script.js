// Importa as funções necessárias dos SDKs do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from './config.js';
import { GEMINI_API_KEY } from './config.js';

        // Inicializa o Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // =================================================================
        // LÓGICA DO APLICATIVO
        // =================================================================
        
        let trips = [];
        let currentTripId = null;

        const mainTitle = document.getElementById('main-title');
        const tripContext = document.getElementById('trip-context');
        const addTripButton = document.getElementById('add-trip-button');
        const navItems = document.querySelectorAll('.nav-item');
        const tabContents = document.querySelectorAll('.tab-content');
        const dayDetailModal = document.getElementById('day-detail-modal');
        const modalCloseButton = dayDetailModal.querySelector('.modal-close-button');

        // Função para buscar todas as viagens do Firestore
        async function fetchTrips() {
            const querySnapshot = await getDocs(collection(db, "trips"));
            trips = [];
            querySnapshot.forEach((doc) => {
                trips.push({ id: doc.id, ...doc.data() });
            });
            renderTripDashboard();
        }

                async function callGeminiAPI(prompt) {
            // Usa a chave do ficheiro config.js
            const apiKey = GEMINI_API_KEY;
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            // ... resto da função da API ...
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
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
        
        addTripButton.addEventListener('click', async () => {
            const name = prompt("Qual o nome da viagem?");
            const destination = prompt("Qual o destino?");
            if (name && destination) {
                const newTrip = { 
                    name, destination, 
                    flights: [], accommodations: [], itinerary: [], packing: [], expenses: [] 
                };
                const docRef = await addDoc(collection(db, "trips"), newTrip);
                trips.push({ id: docRef.id, ...newTrip });
                renderTripDashboard();
            }
        });

        document.querySelector('main').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip) return;

            if(form.classList.contains('add-item-form')) {
                const type = form.dataset.type;
                const formData = new FormData(form);
                const newItem = {};
                formData.forEach((value, key) => newItem[key] = value);
                
                if (!trip[type]) trip[type] = [];
                trip[type].push(newItem);
                
                const tripRef = doc(db, "trips", trip.id);
                await updateDoc(tripRef, { [type]: trip[type] });

                renderTabContent(type);
                form.reset();
            } else if (form.id === 'ai-planner-form') {
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
                    
                    const tripRef = doc(db, "trips", trip.id);
                    await updateDoc(tripRef, {
                        itinerary: trip.itinerary,
                        accommodations: trip.accommodations,
                        packing: trip.packing
                    });
                    
                    alert('Plano de viagem gerado com sucesso! Verifique as abas correspondentes.');
                    showTab('itinerary');

                } catch (err) {
                    console.error("Erro ao processar JSON da IA:", err);
                    alert("Não foi possível processar o plano da IA. Tente novamente.");
                }
                
                loadingIndicator.style.display = 'none';
                form.querySelector('button').disabled = false;
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
    fetchTrips();