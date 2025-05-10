// DOM Elements
const currentEventElement = document.getElementById('current-event');
const upcomingEventsElement = document.getElementById('upcoming-events');
const serverTimeElement = document.getElementById('server-time');
const lastUpdatedElement = document.getElementById('last-updated');
const countdownTargetElement = document.getElementById('countdown-target');

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
            
            // Process events
            const now = new Date();
            const serverTime = new Date(now); // UTC for Global server
            
            // Find current event
            const currentEvent = data.events.find(event => {
                const start = new Date(event.start_date);
                const end = new Date(event.end_date);
                return serverTime >= start && serverTime <= end;
            });
            
            // Display current event
            if (currentEvent) {
                displayEvent(currentEvent, currentEventElement);
            } else {
                currentEventElement.innerHTML = '<p>No current event running</p>';
            }
            
            // Find upcoming events (sorted by start date)
            const upcomingEvents = data.events
                .filter(event => new Date(event.start_date) > serverTime)
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
            
            // Display upcoming events
            displayUpcomingEvents(upcomingEvents);
            
            // Set up countdown
            setupCountdown(upcomingEvents, currentEvent, serverTime);
            
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

// Display all upcoming events
function displayUpcomingEvents(events) {
    if (events.length > 0) {
        upcomingEventsElement.innerHTML = ''; // Clear loading message
        
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