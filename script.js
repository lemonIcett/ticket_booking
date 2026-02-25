class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

class LinkedList {
    constructor() {
        this.head = null;
        this.size = 0;
    }
    add(data) {
        const newNode = new Node(data);
        if (!this.head) {
            this.head = newNode;
        } else {
            let current = this.head;
            while (current.next) {
                current = current.next;
            }
            current.next = newNode;
        }
        this.size++;
        return data;
    }
    remove() {
        if (!this.head) return null;
        const data = this.head.data;
        this.head = this.head.next;
        this.size--;
        return data;
    }
    toArray() {
        const result = [];
        let current = this.head;
        while (current) {
            result.push(current.data);
            current = current.next;
        }
        return result;
    }
    isEmpty() {
        return this.size === 0;
    }
    clear() {
        this.head = null;
        this.size = 0;
    }
}

class Stack {
    constructor() {
        this.items = [];
    }
    push(item) {
        this.items.push(item);
    }
    pop() {
        if (this.isEmpty()) return null;
        return this.items.pop();
    }
    peek() {
        if (this.isEmpty()) return null;
        return this.items[this.items.length - 1];
    }
    isEmpty() {
        return this.items.length === 0;
    }
    size() {
        return this.items.length;
    }

    getItems() {
        return [...this.items].reverse();
    }
    clear() {
        this.items = [];
    }
}
class HashMap {
    constructor() {
        this.map = new Map();
    }
    put(key, value) {
        this.map.set(key, value);
    }
    get(key) {
        return this.map.get(key);
    }

    remove(key) {
        const value = this.map.get(key);
        this.map.delete(key);
        return value;
    }
    has(key) {
        return this.map.has(key);
    }

    values() {
        return Array.from(this.map.values());
    }
    entries() {
        return Array.from(this.map.entries());
    }
    size() {
        return this.map.size;
    }
    clear() {
        this.map.clear();
    }
}

class Passenger {
    constructor(id, name, age) {
        this.passengerId = id;
        this.name = name;
        this.age = age;
    }
}

class Ticket {
    constructor(ticketId, passenger, seatNumber, status = 'CONFIRMED') {
        this.ticketId = ticketId;
        this.passenger = passenger;
        this.seatNumber = seatNumber;
        this.status = status;
        this.bookingTime = new Date().toLocaleString();
    }
}

class Train {
    constructor(totalSeats = 20) {
        this.totalSeats = totalSeats;
        this.seats = new Array(totalSeats).fill(false);
        this.waitingList = new LinkedList();
    }

    findAvailableSeat() {
        for (let i = 0; i < this.seats.length; i++) {
            if (!this.seats[i]) return i + 1;
        }
        return -1;
    }

    bookSeat(seatNumber) {
        if (seatNumber >= 1 && seatNumber <= this.totalSeats && !this.seats[seatNumber - 1]) {
            this.seats[seatNumber - 1] = true;
            return true;
        }
        return false;
    }

    freeSeat(seatNumber) {
        if (seatNumber >= 1 && seatNumber <= this.totalSeats) {
            this.seats[seatNumber - 1] = false;
            return true;
        }
        return false;
    }

    isFull() {
        return this.seats.every(seat => seat === true);
    }

    getAvailableCount() {
        return this.seats.filter(seat => !seat).length;
    }

    getBookedCount() {
        return this.seats.filter(seat => seat).length;
    }

    addToWaitingList(passenger) {
        return this.waitingList.add(passenger);
    }

    processWaitingList() {
        if (!this.waitingList.isEmpty() && !this.isFull()) {
            return this.waitingList.remove();
        }
        return null;
    }
}

class BookingSystem {
    constructor() {
        this.train = new Train(20);
        this.bookings = new HashMap();
        this.cancelledStack = new Stack();
        this.nextTicketId = 1000;
        this.nextPassengerId = 1;
    }

