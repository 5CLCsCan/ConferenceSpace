#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import ts from "typescript"

const FRONTEND_ROOT = path.resolve(process.cwd())
const SOURCE_DIRS = ["app", "components", "hooks", "lib"].map((segment) =>
  path.join(FRONTEND_ROOT, segment),
)
const EXCLUDED_DIRS = new Set([".next", "node_modules", "dist", "build", "__tests__", ".git"])
const EXCLUDED_APP_TEST_PREFIX = path.join("app", "test") + path.sep
const EXCLUDED_APP_API_PREFIX = path.join("app", "api") + path.sep
const TEST_FILE_PATTERN = /(?:^|[/\\]).*\.(test|spec)\.(ts|tsx|js|jsx)$/
const LOCALES_DIR = path.join(FRONTEND_ROOT, "locales")
const EN_PATH = path.join(LOCALES_DIR, "en.json")
const VI_PATH = path.join(LOCALES_DIR, "vi.json")
const I18N_ALIAS = {
  coi: "dashboard.coi",
}

const HARD_CODED_ATTRS = new Set(["placeholder", "aria-label", "title", "alt"])
function toRelative(fullPath) {
  return path.relative(FRONTEND_ROOT, fullPath)
}

function walkFiles(rootDir, out) {
  if (!fs.existsSync(rootDir)) {
    return
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue
      }
      walkFiles(fullPath, out)
      continue
    }
    out.push(fullPath)
  }
}

function listSourceFiles() {
  const all = []
  for (const sourceDir of SOURCE_DIRS) {
    walkFiles(sourceDir, all)
  }

  return all.filter((filePath) => {
    const relative = toRelative(filePath)
    if (relative.startsWith(EXCLUDED_APP_TEST_PREFIX)) {
      return false
    }
    if (relative.startsWith(EXCLUDED_APP_API_PREFIX)) {
      return false
    }
    if (TEST_FILE_PATTERN.test(relative)) {
      return false
    }
    if (/[/\\]route\.(ts|tsx|js|jsx)$/.test(relative)) {
      return false
    }
    if (/[/\\]layout\.(ts|tsx|js|jsx)$/.test(relative)) {
      return false
    }
    return /\.(ts|tsx|js|jsx)$/.test(filePath)
  })
}

function safeReadJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"))
}

function collectAllPaths(value, prefix = "", out = new Map()) {
  if (Array.isArray(value)) {
    out.set(prefix, {
      type: "array",
      value,
    })
    return out
  }

  if (value && typeof value === "object") {
    out.set(prefix, {
      type: "object",
      value,
    })
    for (const [key, nextValue] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key
      collectAllPaths(nextValue, nextPrefix, out)
    }
    return out
  }

  out.set(prefix, {
    type: typeof value,
    value,
  })
  return out
}

function collectLeafPaths(value, prefix = "", out = new Map()) {
  if (Array.isArray(value)) {
    out.set(prefix, {
      type: "array",
      value,
    })
    return out
  }

  if (value && typeof value === "object") {
    for (const [key, nextValue] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key
      collectLeafPaths(nextValue, nextPrefix, out)
    }
    return out
  }

  out.set(prefix, {
    type: typeof value,
    value,
  })
  return out
}

function extractPlaceholders(input) {
  if (typeof input !== "string") {
    return []
  }

  const found = new Set()
  const patterns = [/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, /\{\s*([a-zA-Z0-9_]+)\s*\}/g]

  for (const pattern of patterns) {
    let match = pattern.exec(input)
    while (match) {
      found.add(match[1])
      match = pattern.exec(input)
    }
  }

  return [...found].sort()
}

function isLikelyUserVisibleText(raw) {
  const normalized = raw.replace(/\s+/g, " ").trim()
  if (!normalized) {
    return false
  }
  if (/^[\d\s.,:/-]+$/.test(normalized)) {
    return false
  }
  if (/^[a-z0-9_]+$/.test(normalized)) {
    return false
  }
  if (/^[\W_]+$/.test(normalized)) {
    return false
  }
  return /[A-Za-z]/.test(normalized)
}

function getJsxTagName(openingElement) {
  const { tagName } = openingElement
  if (ts.isIdentifier(tagName)) {
    return tagName.text
  }
  return tagName.getText()
}

