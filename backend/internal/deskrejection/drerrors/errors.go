package drerrors

import "fmt"

type Category string

const (
	CategoryExtraction Category = "extraction_failed"
	CategoryLLM        Category = "llm_evaluation_failed"
	CategoryPipeline   Category = "pipeline_failed"
)

type Error struct {
	Category Category
	Message  string
	Cause    error
}

func (e *Error) Error() string {
	if e == nil {
		return ""
	}
	if e.Cause == nil {
		return fmt.Sprintf("%s: %s", e.Category, e.Message)
	}
	return fmt.Sprintf("%s: %s: %v", e.Category, e.Message, e.Cause)
}

func (e *Error) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}

func New(category Category, message string, cause error) *Error {
	return &Error{
		Category: category,
		Message:  message,
		Cause:    cause,
	}
}
