package user

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	userstorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type fakeUserStorage struct {
	getByEmail func(ctx context.Context, email string) (*dto.UserResponse, error)
}

func (f *fakeUserStorage) Create(context.Context, *dto.User, string, bool) (*dto.UserResponse, error) {
	panic("unexpected call to Create")
}

func (f *fakeUserStorage) GetByID(context.Context, int64) (*dto.UserResponse, error) {
	panic("unexpected call to GetByID")
}

func (f *fakeUserStorage) GetByEmail(ctx context.Context, email string) (*dto.UserResponse, error) {
	if f.getByEmail != nil {
		return f.getByEmail(ctx, email)
	}
	return nil, userstorage.ErrUserNotFound
}

func (f *fakeUserStorage) GetByEmailWithPassword(context.Context, string) (*dto.UserResponse, string, error) {
	panic("unexpected call to GetByEmailWithPassword")
}

func (f *fakeUserStorage) List(context.Context, *userstorage.QueryParams) ([]*dto.UserResponse, int64, error) {
	panic("unexpected call to List")
}

func (f *fakeUserStorage) Update(context.Context, int64, *dto.User) (*dto.UserResponse, error) {
	panic("unexpected call to Update")
}

func (f *fakeUserStorage) UpdateByEmail(context.Context, string, *dto.User) (*dto.UserResponse, error) {
	panic("unexpected call to UpdateByEmail")
}

func (f *fakeUserStorage) Delete(context.Context, int64) error {
	panic("unexpected call to Delete")
}

func (f *fakeUserStorage) DeleteByEmail(context.Context, string) error {
	panic("unexpected call to DeleteByEmail")
}

func (f *fakeUserStorage) UpdatePassword(context.Context, string, string) error {
	panic("unexpected call to UpdatePassword")
}

func (f *fakeUserStorage) SetEmailVerified(context.Context, string, bool) error {
	panic("unexpected call to SetEmailVerified")
}

type fakeScholarStorage struct {
	profileByUserID map[int64]*model.ScholarProfile
	papersByProfile map[int64][]*model.ScholarPaper
}

func (f *fakeScholarStorage) CreateProfile(context.Context, *model.ScholarProfile) error {
	panic("unexpected call to CreateProfile")
}

func (f *fakeScholarStorage) GetProfileByUserID(_ context.Context, userID int64) (*model.ScholarProfile, error) {
	return f.profileByUserID[userID], nil
}

func (f *fakeScholarStorage) GetProfileBySemanticID(context.Context, string) (*model.ScholarProfile, error) {
	panic("unexpected call to GetProfileBySemanticID")
}

func (f *fakeScholarStorage) UpsertPaper(context.Context, *model.ScholarPaper) (int64, error) {
	panic("unexpected call to UpsertPaper")
}

func (f *fakeScholarStorage) LinkPaperToProfile(context.Context, int64, int64) error {
	panic("unexpected call to LinkPaperToProfile")
}

func (f *fakeScholarStorage) ClearProfilePapers(context.Context, int64) error {
	panic("unexpected call to ClearProfilePapers")
}

func (f *fakeScholarStorage) ReplaceProfilePapers(context.Context, int64, []int64) error {
	panic("unexpected call to ReplaceProfilePapers")
}

func (f *fakeScholarStorage) GetPapersByProfileID(_ context.Context, profileID int64) ([]*model.ScholarPaper, error) {
	return f.papersByProfile[profileID], nil
}

func (f *fakeScholarStorage) DeleteProfileByUserID(context.Context, int64) error {
	panic("unexpected call to DeleteProfileByUserID")
}