function getClassNameLiteral(openingElement) {
  for (const attribute of openingElement.attributes.properties) {
    if (!ts.isJsxAttribute(attribute)) {
      continue
    }
    if (attribute.name.text !== "className") {
      continue
    }
    if (!attribute.initializer) {
      continue
    }
    if (ts.isStringLiteral(attribute.initializer)) {
      return attribute.initializer.text
    }
    if (
      ts.isJsxExpression(attribute.initializer) &&
      attribute.initializer.expression &&
      ts.isStringLiteral(attribute.initializer.expression)
    ) {
      return attribute.initializer.expression.text
    }
  }
  return ""
}

function isInsideMaterialIcon(node) {
  let current = node.parent
  while (current) {
    if (ts.isJsxElement(current)) {
      const className = getClassNameLiteral(current.openingElement)
      if (className.includes("material-symbols-outlined")) {
        return true
      }
    }
    if (ts.isJsxSelfClosingElement(current)) {
      const className = getClassNameLiteral(current)
      if (className.includes("material-symbols-outlined")) {
        return true
      }
    }
    current = current.parent
  }
  return false
}

function isInsideCodeTag(node) {
  let current = node.parent
  while (current) {
    if (ts.isJsxElement(current)) {
      if (getJsxTagName(current.openingElement) === "code") {
        return true
      }
    }
    current = current.parent
  }
  return false
}

function buildTemplatePattern(templateExpression, sourceFile) {
  if (ts.isNoSubstitutionTemplateLiteral(templateExpression)) {
    return templateExpression.text
  }

  if (!ts.isTemplateExpression(templateExpression)) {
    return null
  }

  let pattern = templateExpression.head.text
  for (const span of templateExpression.templateSpans) {
    pattern += `\${${span.expression.getText(sourceFile)}}${span.literal.text}`
  }
  return pattern
}

function expandDynamicPattern(pattern, filePath) {
  if (!pattern) {
    return []
  }

  if (pattern === "auth.forgotPassword.steps.${step}.title") {
    return [
      "auth.forgotPassword.steps.email.title",
      "auth.forgotPassword.steps.verify.title",
      "auth.forgotPassword.steps.reset.title",
    ]
  }

  if (pattern === "auth.forgotPassword.steps.${step}.subtitle") {
    return [
      "auth.forgotPassword.steps.email.subtitle",
      "auth.forgotPassword.steps.verify.subtitle",
      "auth.forgotPassword.steps.reset.subtitle",
    ]
  }

  if (pattern === "auth.register.passwordHints.rules.${rule}") {
    return [
      "auth.register.passwordHints.rules.length",
      "auth.register.passwordHints.rules.lower",
      "auth.register.passwordHints.rules.upper",
      "auth.register.passwordHints.rules.number",
      "auth.register.passwordHints.rules.special",
    ]
  }

  if (
    pattern === "dashboard.roles.reviewer.papers.statusValues.${paper.assignment_status}" ||
    pattern === "dashboard.roles.reviewer.papers.statusValues.${assignmentStatus}"
  ) {
    return [
      "dashboard.roles.reviewer.papers.statusValues.not_started",
      "dashboard.roles.reviewer.papers.statusValues.in_progress",
      "dashboard.roles.reviewer.papers.statusValues.completed",
      "dashboard.roles.reviewer.papers.statusValues.pending",
      "dashboard.roles.reviewer.papers.statusValues.accepted",
      "dashboard.roles.reviewer.papers.statusValues.declined",
      "dashboard.roles.reviewer.papers.statusValues.submitted",
    ]
  }

  if (
    filePath.endsWith(path.join("components", "language-switcher.tsx")) &&
    (pattern === "${currentOption.labelKey}" || pattern === "${option.labelKey}")
  ) {
    return ["common.messages.languages.vietnamese", "common.messages.languages.english"]
  }

  return []
}

