package user

import "time"

type User struct {
	ID        int64    `json:"id"`
	Email     string   `json:"email" binding:"required,email"`
	FirstName string   `json:"first_name" binding:"required"`
	LastName  string   `json:"last_name" binding:"required"`
	Domain    []string `json:"domain"`
}

type Response struct {
	*User
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateRequest struct {
	User     *User  `json:"user" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

type UpdateRequest struct {
	User *User `json:"user" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string    `json:"token"`
	User  *Response `json:"user"`
}

type ListRequest struct {
	Limit     int    `form:"limit" json:"limit"`
	Offset    int    `form:"offset" json:"offset"`
	Email     string `form:"email" json:"email"`
	FirstName string `form:"first_name" json:"first_name"`
	LastName  string `form:"last_name" json:"last_name"`
}

type ListResponse struct {
	Users []*Response `json:"users"`
	Total int64       `json:"total"`
}