func TestGetAcademicProfileByEmailReturnsMappedProfile(t *testing.T) {
	gin.SetMode(gin.TestMode)

	authors, err := json.Marshal([]dto.PaperAuthor{
		{AuthorID: "a-1", Name: "Ada Lovelace"},
		{AuthorID: "a-2", Name: "Alan Turing"},
	})
	require.NoError(t, err)

	controller := &Controller{
		userStorage: &fakeUserStorage{
			getByEmail: func(_ context.Context, email string) (*dto.UserResponse, error) {
				return &dto.UserResponse{
					User: &dto.User{
						ID:        7,
						Email:     email,
						FirstName: "Grace",
						LastName:  "Hopper",
					},
				}, nil
			},
		},
		scholarStorage: &fakeScholarStorage{
			profileByUserID: map[int64]*model.ScholarProfile{
				7: {
					ID:                17,
					UserID:            7,
					SemanticScholarID: "ss-17",
					Name:              "Grace Hopper",
					Affiliations:      []string{"Yale University", "US Navy"},
					PaperCount:        12,
					CitationCount:     340,
					HIndex:            9,
					URL:               "https://www.semanticscholar.org/author/ss-17",
					UpdatedAt:         time.Date(2026, 3, 8, 10, 30, 0, 0, time.UTC),
				},
			},
			papersByProfile: map[int64][]*model.ScholarPaper{
				17: {
					{
						ID:                99,
						SemanticScholarID: "paper-99",
						Title:             "Compilers at Scale",
						Abstract:          "A survey of compiler construction.",
						Venue:             "CACM",
						Year:              1952,
						CitationCount:     41,
						URL:               "https://example.com/paper-99",
						Authors:           authors,
					},
				},
			},
		},
	}

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Params = gin.Params{{Key: "email", Value: "grace@example.com"}}
	ctx.Set("user_email", "grace@example.com")
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/users/grace@example.com/academic-profile", nil)

	response, err := controller.GetAcademicProfileByEmail(ctx)
	require.NoError(t, err)
	require.NotNil(t, response)

	assert.Equal(t, int64(7), response.UserID)
	assert.Equal(t, "Grace Hopper", response.Name)
	assert.Equal(t, []string{"Yale University", "US Navy"}, response.Affiliations)
	assert.Equal(t, "2026-03-08 10:30:00", response.SyncedAt)
	require.Len(t, response.Papers, 1)
	assert.Equal(t, "A survey of compiler construction.", response.Papers[0].Abstract)
	assert.Equal(t, "CACM", response.Papers[0].Venue)
	assert.Equal(t, []dto.PaperAuthor{
		{AuthorID: "a-1", Name: "Ada Lovelace"},
		{AuthorID: "a-2", Name: "Alan Turing"},
	}, response.Papers[0].Authors)
}

func TestGetAcademicProfileByEmailValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	controller := &Controller{
		userStorage: &fakeUserStorage{},
		scholarStorage: &fakeScholarStorage{
			profileByUserID: map[int64]*model.ScholarProfile{},
			papersByProfile: map[int64][]*model.ScholarPaper{},
		},
	}

	t.Run("unauthenticated returns unauthorized", func(t *testing.T) {
		w := httptest.NewRecorder()
		ctx, _ := gin.CreateTestContext(w)
		ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/users//academic-profile", nil)

		response, err := controller.GetAcademicProfileByEmail(ctx)
		require.Nil(t, response)
		require.Error(t, err)

		errorResponse, ok := err.(*handler.ErrorResponse)
		require.True(t, ok)
		assert.Equal(t, http.StatusUnauthorized, errorResponse.StatusCode)
	})

	t.Run("accessing other user profile returns forbidden", func(t *testing.T) {
		w := httptest.NewRecorder()
		ctx, _ := gin.CreateTestContext(w)
		ctx.Params = gin.Params{{Key: "email", Value: "other@example.com"}}
		ctx.Set("user_email", "self@example.com")
		ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/users/other@example.com/academic-profile", nil)

		response, err := controller.GetAcademicProfileByEmail(ctx)
		require.Nil(t, response)
		require.Error(t, err)

		errorResponse, ok := err.(*handler.ErrorResponse)
		require.True(t, ok)
		assert.Equal(t, http.StatusForbidden, errorResponse.StatusCode)
	})

	t.Run("missing user returns not found", func(t *testing.T) {
		controller.userStorage = &fakeUserStorage{
			getByEmail: func(context.Context, string) (*dto.UserResponse, error) {
				return nil, errors.New("not found")
			},
		}

		w := httptest.NewRecorder()
		ctx, _ := gin.CreateTestContext(w)
		ctx.Params = gin.Params{{Key: "email", Value: "missing@example.com"}}
		ctx.Set("user_email", "missing@example.com")
		ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/users/missing@example.com/academic-profile", nil)

		response, err := controller.GetAcademicProfileByEmail(ctx)
		require.Nil(t, response)
		require.Error(t, err)

		errorResponse, ok := err.(*handler.ErrorResponse)
		require.True(t, ok)
		assert.Equal(t, http.StatusNotFound, errorResponse.StatusCode)
	})
}