function expandDynamicExpression(exprText, filePath) {
  const relative = toRelative(filePath)

  if (
    relative === path.join("components", "dashboard-sidebar.tsx") &&
    exprText === "item.labelKey"
  ) {
    return [
      "dashboard.sidebar.nav.author.conferences",
      "dashboard.sidebar.nav.author.mySubmissions",
      "dashboard.sidebar.nav.author.schedules",
      "dashboard.sidebar.nav.reviewer.dashboard",
      "dashboard.sidebar.nav.reviewer.conferences",
      "dashboard.sidebar.nav.reviewer.invitations",
      "dashboard.sidebar.nav.reviewer.completed",
      "dashboard.sidebar.nav.reviewer.schedules",
      "dashboard.sidebar.nav.chair.dashboard",
      "dashboard.sidebar.nav.chair.conferences",
      "dashboard.sidebar.nav.chair.schedules",
      "dashboard.sidebar.nav.common.dashboard",
      "dashboard.sidebar.nav.common.notifications",
    ]
  }

  if (
    relative === path.join("components", "reviewer", "assigned-dashboard.tsx") &&
    exprText === "statusLabelKeys[status]"
  ) {
    return [
      "runtime.components.reviewer.assigned-dashboard.filters.all",
      "runtime.components.reviewer.assigned-dashboard.filters.notStarted",
      "runtime.components.reviewer.assigned-dashboard.filters.inProgress",
      "runtime.components.reviewer.assigned-dashboard.filters.completed",
    ]
  }

  if (
    relative === path.join("components", "reviewer", "assigned-dashboard.tsx") &&
    exprText.includes("assignmentStatusLabelKeys[paper.assignment_status]")
  ) {
    return [
      "dashboard.roles.reviewer.papers.statusValues.not_started",
      "dashboard.roles.reviewer.papers.statusValues.in_progress",
      "dashboard.roles.reviewer.papers.statusValues.completed",
      "dashboard.roles.reviewer.papers.statusValues.pending",
      "dashboard.roles.reviewer.papers.statusValues.accepted",
      "dashboard.roles.reviewer.papers.statusValues.declined",
      "dashboard.roles.reviewer.papers.statusValues.submitted",
    ]
  }

  return []
}

function expandAliasCandidates(key) {
  const [first, ...rest] = key.split(".")
  const alias = I18N_ALIAS[first]
  if (!alias) {
    return [key]
  }
  const suffix = rest.length > 0 ? `.${rest.join(".")}` : ""
  return [key, `${alias}${suffix}`]
}

function collectTranslationUsage(files) {
  const tKeys = new Set()
  const tListKeys = new Set()
  const unresolvedDynamic = []
  const dynamicResolved = []

  for (const filePath of files) {
    const sourceText = fs.readFileSync(filePath, "utf8")
    const scriptKind = filePath.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : filePath.endsWith(".jsx")
        ? ts.ScriptKind.JSX
        : ts.ScriptKind.TS
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    )

    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const fnName = node.expression.text
        if (fnName === "t" || fnName === "tList") {
          const keySet = fnName === "t" ? tKeys : tListKeys
          const firstArg = node.arguments[0]
          if (!firstArg) {
            unresolvedDynamic.push({
              file: toRelative(filePath),
              line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
              call: node.getText(sourceFile),
              reason: "missing first argument",
            })
            ts.forEachChild(node, visit)
            return
          }

          if (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg)) {
            keySet.add(firstArg.text)
            ts.forEachChild(node, visit)
            return
          }

          if (ts.isTemplateExpression(firstArg)) {
            const pattern = buildTemplatePattern(firstArg, sourceFile)
            const expanded = expandDynamicPattern(pattern, filePath)
            if (expanded.length > 0) {
              for (const key of expanded) {
                keySet.add(key)
              }
              dynamicResolved.push({
                file: toRelative(filePath),
                line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                pattern,
                expandedCount: expanded.length,
              })
            } else {
              unresolvedDynamic.push({
                file: toRelative(filePath),
                line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                call: node.getText(sourceFile),
                reason: `unhandled template pattern: ${pattern}`,
              })
            }
            ts.forEachChild(node, visit)
            return
          }

          if (ts.isIdentifier(firstArg) && firstArg.text === "currentOption.labelKey") {
            keySet.add("common.messages.languages.vietnamese")
            keySet.add("common.messages.languages.english")
            ts.forEachChild(node, visit)
            return
          }

          const exprText = firstArg.getText(sourceFile)
          if (
            toRelative(filePath) === path.join("components", "language-switcher.tsx") &&
            (exprText === "currentOption.labelKey" || exprText === "option.labelKey")
          ) {
            keySet.add("common.messages.languages.vietnamese")
            keySet.add("common.messages.languages.english")
            ts.forEachChild(node, visit)
            return
          }

          const expandedByExpression = expandDynamicExpression(exprText, filePath)
          if (expandedByExpression.length > 0) {
            for (const key of expandedByExpression) {
              keySet.add(key)
            }
          } else {
            unresolvedDynamic.push({
              file: toRelative(filePath),
              line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
              call: node.getText(sourceFile),
              reason: "non-literal translation key argument",
            })
          }
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  }

  return {
    tKeys,
    tListKeys,
    unresolvedDynamic,
    dynamicResolved,
  }
}

