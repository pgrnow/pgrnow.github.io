// DOM Elements
const currentEventElement = document.getElementById('current-event');
const upcomingEventsElement = document.getElementById('upcoming-events');
const serverTimeElement = document.getElementById('server-time');
const lastUpdatedElement = document.getElementById('last-updated');
const countdownTargetElement = document.getElementById('countdown-target');
const togglePastEventsButton = document.getElementById('toggle-past-events');
const pastEventsContainer = document.getElementById('past-events-container');

// Load event data
document.addEventListener('DOMContentLoaded', function() {
    // Load data from JSON file
    fetch('assets/data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update last updated time
            lastUpdatedElement.textContent = formatDateTime(new Date(data.last_updated));
            
            // Get current server time (UTC)
            const now = new Date();
            const serverTime = new Date(now); // UTC for Global server
            
            // Categorize events
            const events = {
                past: [],
                current: null,
                upcoming: []
            };
            
            // Process each event
            data.events.forEach(event => {
                const startDate = new Date(event.start_date);
                const endDate = new Date(event.end_date);
                
                if (serverTime > endDate) {
                    // Past event
                    events.past.push(event);
                } else if (serverTime >= startDate && serverTime <= endDate) {
                    // Current event
                    events.current = event;
                } else {
                    // Upcoming event
                    events.upcoming.push(event);
                }
            });
            
            // Sort past events (newest first)
            events.past.sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
            
            // Sort upcoming events (soonest first)
            events.upcoming.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
            
            // Display events
            displayCurrentEvent(events.current);
            displayUpcomingEvents(events.upcoming);
            displayPastEvents(events.past);
            
            // Set up countdown
            setupCountdown(events.upcoming, events.current, serverTime);
            
            // Update server time continuously
            updateServerTime();
            setInterval(updateServerTime, 1000);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            currentEventElement.innerHTML = `
                <p class="error">Error loading event data</p>
                <p class="error">${error.message}</p>
            `;
        });
});

// Display an event in the specified element
function displayEvent(event, element) {
    const elementToUpdate = typeof element === 'string' ? document.getElementById(element) : element;
    
    let html = `
        <h3>${event.name}</h3>
        <p class="event-date"><i class="far fa-calendar-alt"></i> ${formatDateTime(new Date(event.start_date))} - ${formatDateTime(new Date(event.end_date))}</p>
        <p>${event.description}</p>
    `;
    
    if (event.banner_image) {
        html += `<img src="${event.banner_image}" alt="${event.name}" class="event-banner" loading="lazy">`;
    }
    
    if (event.notes) {
        html += `<div class="event-notes"><strong>Notes:</strong> ${event.notes}</div>`;
    }
    
    elementToUpdate.innerHTML = html;
}

// Display current event
function displayCurrentEvent(event) {
    if (event) {
        displayEvent(event, currentEventElement);
    } else {
        currentEventElement.innerHTML = '<p>No current event running</p>';
    }
}

// Display upcoming events
function displayUpcomingEvents(events) {
    if (events.length > 0) {
        upcomingEventsElement.innerHTML = '';
        
        events.forEach((event, index) => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event-card';
            eventElement.style.animationDelay = `${index * 0.1}s`;
            upcomingEventsElement.appendChild(eventElement);
            displayEvent(event, eventElement);
        });
    } else {
        upcomingEventsElement.innerHTML = '<p>No upcoming events scheduled</p>';
    }
}

// display most recent past events
function displayPastEvents(events) {
    if (events.length > 0) {
        const pastEventsHTML = events.map(event => `
            <div class="event-card past-event-card">
                <h3>${event.name}</h3>
                <p class="event-date"><i class="far fa-calendar-alt"></i> ${formatDateTime(new Date(event.start_date))} - ${formatDateTime(new Date(event.end_date))}</p>
                ${event.banner_image ? `<img src="${event.banner_image}" alt="${event.name}" class="event-banner" loading="lazy">` : ''}
                <p>${event.description}</p>
                ${event.notes ? `<div class="event-notes"><strong>Notes:</strong> ${event.notes}</div>` : ''}
            </div>
        `).join('');
        
        pastEventsContainer.innerHTML = pastEventsHTML;
    } else {
        pastEventsContainer.innerHTML = '<p>No past events recorded</p>';
    }
}

// toggle past events display
togglePastEventsButton.addEventListener('click', function() {
    pastEventsContainer.classList.toggle('hidden');
    const isHidden = pastEventsContainer.classList.contains('hidden');
    
    this.querySelector('span').textContent = isHidden ? 'Show Past Events' : 'Hide Past Events';
    this.classList.toggle('active');
});

// Set up the countdown timer
function setupCountdown(upcomingEvents, currentEvent, serverTime) {
    let targetDate, targetName;
    
    if (upcomingEvents.length > 0) {
        // Countdown to next upcoming event
        targetDate = new Date(upcomingEvents[0].start_date);
        targetName = upcomingEvents[0].name;
    } else if (currentEvent) {
        // Countdown to current event ending
        targetDate = new Date(currentEvent.end_date);
        targetName = `End of ${currentEvent.name}`;
    } else {
        // No events to countdown to
        document.getElementById('main-countdown').style.display = 'none';
        countdownTargetElement.textContent = 'No upcoming events scheduled';
        return;
    }
    
    countdownTargetElement.textContent = `Counting down to: ${targetName}`;
    startCountdown(targetDate);
}

// Start the countdown timer
function startCountdown(targetDate) {
    function updateCountdown() {
        const now = new Date();
        const serverTime = new Date(now); // UTC
        const diff = targetDate - serverTime;
        
        if (diff <= 0) {
            clearInterval(countdownInterval);
            location.reload(); // Refresh to show new events
            return;
        }
        
        updateCountdownDisplay(diff);
    }
    
    function updateCountdownDisplay(diff) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('countdown-days').textContent = days.toString().padStart(2, '0');
        document.getElementById('countdown-hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('countdown-minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('countdown-seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
}

// Format date for display
function formatDateTime(date) {
    const options = {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
    };
    
    return date.toLocaleString('en-US', options);
}

// Update server time display
function updateServerTime() {
    const now = new Date();
    const serverTime = new Date(now); // UTC
    
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC'
    };
    
    serverTimeElement.textContent = serverTime.toLocaleString('en-US', options) + " (UTC)";
}