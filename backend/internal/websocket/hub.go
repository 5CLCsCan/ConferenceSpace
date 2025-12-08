package websocket

import (
	"encoding/json"
	"sync"

	"github.com/dcao/conferencespace/internal/dto"
)

// Hub maintains the set of active clients and broadcasts messages to clients
type Hub struct {
	// Registered clients by user email
	clients map[string]map[*Client]bool

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Broadcast notification to specific user
	broadcast chan *UserMessage

	// Mutex for thread-safe access to clients map
	mu sync.RWMutex
}

// UserMessage represents a message to be sent to a specific user
type UserMessage struct {
	UserEmail string
	Message   []byte
}

// NotificationMessage represents a notification message sent via WebSocket
type NotificationMessage struct {
	Type    string           `json:"type"`
	Payload *dto.Notification `json:"payload"`
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *UserMessage, 256),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.clients[client.userEmail] == nil {
				h.clients[client.userEmail] = make(map[*Client]bool)
			}
			h.clients[client.userEmail][client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.userEmail]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.send)
					if len(clients) == 0 {
						delete(h.clients, client.userEmail)
					}
				}
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			if clients, ok := h.clients[message.UserEmail]; ok {
				for client := range clients {
					select {
					case client.send <- message.Message:
					default:
						// Client's send buffer is full, close the connection
						close(client.send)
						delete(clients, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastToUser sends a notification to a specific user
func (h *Hub) BroadcastToUser(userEmail string, notification *dto.Notification) error {
	msg := NotificationMessage{
		Type:    "notification",
		Payload: notification,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	h.broadcast <- &UserMessage{
		UserEmail: userEmail,
		Message:   data,
	}

	return nil
}

// IsUserConnected checks if a user has any active WebSocket connections
func (h *Hub) IsUserConnected(userEmail string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	clients, ok := h.clients[userEmail]
	return ok && len(clients) > 0
}

// GetConnectedUsersCount returns the number of unique connected users
func (h *Hub) GetConnectedUsersCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// GetTotalConnectionsCount returns the total number of connections
func (h *Hub) GetTotalConnectionsCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	count := 0
	for _, clients := range h.clients {
		count += len(clients)
	}
	return count
}

