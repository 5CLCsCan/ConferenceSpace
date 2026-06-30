package dto

type UsageEventCreateRequest struct {
	SessionID  string                 `json:"session_id" binding:"required"`
	Role       string                 `json:"role,omitempty"`
	EventName  string                 `json:"event_name" binding:"required"`
	PagePath   string                 `json:"page_path,omitempty"`
	EntityType string                 `json:"entity_type,omitempty"`
	EntityID   string                 `json:"entity_id,omitempty"`
	Success    *bool                  `json:"success,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

type UsageEventBatchCreateRequest struct {
	Events []UsageEventCreateRequest `json:"events" binding:"required,min=1,dive"`
}

type UsageEventBatchCreateResponse struct {
	Inserted int `json:"inserted"`
}
