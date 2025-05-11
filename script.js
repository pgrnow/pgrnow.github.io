// PGRNow - Punishing: Gray Raven Global Tracker
// Complete JavaScript with proper year handling for current vs past events

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const currentEventElement = document.getElementById('current-event');
    const upcomingEventsElement = document.getElementById('upcoming-events');
    const pastEventsContainer = document.getElementById('past-events-container');
    const serverTimeElement = document.getElementById('server-time');
    const lastUpdatedElement = document.getElementById('last-updated');
    const countdownTargetElement = document.getElementById('countdown-target');
    const togglePastEventsButton = document.getElementById('toggle-past-events');

    // Initialize the tracker
    initTracker();

    // Toggle past events visibility
    togglePastEventsButton.addEventListener('click', function() {
        pastEventsContainer.classList.toggle('hidden');
        const isHidden = pastEventsContainer.classList.contains('hidden');
        this.querySelector('span').textContent = isHidden ? 'Show Past Events' : 'Hide Past Events';
        this.classList.toggle('active');
    });

    async function initTracker() {
        try {
            // Load and process event data
            const data = await loadEventData();
            const serverTime = new Date(); // UTC time
            const currentYear = serverTime.getUTCFullYear();
            
            // Categorize events with proper year handling
            const categorizedEvents = categorizeEvents(data.events, serverTime, currentYear);
            
            // Update UI
            updateLastUpdated(data.last_updated);
            displayEvents(categorizedEvents);
            setupCountdown(categorizedEvents, serverTime);
            
            // Start server time updates
            updateServerTime();
            setInterval(updateServerTime, 1000);
            
        } catch (error) {
            handleDataError(error);
        }
    }

    async function loadEventData() {
        const response = await fetch('assets/data.json');
        if (!response.ok) {
            throw new Error('Failed to load event data');
        }
        return await response.json();
    }

    function categorizeEvents(events, serverTime, currentYear) {
        const result = {
            past: [],
            current: null,
            upcoming: []
        };

        events.forEach(event => {
            const startDate = new Date(event.start_date);
            const endDate = new Date(event.end_date);
            const eventYear = startDate.getUTCFullYear();
            
            // Check if event is from current year
            if (eventYear === currentYear) {
                if (serverTime > endDate) {
                    result.past.push(event);
                } else if (serverTime >= startDate) {
                    result.current = event;
                } else {
                    result.upcoming.push(event);
                }
            } 
            // Event from previous years always goes to past
            else if (eventYear < currentYear) {
                result.past.push(event);
            }
            // Event from future years goes to upcoming
            else {
                result.upcoming.push(event);
            }
        });

        // Sort past events (newest first)
        result.past.sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
        
        // Sort upcoming events (soonest first)
        result.upcoming.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        
        return result;
    }

    function displayEvents(events) {
        displayCurrentEvent(events.current);
        displayUpcomingEvents(events.upcoming);
        displayPastEvents(events.past);
    }

    function displayCurrentEvent(event) {
        if (event) {
            currentEventElement.innerHTML = createEventHTML(event);
        } else {
            currentEventElement.innerHTML = '<p>No current event running</p>';
        }
    }

    function displayUpcomingEvents(events) {
        if (events.length > 0) {
            upcomingEventsElement.innerHTML = '';
            events.forEach((event, index) => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event-card';
                eventElement.style.animationDelay = `${index * 0.1}s`;
                eventElement.innerHTML = createEventHTML(event);
                upcomingEventsElement.appendChild(eventElement);
            });
        } else {
            upcomingEventsElement.innerHTML = '<p>No upcoming events scheduled</p>';
        }
    }

    function displayPastEvents(events) {
        if (events.length > 0) {
            pastEventsContainer.innerHTML = events.map(event => `
                <div class="event-card past-event-card">
                    ${createEventHTML(event)}
                </div>
            `).join('');
        } else {
            pastEventsContainer.innerHTML = '<p>No past events recorded</p>';
        }
    }

    function createEventHTML(event) {
        return `
            <h3>${event.name}</h3>
            <p class="event-date"><i class="far fa-calendar-alt"></i> ${formatDateTime(new Date(event.start_date))} - ${formatDateTime(new Date(event.end_date))}</p>
            ${event.banner_image ? `<img src="${event.banner_image}" alt="${event.name}" class="event-banner" loading="lazy">` : ''}
            <p>${event.description}</p>
            ${event.notes ? `<div class="event-notes"><strong>Notes:</strong> ${event.notes}</div>` : ''}
        `;
    }

    function setupCountdown(events, serverTime) {
        let targetDate = null;
        let targetName = 'No upcoming events';
        
        // Check current event ending soon (within 7 days)
        if (events.current) {
            const endDate = new Date(events.current.end_date);
            if ((endDate - serverTime) < (7 * 24 * 60 * 60 * 1000)) {
                targetDate = endDate;
                targetName = `End of ${events.current.name}`;
            }
        }
        
        // If no current event ending soon, use next upcoming event
        if (!targetDate && events.upcoming.length > 0) {
            targetDate = new Date(events.upcoming[0].start_date);
            targetName = events.upcoming[0].name;
        }
        
        // Update UI and start countdown if we have a target
        if (targetDate) {
            countdownTargetElement.textContent = `Counting down to: ${targetName}`;
            startCountdown(targetDate);
        } else {
            document.getElementById('main-countdown').style.display = 'none';
            countdownTargetElement.textContent = targetName;
        }
    }

    function startCountdown(targetDate) {
        const countdownElements = {
            days: document.getElementById('countdown-days'),
            hours: document.getElementById('countdown-hours'),
            minutes: document.getElementById('countdown-minutes'),
            seconds: document.getElementById('countdown-seconds')
        };
        
        function update() {
            const now = new Date();
            const diff = targetDate - now;
            
            if (diff <= 0) {
                clearInterval(interval);
                location.reload();
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            countdownElements.days.textContent = days.toString().padStart(2, '0');
            countdownElements.hours.textContent = hours.toString().padStart(2, '0');
            countdownElements.minutes.textContent = minutes.toString().padStart(2, '0');
            countdownElements.seconds.textContent = seconds.toString().padStart(2, '0');
        }
        
        update();
        const interval = setInterval(update, 1000);
    }

    function updateServerTime() {
        const now = new Date();
        serverTimeElement.textContent = now.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'UTC'
        }) + " (UTC)";
    }

    function updateLastUpdated(timestamp) {
        lastUpdatedElement.textContent = formatDateTime(new Date(timestamp));
    }

    function formatDateTime(date) {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });
    }

    function handleDataError(error) {
        console.error('Error:', error);
        currentEventElement.innerHTML = `
            <div class="error">
                <p>Error loading event data</p>
                <p>${error.message}</p>
            </div>
        `;
    }
});