    // Book a ticket
    bookTicket(passengerName, passengerAge) {
        const passenger = new Passenger(this.nextPassengerId++, passengerName, passengerAge);
        
        const seatNumber = this.train.findAvailableSeat();
        
        if (seatNumber !== -1) {
            this.train.bookSeat(seatNumber);
            const ticket = new Ticket(this.nextTicketId++, passenger, seatNumber, 'CONFIRMED');
            this.bookings.put(ticket.ticketId, ticket);
            return { success: true, ticket, message: `Ticket booked successfully! Seat: ${seatNumber}` };
        } else {
            this.train.addToWaitingList(passenger);
            const ticket = new Ticket(this.nextTicketId++, passenger, null, 'WAITING');
            this.bookings.put(ticket.ticketId, ticket);
            return { success: true, ticket, message: 'No seats available. Added to waiting list.', waiting: true };
        }
    }

    cancelTicket(ticketId) {
        const ticket = this.bookings.get(ticketId);
        
        if (!ticket) {
            return { success: false, message: 'Ticket not found!' };
        }

        this.cancelledStack.push({
            ticket: { ...ticket },
            passenger: { ...ticket.passenger }
        });

        if (ticket.status === 'CONFIRMED' && ticket.seatNumber) {
            this.train.freeSeat(ticket.seatNumber);
            const waitingPassenger = this.train.processWaitingList();
            if (waitingPassenger) {
                const newSeat = ticket.seatNumber;
                this.train.bookSeat(newSeat);
                for (const [tid, t] of this.bookings.entries()) {
                    if (t.status === 'WAITING' && t.passenger.passengerId === waitingPassenger.passengerId) {
                        t.status = 'CONFIRMED';
                        t.seatNumber = newSeat;
                        break;
                    }
                }
            }
        }

        this.bookings.remove(ticketId);
        
        return { success: true, message: 'Ticket cancelled successfully!' };
    }
    undoCancellation() {
        if (this.cancelledStack.isEmpty()) {
            return { success: false, message: 'No cancellations to undo!' };
        }

        const cancelled = this.cancelledStack.pop();
        const { ticket, passenger } = cancelled;

        const seatNumber = this.train.findAvailableSeat();
        
        if (seatNumber !== -1) {
            this.train.bookSeat(seatNumber);
            ticket.seatNumber = seatNumber;
            ticket.status = 'CONFIRMED';
        } else {
            ticket.seatNumber = null;
            ticket.status = 'WAITING';
            this.train.addToWaitingList(passenger);
        }
        this.bookings.put(ticket.ticketId, ticket);

        return { success: true, ticket, message: 'Cancellation undone successfully!' };
    }

    searchBooking(ticketId) {
        return this.bookings.get(ticketId);
    }

    getAllBookings() {
        return this.bookings.values();
    }

    // Get waiting list
    getWaitingList() {
        return this.train.waitingList.toArray();
    }

    // Get cancellation stack
    getCancellationStack() {
        return this.cancelledStack.getItems();
    }

    // Clear all data
    clearAll() {
        this.train = new Train(20);
        this.bookings = new HashMap();
        this.cancelledStack = new Stack();
        this.nextTicketId = 1000;
        this.nextPassengerId = 1;
    }

    // Export data for persistence
    exportData() {
        return {
            seats: this.train.seats,
            bookings: this.bookings.entries(),
            cancelledStack: this.cancelledStack.getItems(),
            nextTicketId: this.nextTicketId,
            nextPassengerId: this.nextPassengerId,
            waitingList: this.train.waitingList.toArray()
        };
    }

    // Import data from persistence
    importData(data) {
        if (data.seats) this.train.seats = data.seats;
        if (data.nextTicketId) this.nextTicketId = data.nextTicketId;
        if (data.nextPassengerId) this.nextPassengerId = data.nextPassengerId;
        
        if (data.bookings) {
            this.bookings = new HashMap();
            for (const [key, value] of data.bookings) {
                this.bookings.put(key, value);
            }
        }
        
        if (data.cancelledStack) {
            this.cancelledStack = new Stack();
            for (const item of data.cancelledStack.reverse()) {
                this.cancelledStack.push(item);
            }
        }
        
        if (data.waitingList) {
            this.train.waitingList = new LinkedList();
            for (const passenger of data.waitingList) {
                this.train.waitingList.add(passenger);
            }
        }
    }
}

// ===== GLOBAL INSTANCE =====
const bookingSystem = new BookingSystem();

// ===== UI FUNCTIONS =====

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    renderSeatGrid();
    updateStats();
    renderBookings();
    renderWaitingList();
    renderCancelStack();
    
    // Form submission
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);
});