function collectHardcodedStrings(files) {
  const findings = []

  for (const filePath of files) {
    const relative = toRelative(filePath)
    if (!/\.(tsx|jsx|ts|js)$/.test(filePath)) {
      continue
    }

    const sourceText = fs.readFileSync(filePath, "utf8")
    const scriptKind = filePath.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : filePath.endsWith(".jsx")
        ? ts.ScriptKind.JSX
        : ts.ScriptKind.TS
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    )

    function pushFinding(node, text, sourceKind) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
      findings.push({
        file: relative,
        line: line + 1,
        text: text.replace(/\s+/g, " ").trim(),
        source: sourceKind,
      })
    }

    function visit(node) {
      if (ts.isJsxText(node)) {
        const normalized = node.getText(sourceFile).replace(/\s+/g, " ").trim()
        if (
          isLikelyUserVisibleText(normalized) &&
          !isInsideMaterialIcon(node) &&
          !isInsideCodeTag(node)
        ) {
          pushFinding(node, normalized, "jsx-text")
        }
      }

      if (ts.isJsxAttribute(node) && node.initializer && HARD_CODED_ATTRS.has(node.name.text)) {
        if (ts.isStringLiteral(node.initializer)) {
          if (isLikelyUserVisibleText(node.initializer.text)) {
            pushFinding(node, node.initializer.text, "jsx-attribute")
          }
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)

    if (relative === path.join("lib", "navigation.ts")) {
      function visitNav(node) {
        if (
          ts.isPropertyAssignment(node) &&
          ts.isIdentifier(node.name) &&
          node.name.text === "label" &&
          ts.isStringLiteral(node.initializer) &&
          isLikelyUserVisibleText(node.initializer.text)
        ) {
          pushFinding(node, node.initializer.text, "ts-property")
        }
        ts.forEachChild(node, visitNav)
      }
      visitNav(sourceFile)
    }
  }

  return findings
}

function buildNestedObjectFromLeafMap(entries) {
  const root = {}
  for (const [flatKey, payload] of entries) {
    const segments = flatKey.split(".")
    let current = root
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index]
      const isLast = index === segments.length - 1
      if (isLast) {
        current[segment] = payload.value
        break
      }
      if (
        !current[segment] ||
        typeof current[segment] !== "object" ||
        Array.isArray(current[segment])
      ) {
        current[segment] = {}
      }
      current = current[segment]
    }
  }
  return root
}

