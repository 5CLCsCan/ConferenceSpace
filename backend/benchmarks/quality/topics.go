package quality

import (
	"sort"
	"strings"
	"unicode"
)

// stopwords is a small English + academic-filler stopword set used to keep the
// extracted topic vocabulary meaningful (mid-granularity), not noisy.
var stopwords = map[string]bool{
	"a": true, "an": true, "and": true, "the": true, "of": true, "for": true,
	"on": true, "in": true, "to": true, "with": true, "using": true, "via": true,
	"based": true, "toward": true, "towards": true, "from": true, "by": true,
	"is": true, "are": true, "as": true, "at": true, "we": true, "our": true,
	"this": true, "that": true, "these": true, "those": true, "study": true,
	"approach": true, "method": true, "methods": true, "novel": true, "new": true,
	"paper": true, "results": true, "analysis": true, "or": true, "not": true,
}

// tokenize lowercases and splits on any non-alphanumeric rune.
func tokenize(s string) []string {
	s = strings.ToLower(s)
	return strings.FieldsFunc(s, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsNumber(r)
	})
}

// ExtractTopics derives mid-granularity topic strings from a paper title plus any
// coarse fields (e.g. Semantic Scholar fieldsOfStudy). Output is lowercased,
// deduplicated, and sorted for determinism. No LLM, pure Go.
func ExtractTopics(title string, fields []string) []string {
	set := make(map[string]bool)
	for _, f := range fields {
		if t := strings.ToLower(strings.TrimSpace(f)); t != "" {
			set[t] = true
		}
	}
	tokens := tokenize(title)
	for _, tok := range tokens {
		if len(tok) >= 5 && !stopwords[tok] {
			set[tok] = true
		}
	}
	for i := 0; i+1 < len(tokens); i++ {
		a, b := tokens[i], tokens[i+1]
		if stopwords[a] || stopwords[b] || len(a) < 3 || len(b) < 3 {
			continue
		}
		set[a+" "+b] = true
	}
	out := make([]string, 0, len(set))
	for k := range set {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}