// Handle booking form submission
function handleBooking(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('passengerName');
    const ageInput = document.getElementById('passengerAge');
    
    const name = nameInput.value.trim();
    const age = parseInt(ageInput.value);
    
    if (!name || !age) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    const result = bookingSystem.bookTicket(name, age);
    
    if (result.success) {
        showToast(result.message, 'success');
        nameInput.value = '';
        ageInput.value = '';
        
        renderSeatGrid();
        updateStats();
        renderBookings();
        renderWaitingList();
    } else {
        showToast(result.message, 'error');
    }
}

// Search booking
function searchBooking() {
    const ticketId = parseInt(document.getElementById('searchTicketId').value);
    
    if (!ticketId) {
        showToast('Please enter a ticket ID', 'warning');
        return;
    }
    
    const ticket = bookingSystem.searchBooking(ticketId);
    const modal = document.getElementById('searchModal');
    const content = document.getElementById('searchResultContent');
    
    if (ticket) {
        content.innerHTML = `
            <div class="result-card">
                <div class="result-row">
                    <span class="result-label">Ticket ID</span>
                    <span class="result-value">#${ticket.ticketId}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Passenger Name</span>
                    <span class="result-value">${ticket.passenger.name}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Age</span>
                    <span class="result-value">${ticket.passenger.age}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Seat Number</span>
                    <span class="result-value">${ticket.seatNumber || 'N/A'}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Status</span>
                    <span class="result-value">
                        <span class="status-badge ${ticket.status === 'CONFIRMED' ? 'status-confirmed' : 'status-waiting'}">
                            ${ticket.status}
                        </span>
                    </span>
                </div>
                <div class="result-row">
                    <span class="result-label">Booking Time</span>
                    <span class="result-value">${ticket.bookingTime}</span>
                </div>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="not-found">
                <i class="fas fa-search"></i>
                <h4>Ticket Not Found</h4>
                <p>No booking found with ID #${ticketId}</p>
            </div>
        `;
    }
    
    modal.classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('searchModal').classList.remove('active');
}

// Cancel ticket
function cancelTicket() {
    const ticketId = parseInt(document.getElementById('cancelTicketId').value);
    
    if (!ticketId) {
        showToast('Please enter a ticket ID', 'warning');
        return;
    }
    
    const result = bookingSystem.cancelTicket(ticketId);
    
    if (result.success) {
        showToast(result.message, 'success');
        document.getElementById('cancelTicketId').value = '';
        
        renderSeatGrid();
        updateStats();
        renderBookings();
        renderWaitingList();
        renderCancelStack();
        updateUndoButton();
    } else {
        showToast(result.message, 'error');
    }
}

// Cancel ticket from table
function cancelTicketFromTable(ticketId) {
    const result = bookingSystem.cancelTicket(ticketId);
    
    if (result.success) {
        showToast(result.message, 'success');
        renderSeatGrid();
        updateStats();
        renderBookings();
        renderWaitingList();
        renderCancelStack();
        updateUndoButton();
    } else {
        showToast(result.message, 'error');
    }
}

// Undo cancellation
function undoCancellation() {
    const result = bookingSystem.undoCancellation();
    
    if (result.success) {
        showToast(result.message, 'success');
        renderSeatGrid();
        updateStats();
        renderBookings();
        renderWaitingList();
        renderCancelStack();
        updateUndoButton();
    } else {
        showToast(result.message, 'error');
    }
}

// Update undo button state
function updateUndoButton() {
    const undoBtn = document.getElementById('undoBtn');
    const stackCount = document.getElementById('stackCount');
    const stack = bookingSystem.getCancellationStack();
    
    undoBtn.disabled = stack.length === 0;
    stackCount.textContent = stack.length;
}

// Save data to localStorage (File I/O simulation)
function saveToFile() {
    try {
        const data = bookingSystem.exportData();
        localStorage.setItem('trainBookingData', JSON.stringify(data));
        showToast('Data saved successfully!', 'success');
    } catch (error) {
        showToast('Error saving data!', 'error');
    }
}

