package coi

import (
	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/coi/reciprocal"
	"github.com/dcao/conferencespace/internal/dto"
)

// SubmissionFromDTO converts a submission DTO into the COI detector representation.
// Author and co-author emails are normalized and include metadata.authors when present.
func SubmissionFromDTO(sub *dto.Submission) commons.Submission {
	if sub == nil {
		return commons.Submission{}
	}

	allEmails := reciprocal.AuthorEmails(sub)
	primary := reciprocal.NormalizeEmail(sub.Author)
	coAuthors := make([]string, 0, len(allEmails))
	for _, email := range allEmails {
		if email != primary {
			coAuthors = append(coAuthors, email)
		}
	}
	if primary == "" && len(allEmails) > 0 {
		primary = allEmails[0]
		coAuthors = allEmails[1:]
	}

	result := commons.Submission{
		ID:          sub.ID,
		AuthorEmail: primary,
		CoAuthors:   coAuthors,
		Declared:    []commons.ConflictDeclaration{},
	}

	if sub.Information != nil {
		for _, decl := range sub.Information.DeclaredConflicts {
			result.Declared = append(result.Declared, commons.ConflictDeclaration{
				Email:  decl.Email,
				Reason: decl.Reason,
			})
		}
	}

	return result
}
