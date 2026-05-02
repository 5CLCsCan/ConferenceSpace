package submission

import (
	"bytes"
	"context"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type autofillConferenceStorageMock struct {
	conferenceStorage.StorageInterface
	conference *dto.ConferenceResponse
}

func (m *autofillConferenceStorageMock) GetByID(context.Context, int64) (*dto.ConferenceResponse, error) {
	return m.conference, nil
}

type autofillClientMock struct {
	request *aiServiceClient.SubmissionAutofillRunRequest
}

func (m *autofillClientMock) RunSubmissionAutofill(
	_ context.Context,
	_ string,
	requestPayload *aiServiceClient.SubmissionAutofillRunRequest,
	_ []aiServiceClient.SubmissionAutofillFileContent,
) (*aiServiceClient.SubmissionAutofillRunResponse, error) {
	m.request = requestPayload
	return &aiServiceClient.SubmissionAutofillRunResponse{
		RunID:  "run-autofill",
		Status: "ready",
	}, nil
}

func TestAutofillAddsStoredConferenceContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfpText := "We invite papers on learning systems and empirical AI evaluation."
	autofillClient := &autofillClientMock{}
	controller := &Controller{
		conferenceStorage: &autofillConferenceStorageMock{
			conference: &dto.ConferenceResponse{
				ID:          210,
				Title:       "Conference on AI Systems",
				Acronym:     "CAIS",
				Description: "Research conference for applied AI systems.",
				Domain:      []string{"Artificial Intelligence"},
				Tracks:      []string{"AI", "Systems"},
				Configurations: &dto.ConferenceConfiguration{
					CallForPaperText: &cfpText,
				},
				Status: model.ConferenceStatusOpen,
			},
		},
		autofillClient: autofillClient,
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	require.NoError(t, writer.WriteField("request", `{"extra_details":"Use final title.","available_tracks":["Spoofed"]}`))
	fileWriter, err := writer.CreateFormFile("files", "paper.pdf")
	require.NoError(t, err)
	_, err = fileWriter.Write([]byte("%PDF-1.4 test"))
	require.NoError(t, err)
	require.NoError(t, writer.Close())

	ginCtx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ginCtx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/conferences/210/submissions/autofill", &body)
	ginCtx.Request.Header.Set("Content-Type", writer.FormDataContentType())
	ginCtx.Params = gin.Params{{Key: "conference_id", Value: "210"}}
	ginCtx.Set("user_email", "author@example.com")
	ginCtx.Set("user_id", int64(7))

	response, err := controller.Autofill(ginCtx)

	require.NoError(t, err)
	require.NotNil(t, response)
	require.NotNil(t, autofillClient.request)
	assert.Equal(t, int64(210), autofillClient.request.ConferenceID)
	assert.Equal(t, []string{"AI", "Systems"}, autofillClient.request.AvailableTracks)
	assert.Equal(t, "Conference on AI Systems", autofillClient.request.ConferenceContext.Name)
	assert.Equal(t, "CAIS", autofillClient.request.ConferenceContext.Acronym)
	assert.Equal(t, "Research conference for applied AI systems.", autofillClient.request.ConferenceContext.Description)
	assert.Equal(t, []string{"Artificial Intelligence"}, autofillClient.request.ConferenceContext.Domain)
	assert.Equal(t, cfpText, autofillClient.request.ConferenceContext.CFPText)
	assert.Equal(t, []string{"AI", "Systems"}, autofillClient.request.ConferenceContext.Tracks)
}