// Load data from localStorage (File I/O simulation)
function loadFromFile() {
    try {
        const savedData = localStorage.getItem('trainBookingData');
        if (savedData) {
            const data = JSON.parse(savedData);
            bookingSystem.importData(data);
            
            renderSeatGrid();
            updateStats();
            renderBookings();
            renderWaitingList();
            renderCancelStack();
            updateUndoButton();
            
            showToast('Data loaded successfully!', 'success');
        } else {
            showToast('No saved data found!', 'warning');
        }
    } catch (error) {
        showToast('Error loading data!', 'error');
    }
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data?')) {
        bookingSystem.clearAll();
        localStorage.removeItem('trainBookingData');
        
        renderSeatGrid();
        updateStats();
        renderBookings();
        renderWaitingList();
        renderCancelStack();
        updateUndoButton();
        
        showToast('All data cleared!', 'success');
    }
}

// ===== RENDER FUNCTIONS =====

// Render seat grid
function renderSeatGrid() {
    const grid = document.getElementById('seatGrid');
    grid.innerHTML = '';
    
    for (let i = 1; i <= bookingSystem.train.totalSeats; i++) {
        const isBooked = bookingSystem.train.seats[i - 1];
        const seat = document.createElement('div');
        seat.className = `seat ${isBooked ? 'booked' : 'available'}`;
        seat.innerHTML = `
            <i class="fas fa-chair"></i>
            <span class="seat-number">${i}</span>
        `;
        seat.title = isBooked ? 'Booked' : 'Available';
        grid.appendChild(seat);
    }
}

// Update statistics
function updateStats() {
    document.getElementById('availableSeats').textContent = bookingSystem.train.getAvailableCount();
    document.getElementById('bookedSeats').textContent = bookingSystem.train.getBookedCount();
    document.getElementById('totalSeats').textContent = bookingSystem.train.totalSeats;
}

// Render bookings table
function renderBookings() {
    const tbody = document.getElementById('bookingsTableBody');
    const bookings = bookingSystem.getAllBookings();
    
    document.getElementById('bookingCount').textContent = bookings.length;
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No bookings yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = bookings.map(ticket => `
        <tr>
            <td><strong>#${ticket.ticketId}</strong></td>
            <td>${ticket.passenger.name}</td>
            <td>${ticket.passenger.age}</td>
            <td>${ticket.seatNumber || '-'}</td>
            <td>
                <span class="status-badge ${ticket.status === 'CONFIRMED' ? 'status-confirmed' : 'status-waiting'}">
                    ${ticket.status}
                </span>
            </td>
            <td>
                <button class="btn btn-danger btn-small" onclick="cancelTicketFromTable(${ticket.ticketId})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Render waiting list visualization
function renderWaitingList() {
    const container = document.getElementById('waitingListViz');
    const waitingList = bookingSystem.getWaitingList();
    
    document.getElementById('waitingCount').textContent = waitingList.length;
    
    if (waitingList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No passengers in waiting list</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = waitingList.map((passenger, index) => `
        <div class="node">
            <div class="node-data">
                <span class="node-name">${passenger.name}</span>
                <span class="node-id">ID: ${passenger.passengerId}</span>
            </div>
        </div>
        ${index < waitingList.length - 1 ? '<i class="fas fa-arrow-right node-arrow"></i>' : ''}
    `).join('');
}

// Render cancellation stack visualization
function renderCancelStack() {
    const container = document.getElementById('cancelStackViz');
    const stack = bookingSystem.getCancellationStack();
    
    document.getElementById('cancelStackCount').textContent = stack.length;
    updateUndoButton();
    
    if (stack.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Stack is empty</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = stack.map((item, index) => `
        <div class="stack-item">
            <div class="stack-item-info">
                <span class="stack-item-title">Ticket #${item.ticket.ticketId}</span>
                <span class="stack-item-subtitle">${item.ticket.passenger.name}</span>
            </div>
            <span class="badge">${index === 0 ? 'TOP' : ''}</span>
        </div>
    `).join('');
}

// ===== TOAST NOTIFICATIONS =====

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info'
    };
    
    toast.innerHTML = `
        <i class="fas fa-${icons[type]}"></i>
        <div class="toast-content">
            <div class="toast-title">${titles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Close modal on outside click
document.getElementById('searchModal').addEventListener('click', (e) => {
    if (e.target.id === 'searchModal') {
        closeModal();
    }
});
