# Localization Guide for Developers

## Quick Start

### Using Translations in Components

```typescript
import { useTranslation } from "@/lib/i18n/translation-context"

export function MyComponent() {
  const { t, locale, setLocale } = useTranslation()
  
  return (
    <div>
      <h1>{t("common.labels.title")}</h1>
      <p>{t("dashboard.greeting", { name: "John" })}</p>
      <button onClick={() => setLocale(locale === "en" ? "vi" : "en")}>
        {t("common.actions.switchLanguage")}
      </button>
    </div>
  )
}
```

## Rules

### ✅ DO

1. **Always use translation keys for user-facing text**
   ```typescript
   // ✅ GOOD
   <button>{t("common.actions.save")}</button>
   
   // ❌ BAD
   <button>Save</button>
   ```

2. **Use interpolation for dynamic values**
   ```typescript
   // ✅ GOOD
   t("dashboard.greeting", { name: user.name })
   
   // ❌ BAD
   `Welcome, ${user.name}!`
   ```

3. **Use existing keys when possible**
   ```typescript
   // ✅ GOOD - Reuse common keys
   t("common.actions.edit")
   t("common.messages.notFound")
   
   // ❌ BAD - Creating duplicate keys
   t("myComponent.edit")
   t("myComponent.notFound")
   ```

4. **Add keys to BOTH language files**
   ```json
   // en.json
   { "myFeature": { "title": "My Feature" } }
   
   // vi.json
   { "myFeature": { "title": "Tính năng của tôi" } }
   ```

### ❌ DON'T

1. **Don't hardcode strings**
   ```typescript
   // ❌ BAD
   <h1>Conference Details</h1>
   
   // ✅ GOOD
   <h1>{t("dashboard.conference.details.title")}</h1>
   ```

2. **Don't concatenate translated strings**
   ```typescript
   // ❌ BAD
   const message = t("hello") + " " + t("world")
   
   // ✅ GOOD
   const message = t("greeting.helloWorld")
   ```

3. **Don't use translation keys for internal logic**
   ```typescript
   // ❌ BAD
   if (status === t("common.status.active")) { ... }
   
   // ✅ GOOD
   if (status === "active") { ... }
   // Then display: {t(`common.status.${status}`)}
   ```

## Translation Key Structure

```
common/
  ├── actions/        # Buttons, links (save, edit, delete)
  ├── labels/         # Form labels (email, password, title)
  ├── messages/       # System messages (loading, error, success)
  └── status/         # Status labels (pending, active, completed)

dashboard/
  ├── greeting
  ├── selectRole
  ├── conference/
  ├── header/
  └── roles/

auth/
  ├── login/
  └── register/

[feature]/
  ├── [subfeature]/
  └── ...
```

## Adding New Translations

### Step 1: Add to English file (`frontend/locales/en.json`)

```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature",
    "actions": {
      "submit": "Submit Form"
    }
  }
}
```

### Step 2: Add to Vietnamese file (`frontend/locales/vi.json`)

```json
{
  "myFeature": {
    "title": "Tính năng của tôi",
    "description": "Đây là tính năng của tôi",
    "actions": {
      "submit": "Gửi biểu mẫu"
    }
  }
}
```

### Step 3: Use in component

```typescript
export function MyFeature() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t("myFeature.title")}</h1>
      <p>{t("myFeature.description")}</p>
      <button>{t("myFeature.actions.submit")}</button>
    </div>
  )
}
```

## Common Patterns

### 1. Conditional Text

```typescript
// ✅ GOOD
const statusKey = isActive ? "common.status.active" : "common.status.inactive"
<span>{t(statusKey)}</span>

// ✅ ALSO GOOD
<span>{t(`common.status.${status}`)}</span>
```

### 2. Lists

```typescript
const { tList } = useTranslation()

// Translation file:
// "features": ["Feature 1", "Feature 2", "Feature 3"]

const features = tList("dashboard.roles.author.features")
features.map(feature => <li>{feature}</li>)
```

### 3. Pluralization (Simple)

```typescript
// Translation file:
// "items": "{count} items"

<span>{t("common.items", { count: items.length })}</span>
```

### 4. Error Messages

