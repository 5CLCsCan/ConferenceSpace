package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func getNestedValue(data map[string]interface{}, path string) interface{} {
	// Xử lý "[0]" thành ".0" cho dễ split
	path = regexp.MustCompile(`\[(\d+)\]`).ReplaceAllString(path, ".$1")
	keys := strings.Split(path, ".")

	var current interface{} = data
	for _, key := range keys {
		if currentMap, ok := current.(map[string]interface{}); ok {
			if val, exists := currentMap[key]; exists {
				current = val
			} else {
				return nil
			}
		} else if currentSlice, ok := current.([]interface{}); ok {
			// Xử lý index mảng nếu key là số
			var index int
			_, err := fmt.Sscanf(key, "%d", &index)
			if err == nil && index >= 0 && index < len(currentSlice) {
				current = currentSlice[index]
			} else {
				return nil
			}
		} else {
			return nil
		}
	}
	return current
}

func main() {
	personasPath := "personas.json"
	templatesDir := "templates"
	outputDir := "generated_prompts"

	// Đọc personas
	personasBytes, err := ioutil.ReadFile(personasPath)
	if err != nil {
		log.Fatalf("Failed to read personas.json: %v", err)
	}

	var personas []map[string]interface{}
	if err := json.Unmarshal(personasBytes, &personas); err != nil {
		log.Fatalf("Failed to parse personas.json: %v", err)
	}

	// Đọc system rules
	systemRulesBytes, err := ioutil.ReadFile(filepath.Join(templatesDir, "_system_rules.md"))
	if err != nil {
		log.Fatalf("Failed to read _system_rules.md: %v", err)
	}
	systemRules := string(systemRulesBytes)

	// Tạo output dir
	os.MkdirAll(outputDir, os.ModePerm)

	re := regexp.MustCompile(`\{\{(.*?)\}\}`)
	regNameSafe := regexp.MustCompile(`[^a-z0-9]`)

	for _, agent := range personas {
		identity := agent["identity"].(map[string]interface{})
		role := identity["role"].(string)
		displayName := identity["display_name"].(string)
		id := agent["id"].(string)

		templatePath := filepath.Join(templatesDir, fmt.Sprintf("%s_template.md", role))
		roleTemplateBytes, err := ioutil.ReadFile(templatePath)
		if err != nil {
			log.Printf("Warning: Failed to read %s: %v", templatePath, err)
			continue
		}

		fullPrompt := systemRules + "\n\n" + string(roleTemplateBytes)

		// Replace variables
		renderedPrompt := re.ReplaceAllStringFunc(fullPrompt, func(match string) string {
			inner := strings.TrimSpace(match[2 : len(match)-2])
			if strings.HasPrefix(inner, "agent.") {
				valPath := strings.TrimPrefix(inner, "agent.")
				val := getNestedValue(agent, valPath)
				if val != nil {
					switch v := val.(type) {
					case string:
						return v
					case float64:
						return fmt.Sprintf("%v", v)
					case bool:
						return fmt.Sprintf("%v", v)
					default: // map/slice
						b, _ := json.Marshal(v)
						return string(b)
					}
				}
				log.Printf("[Warning] Missing value for %s in agent %s", inner, id)
			}
			return match // leave {{context...}} intact
		})

		safeName := strings.ToLower(regNameSafe.ReplaceAllString(displayName, "_"))
		// remove multiple underscores
		safeName = regexp.MustCompile(`_+`).ReplaceAllString(safeName, "_")
		fileName := fmt.Sprintf("%s_%s.md", id, safeName)
		outPath := filepath.Join(outputDir, fileName)

		if err := ioutil.WriteFile(outPath, []byte(renderedPrompt), 0644); err != nil {
			log.Printf("Failed to write %s: %v", fileName, err)
		} else {
			fmt.Printf("✅ Created: %s\n", fileName)
		}
	}
	fmt.Printf("\n🎉 Đã tạo thành công %d prompt files tại: %s\n", len(personas), outputDir)
}