function main() {
  if (!fs.existsSync(EN_PATH) || !fs.existsSync(VI_PATH)) {
    console.error("Missing locale file(s): expected locales/en.json and locales/vi.json")
    process.exit(1)
  }

  const enJson = safeReadJson(EN_PATH)
  const viJson = safeReadJson(VI_PATH)
  const enAllPaths = collectAllPaths(enJson)
  const viAllPaths = collectAllPaths(viJson)
  const enLeafPaths = collectLeafPaths(enJson)
  const viLeafPaths = collectLeafPaths(viJson)

  const sourceFiles = listSourceFiles()
  const usage = collectTranslationUsage(sourceFiles)

  const usedResolvedT = new Set()
  const usedResolvedTList = new Set()
  const missingInEn = []
  const missingInVi = []

  for (const key of usage.tKeys) {
    const candidates = expandAliasCandidates(key)
    const enMatch = candidates.find((candidate) => enLeafPaths.has(candidate))
    const viMatch = candidates.find((candidate) => viLeafPaths.has(candidate))
    if (enMatch) {
      usedResolvedT.add(enMatch)
    } else {
      missingInEn.push(key)
    }
    if (viMatch) {
      usedResolvedT.add(viMatch)
    } else {
      missingInVi.push(key)
    }
  }

  for (const key of usage.tListKeys) {
    const candidates = expandAliasCandidates(key)
    const enMatch = candidates.find((candidate) => enLeafPaths.has(candidate))
    const viMatch = candidates.find((candidate) => viLeafPaths.has(candidate))
    if (enMatch) {
      usedResolvedTList.add(enMatch)
    } else {
      missingInEn.push(key)
    }
    if (viMatch) {
      usedResolvedTList.add(viMatch)
    } else {
      missingInVi.push(key)
    }
  }

  const nonStringTKeys = []
  for (const key of usedResolvedT) {
    const enType = enLeafPaths.get(key)?.type
    const viType = viLeafPaths.get(key)?.type
    if (enType !== "string" || viType !== "string") {
      nonStringTKeys.push({
        key,
        enType,
        viType,
      })
    }
  }

  const nonArrayTListKeys = []
  for (const key of usedResolvedTList) {
    const enType = enLeafPaths.get(key)?.type
    const viType = viLeafPaths.get(key)?.type
    if (enType !== "array" || viType !== "array") {
      nonArrayTListKeys.push({
        key,
        enType,
        viType,
      })
    }
  }

  const allEnPathKeys = [...enAllPaths.keys()].filter(Boolean)
  const allViPathKeys = [...viAllPaths.keys()].filter(Boolean)
  const enOnlyPaths = allEnPathKeys.filter((key) => !viAllPaths.has(key))
  const viOnlyPaths = allViPathKeys.filter((key) => !enAllPaths.has(key))

  const sharedPathKeys = allEnPathKeys.filter((key) => viAllPaths.has(key))
  const typeMismatches = sharedPathKeys
    .filter((key) => enAllPaths.get(key)?.type !== viAllPaths.get(key)?.type)
    .map((key) => ({
      key,
      enType: enAllPaths.get(key)?.type,
      viType: viAllPaths.get(key)?.type,
    }))

  const placeholderMismatches = []
  const sharedLeafKeys = [...enLeafPaths.keys()].filter((key) => viLeafPaths.has(key))
  for (const key of sharedLeafKeys) {
    const enEntry = enLeafPaths.get(key)
    const viEntry = viLeafPaths.get(key)
    if (!enEntry || !viEntry) {
      continue
    }
    if (enEntry.type !== "string" || viEntry.type !== "string") {
      continue
    }
    const enPlaceholders = extractPlaceholders(enEntry.value)
    const viPlaceholders = extractPlaceholders(viEntry.value)
    if (enPlaceholders.join(",") !== viPlaceholders.join(",")) {
      placeholderMismatches.push({
        key,
        enPlaceholders,
        viPlaceholders,
      })
    }
  }

  const usedLeafKeys = new Set([...usedResolvedT, ...usedResolvedTList])
  const deadEnKeys = [...enLeafPaths.keys()].filter((key) => !usedLeafKeys.has(key))
  const deadViKeys = [...viLeafPaths.keys()].filter((key) => !usedLeafKeys.has(key))

  const hardcodedFindings = collectHardcodedStrings(sourceFiles)

  let hasFailures = false
  function printFailure(title, rows, formatter = (row) => String(row), max = 40) {
    if (rows.length === 0) {
      return
    }
    hasFailures = true
    console.error(`\n[FAIL] ${title} (${rows.length})`)
    rows.slice(0, max).forEach((row) => {
      console.error(`  - ${formatter(row)}`)
    })
    if (rows.length > max) {
      console.error(`  ... and ${rows.length - max} more`)
    }
  }

  printFailure("Unhandled dynamic translation keys", usage.unresolvedDynamic, (row) => {
    return `${row.file}:${row.line} ${row.reason} -> ${row.call}`
  })
  printFailure("Missing keys in en.json", [...new Set(missingInEn)].sort())
  printFailure("Missing keys in vi.json", [...new Set(missingInVi)].sort())
  printFailure("t() keys that do not resolve to string in both locales", nonStringTKeys, (row) => {
    return `${row.key} (en=${row.enType ?? "missing"}, vi=${row.viType ?? "missing"})`
  })
  printFailure(
    "tList() keys that do not resolve to array in both locales",
    nonArrayTListKeys,
    (row) => `${row.key} (en=${row.enType ?? "missing"}, vi=${row.viType ?? "missing"})`,
  )
  printFailure("Locale paths only in en.json", enOnlyPaths.sort())
  printFailure("Locale paths only in vi.json", viOnlyPaths.sort())
  printFailure("Locale type mismatches (en vs vi)", typeMismatches, (row) => {
    return `${row.key} (en=${row.enType}, vi=${row.viType})`
  })
  printFailure("Interpolation placeholder mismatches", placeholderMismatches, (row) => {
    return `${row.key} (en=[${row.enPlaceholders.join(", ")}], vi=[${row.viPlaceholders.join(", ")}])`
  })
  printFailure("Dead keys in en.json", deadEnKeys.sort())
  printFailure("Dead keys in vi.json", deadViKeys.sort())
  printFailure(
    "Hardcoded user-visible strings",
    hardcodedFindings,
    (row) => {
      return `${row.file}:${row.line} [${row.source}] "${row.text}"`
    },
    120,
  )

  if (hasFailures) {
    process.exit(1)
  }

  const effectiveLocaleShape = buildNestedObjectFromLeafMap(
    [...enLeafPaths.entries()].filter(([key]) => usedLeafKeys.has(key)),
  )
  const localeKeyCount = collectLeafPaths(effectiveLocaleShape).size
  console.log(
    `[PASS] i18n audit succeeded. t-keys=${usage.tKeys.size}, tList-keys=${usage.tListKeys.size}, effective-locale-leaf-keys=${localeKeyCount}`,
  )
}

main()