```typescript
// ✅ GOOD - Use translation for known errors
toast({
  variant: "destructive",
  title: t("common.messages.error"),
  description: t("auth.errors.invalidCredentials")
})

// ✅ GOOD - Show server error with fallback
toast({
  variant: "destructive",
  title: t("common.messages.error"),
  description: error.message || t("common.messages.unknownError")
})
```

## Date & Number Formatting

### Dates

```typescript
import { format } from "date-fns"
import { vi, enUS } from "date-fns/locale"

const { locale } = useTranslation()
const dateLocale = locale === "vi" ? vi : enUS

// Format date
const formatted = format(new Date(), "PPP", { locale: dateLocale })
// EN: "November 30, 2025"
// VI: "30 tháng 11, 2025"
```

### Numbers

```typescript
const { locale } = useTranslation()

// Format number
const formatter = new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US")
formatter.format(1234567.89)
// EN: "1,234,567.89"
// VI: "1.234.567,89"
```

### Currency

```typescript
const { locale } = useTranslation()

const formatter = new Intl.NumberFormat(
  locale === "vi" ? "vi-VN" : "en-US",
  {
    style: "currency",
    currency: locale === "vi" ? "VND" : "USD"
  }
)
formatter.format(1000000)
// EN: "$1,000,000.00"
// VI: "1.000.000 ₫"
```

## Testing Translations

### Manual Testing

1. Switch language using the language switcher (🇺🇸 / 🇻🇳)
2. Verify all text changes immediately
3. Refresh page - language should persist
4. Check localStorage: `conference_locale` should be "en" or "vi"

### Automated Testing

```typescript
import { render, screen } from "@testing-library/react"
import { TranslationProvider } from "@/lib/i18n/translation-context"

test("renders translated text", () => {
  render(
    <TranslationProvider>
      <MyComponent />
    </TranslationProvider>
  )
  
  expect(screen.getByText(/My Feature/i)).toBeInTheDocument()
})
```

## Troubleshooting

### Issue: Translation key not found

**Symptom:** You see the key name instead of translated text (e.g., "common.actions.save")

**Solution:**
1. Check if key exists in both `en.json` and `vi.json`
2. Check spelling and case sensitivity
3. Check console for warnings in development mode

### Issue: Text doesn't change when switching language

**Symptom:** Language switcher doesn't update the UI

**Solution:**
1. Verify component uses `useTranslation()` hook
2. Check if component is wrapped in `<TranslationProvider>`
3. Verify localStorage is working (check browser DevTools)

### Issue: Mixed language content

**Symptom:** Some text is in English, some in Vietnamese

**Solution:**
1. Search for hardcoded strings in the component
2. Replace with `t()` function calls
3. Run the localization audit script

## Best Practices

1. **Group related translations together**
   ```json
   {
     "auth": {
       "login": { "title": "...", "subtitle": "..." },
       "register": { "title": "...", "subtitle": "..." }
     }
   }
   ```

2. **Use descriptive key names**
   ```typescript
   // ✅ GOOD
   t("dashboard.conference.committee.inviteSuccess")
   
   // ❌ BAD
   t("msg1")
   ```

3. **Keep translations short and concise**
   - Avoid very long text in translation files
   - Consider breaking into multiple keys if needed

4. **Document context for translators**
   ```json
   {
     "button": {
       "_comment": "This button appears on the submission form",
       "submit": "Submit Paper"
     }
   }
   ```

5. **Maintain consistency**
   - Use the same term for the same concept
   - Example: Always use "Conference" not "Event" or "Meeting"

## Resources

- Translation Context: `frontend/lib/i18n/translation-context.tsx`
- English Translations: `frontend/locales/en.json`
- Vietnamese Translations: `frontend/locales/vi.json`
- Language Switcher: `frontend/components/language-switcher.tsx`
- Audit Report: `LOCALIZATION_AUDIT_REPORT.md`

## Getting Help

If you encounter issues with localization:

1. Check this guide first
2. Review the audit report for examples
3. Search for similar patterns in existing components
4. Ask the team in #frontend channel

---

**Remember:** Every user-facing string must be translatable. When in doubt, use `t()`!
