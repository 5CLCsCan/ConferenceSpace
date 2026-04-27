package user

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
)

type mockUserStorage struct {
	getByEmailFn func(ctx context.Context, email string) (*dto.UserResponse, error)
	createFn     func(ctx context.Context, user *dto.User, hashedPassword string, emailVerified bool) (*dto.UserResponse, error)
}

func (m *mockUserStorage) Create(ctx context.Context, user *dto.User, hashedPassword string, emailVerified bool) (*dto.UserResponse, error) {
	return m.createFn(ctx, user, hashedPassword, emailVerified)
}

func (m *mockUserStorage) GetByID(ctx context.Context, id int64) (*dto.UserResponse, error) {
	return nil, errors.New("not implemented")
}

func (m *mockUserStorage) GetByEmail(ctx context.Context, email string) (*dto.UserResponse, error) {
	if m.getByEmailFn != nil {
		return m.getByEmailFn(ctx, email)
	}
	return nil, userStorage.ErrUserNotFound
}

func (m *mockUserStorage) GetByEmailWithPassword(ctx context.Context, email string) (*dto.UserResponse, string, error) {
	return nil, "", errors.New("not implemented")
}

func (m *mockUserStorage) List(ctx context.Context, params *userStorage.QueryParams) ([]*dto.UserResponse, int64, error) {
	return nil, 0, errors.New("not implemented")
}

func (m *mockUserStorage) Update(ctx context.Context, id int64, user *dto.User) (*dto.UserResponse, error) {
	return nil, errors.New("not implemented")
}

func (m *mockUserStorage) UpdateByEmail(ctx context.Context, email string, user *dto.User) (*dto.UserResponse, error) {
	return nil, errors.New("not implemented")
}

func (m *mockUserStorage) Delete(ctx context.Context, id int64) error {
	return errors.New("not implemented")
}

func (m *mockUserStorage) DeleteByEmail(ctx context.Context, email string) error {
	return errors.New("not implemented")
}

func (m *mockUserStorage) UpdatePassword(context.Context, string, string) error {
	return errors.New("not implemented")
}

func (m *mockUserStorage) SetEmailVerified(context.Context, string, bool) error {
	return errors.New("not implemented")
}

func (m *mockUserStorage) UpdateDomain(ctx context.Context, id int64, domain []string) (*dto.UserResponse, error) {
	return nil, errors.New("not implemented")
}

func TestRegister_ReturnsConflictForDuplicateEmail(t *testing.T) {
	t.Parallel()

	orch := &Orchestrator{
		userStorage: &mockUserStorage{
			getByEmailFn: func(ctx context.Context, email string) (*dto.UserResponse, error) {
				return nil, userStorage.ErrUserNotFound
			},
			createFn: func(ctx context.Context, user *dto.User, hashedPassword string, emailVerified bool) (*dto.UserResponse, error) {
				return nil, userStorage.ErrEmailAlreadyExists
			},
		},
	}

	_, err := orch.Register(context.Background(), &dto.UserCreateRequest{
		User: &dto.User{
			Email:     "existing@example.com",
			FirstName: "Existing",
			LastName:  "User",
			Domain:    []string{"AI"},
		},
		Password: "ValidPassword123!",
	})
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	errResp, ok := err.(*handler.ErrorResponse)
	if !ok {
		t.Fatalf("expected *handler.ErrorResponse, got %T", err)
	}
	if errResp.StatusCode != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", errResp.StatusCode)
	}
	if errResp.Message != "an account with this email already exists" {
		t.Fatalf("unexpected error message: %s", errResp.Message)
	}
}

func TestRegister_ReturnsBadRequestWhenUserMissing(t *testing.T) {
	t.Parallel()

	orch := &Orchestrator{
		userStorage: &mockUserStorage{
			getByEmailFn: func(ctx context.Context, email string) (*dto.UserResponse, error) {
				return nil, userStorage.ErrUserNotFound
			},
			createFn: func(ctx context.Context, user *dto.User, hashedPassword string, emailVerified bool) (*dto.UserResponse, error) {
				return nil, nil
			},
		},
	}

	_, err := orch.Register(context.Background(), &dto.UserCreateRequest{Password: "ValidPassword123!"})
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	errResp, ok := err.(*handler.ErrorResponse)
	if !ok {
		t.Fatalf("expected *handler.ErrorResponse, got %T", err)
	}
	if errResp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", errResp.StatusCode)
	}
}

func TestRegister_RejectsExistingEmailBeforeInsert(t *testing.T) {
	t.Parallel()

	orch := &Orchestrator{
		userStorage: &mockUserStorage{
			getByEmailFn: func(ctx context.Context, email string) (*dto.UserResponse, error) {
				return &dto.UserResponse{
					User: &dto.User{
						ID:        42,
						Email:     email,
						FirstName: "Existing",
						LastName:  "User",
					},
				}, nil
			},
			createFn: func(ctx context.Context, user *dto.User, hashedPassword string, emailVerified bool) (*dto.UserResponse, error) {
				t.Fatal("Create should not be called when email already exists")
				return nil, nil
			},
		},
	}

	_, err := orch.Register(context.Background(), &dto.UserCreateRequest{
		User: &dto.User{
			Email:     "existing@example.com",
			FirstName: "Existing",
			LastName:  "User",
		},
		Password: "ValidPassword123!",
	})
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	errResp, ok := err.(*handler.ErrorResponse)
	if !ok {
		t.Fatalf("expected *handler.ErrorResponse, got %T", err)
	}
	if errResp.StatusCode != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", errResp.StatusCode)
	}
}

func TestRegister_ReturnsInternalErrorWhenPrecheckLookupFails(t *testing.T) {
	t.Parallel()

	orch := &Orchestrator{
		userStorage: &mockUserStorage{
			getByEmailFn: func(ctx context.Context, email string) (*dto.UserResponse, error) {
				return nil, errors.New("db unavailable")
			},
		},
	}

	_, err := orch.Register(context.Background(), &dto.UserCreateRequest{
		User: &dto.User{
			Email:     "new@example.com",
			FirstName: "New",
			LastName:  "User",
		},
		Password: "ValidPassword123!",
	})
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	errResp, ok := err.(*handler.ErrorResponse)
	if !ok {
		t.Fatalf("expected *handler.ErrorResponse, got %T", err)
	}
	if errResp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", errResp.StatusCode)
	}
}
