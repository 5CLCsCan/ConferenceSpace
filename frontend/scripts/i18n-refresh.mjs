#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import ts from "typescript"

const FRONTEND_ROOT = path.resolve(process.cwd())
const LOCALES_EN_PATH = path.join(FRONTEND_ROOT, "locales", "en.json")
const LOCALES_VI_PATH = path.join(FRONTEND_ROOT, "locales", "vi.json")

const SOURCE_DIRS = ["app", "components", "hooks", "lib"].map((segment) =>
  path.join(FRONTEND_ROOT, segment),
)
const EXCLUDED_DIRS = new Set([".next", "node_modules", "dist", "build", "__tests__", ".git"])

const JSX_ATTRS = new Set(["placeholder", "aria-label", "title", "alt"])
const TS_UI_PROP_NAMES = new Set(["label", "title", "description", "text", "subtitle"])

function walk(dir, out) {
  if (!fs.existsSync(dir)) {
    return
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue
      }
      walk(fullPath, out)
      continue
    }
    out.push(fullPath)
  }
}

function rel(filePath) {
  return path.relative(FRONTEND_ROOT, filePath)
}

function shouldSkipFile(filePath) {
  const relative = rel(filePath)
  if (!/\.(tsx|jsx)$/.test(filePath)) {
    return true
  }
  if (relative.startsWith(path.join("app", "test") + path.sep)) {
    return true
  }
  if (relative.startsWith(path.join("app", "api") + path.sep)) {
    return true
  }
  if (relative.endsWith(path.sep + "route.tsx") || relative.endsWith(path.sep + "route.jsx")) {
    return true
  }
  if (relative.endsWith(path.sep + "layout.tsx") || relative.endsWith(path.sep + "layout.jsx")) {
    return true
  }
  return false
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

function normalizeText(raw) {
  return raw.replace(/\s+/g, " ").trim()
}

function getClassNameLiteral(openingElement) {
  for (const attribute of openingElement.attributes.properties) {
    if (!ts.isJsxAttribute(attribute)) {
      continue
    }
    if (attribute.name.text !== "className" || !attribute.initializer) {
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
    current = current.parent
  }
  return false
}

function isInsideCodeTag(node) {
  let current = node.parent
  while (current) {
    if (ts.isJsxElement(current) && current.openingElement.tagName.getText() === "code") {
      return true
    }
    current = current.parent
  }
  return false
}

function applyReplacements(source, replacements) {
  const sorted = [...replacements].sort((a, b) => b.start - a.start)
  let nextSource = source
  for (const replacement of sorted) {
    nextSource =
      nextSource.slice(0, replacement.start) + replacement.text + nextSource.slice(replacement.end)
  }
  return nextSource
}

function slugify(text) {
  return (
    text
      .toLowerCase()
      .replace(/&quot;|&nbsp;|&mdash;|&bull;/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join("_") || "text"
  )
}

function fileKeyPrefix(relativePath) {
  const noExt = relativePath.replace(/\.(tsx|jsx)$/, "")
  return `runtime.${noExt.replace(/[\\/]/g, ".").replace(/\[/g, "").replace(/\]/g, "")}`
}

function buildKeyFactory(prefix) {
  const keyByText = new Map()
  const countBySlug = new Map()

  return function createKey(text, hint) {
    const cacheKey = `${hint}|${text}`
    if (keyByText.has(cacheKey)) {
      return keyByText.get(cacheKey)
    }

    const baseSlug = slugify(text)
    const scopedSlug = hint ? `${hint}_${baseSlug}` : baseSlug
    const seen = countBySlug.get(scopedSlug) || 0
    countBySlug.set(scopedSlug, seen + 1)
    const suffix = seen > 0 ? `_${seen + 1}` : ""
    const key = `${prefix}.${scopedSlug}${suffix}`
    keyByText.set(cacheKey, key)
    return key
  }
}

function hasJsx(node) {
  let found = false
  function visit(current) {
    if (found) {
      return
    }
    if (
      ts.isJsxElement(current) ||
      ts.isJsxSelfClosingElement(current) ||
      ts.isJsxFragment(current)
    ) {
      found = true
      return
    }
    ts.forEachChild(current, visit)
  }
  visit(node)
  return found
}

function findHookInsertion(sourceFile, sourceText) {
  const statements = sourceFile.statements

  function buildInsertion(body) {
    const bodyStart = body.getStart(sourceFile)
    const insertionPos = bodyStart + 1
    const lineStart = sourceText.lastIndexOf("\n", bodyStart) + 1
    const linePrefix = sourceText.slice(lineStart, bodyStart)
    const indent = `${linePrefix}  `
    return {
      pos: insertionPos,
      text: `\n${indent}const { t } = useTranslation()`,
    }
  }

  for (const statement of statements) {
    if (ts.isFunctionDeclaration(statement) && statement.body && hasJsx(statement.body)) {
      return buildInsertion(statement.body)
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!declaration.initializer) {
          continue
        }
        if (
          ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer)
        ) {
          const { body } = declaration.initializer
          if (ts.isBlock(body) && hasJsx(body)) {
            return buildInsertion(body)
          }
        }
      }
    }
  }

  return null
}

function ensureUseClientDirective(sourceText) {
  const trimmed = sourceText.trimStart()
  if (trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")) {
    return sourceText
  }
  return `"use client"\n\n${sourceText}`
}

function ensureUseTranslationImport(sourceFile, sourceText) {
  const importDecls = sourceFile.statements.filter((statement) => ts.isImportDeclaration(statement))
  const targetImport = importDecls.find((statement) => {
    return (
      statement.moduleSpecifier.getText(sourceFile).replace(/["']/g, "") ===
      "@/lib/i18n/translation-context"
    )
  })

  if (targetImport) {
    const importClause = targetImport.importClause
    if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
      const hasUseTranslation = importClause.namedBindings.elements.some(
        (element) => element.name.text === "useTranslation",
      )
      if (hasUseTranslation) {
        return sourceText
      }

      const closeBrace = importClause.namedBindings.getEnd() - 1
      return `${sourceText.slice(0, closeBrace)}, useTranslation${sourceText.slice(closeBrace)}`
    }
  }

  const insertPos = importDecls.length > 0 ? importDecls[importDecls.length - 1].getEnd() : 0
  const prefix = insertPos > 0 ? "\n" : ""
  const importLine = `${prefix}import { useTranslation } from "@/lib/i18n/translation-context"`
  return `${sourceText.slice(0, insertPos)}${importLine}${sourceText.slice(insertPos)}`
}

function collectExistingTranslationMap(enJson, viJson) {
  const map = new Map()

  function walkPair(enValue, viValue) {
    if (typeof enValue === "string" && typeof viValue === "string") {
      if (!map.has(enValue)) {
        map.set(enValue, viValue)
      }
      return
    }

    if (Array.isArray(enValue) || Array.isArray(viValue)) {
      return
    }

    if (enValue && viValue && typeof enValue === "object" && typeof viValue === "object") {
      const keys = Object.keys(enValue)
      for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(viValue, key)) {
          walkPair(enValue[key], viValue[key])
        }
      }
    }
  }

  walkPair(enJson, viJson)
  return map
}

function translateFallback(enValue, existingMap) {
  if (existingMap.has(enValue)) {
    return existingMap.get(enValue)
  }

  const direct = new Map([
    ["All", "Tất cả"],
    ["Pending", "Đang chờ"],
    ["Draft", "Bản nháp"],
    ["Done", "Hoàn tất"],
    ["Open", "Mở"],
    ["Back", "Quay lại"],
    ["Next", "Tiếp theo"],
    ["Save", "Lưu"],
    ["Cancel", "Hủy"],
    ["Delete", "Xóa"],
    ["Edit", "Chỉnh sửa"],
    ["Loading...", "Đang tải..."],
    ["Search...", "Tìm kiếm..."],
    ["View Details", "Xem chi tiết"],
    ["Sign in", "Đăng nhập"],
    ["Register", "Đăng ký"],
  ])

  if (direct.has(enValue)) {
    return direct.get(enValue)
  }

  return enValue
}

function setNestedValue(target, flatKey, value) {
  const segments = flatKey.split(".")
  let current = target
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    const isLast = index === segments.length - 1
    if (isLast) {
      current[segment] = value
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

function run() {
  const enJson = JSON.parse(fs.readFileSync(LOCALES_EN_PATH, "utf8"))
  const viJson = JSON.parse(fs.readFileSync(LOCALES_VI_PATH, "utf8"))
  const existingMap = collectExistingTranslationMap(enJson, viJson)

  const files = []
  for (const dir of SOURCE_DIRS) {
    walk(dir, files)
  }

  const newLocaleEntries = new Map()
  let changedFiles = 0
  const skippedFiles = []

  for (const filePath of files) {
    if (shouldSkipFile(filePath)) {
      continue
    }

    let sourceText = fs.readFileSync(filePath, "utf8")
    if (sourceText.includes("export const metadata") && !sourceText.includes('"use client"')) {
      skippedFiles.push(rel(filePath))
      continue
    }

    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JSX,
    )

    const prefix = fileKeyPrefix(rel(filePath))
    const makeKey = buildKeyFactory(prefix)
    const replacements = []

    function addLocaleEntry(key, value) {
      if (!newLocaleEntries.has(key)) {
        newLocaleEntries.set(key, value)
      }
    }

    function visit(node) {
      if (ts.isJsxText(node)) {
        const raw = node.getText(sourceFile)
        const normalized = normalizeText(raw)
        if (
          isLikelyUserVisibleText(normalized) &&
          !isInsideMaterialIcon(node) &&
          !isInsideCodeTag(node)
        ) {
          const key = makeKey(normalized, "text")
          addLocaleEntry(key, normalized)

          const hasLeading = /^\s+/.test(raw)
          const hasTrailing = /\s+$/.test(raw)
          const nextText = `${hasLeading ? '{" "}' : ""}{t("${key}")}${hasTrailing ? '{" "}' : ""}`
          replacements.push({
            start: node.getStart(sourceFile),
            end: node.getEnd(),
            text: nextText,
          })
        }
      }

      if (ts.isJsxAttribute(node) && node.initializer && JSX_ATTRS.has(node.name.text)) {
        if (ts.isStringLiteral(node.initializer)) {
          const normalized = normalizeText(node.initializer.text)
          if (isLikelyUserVisibleText(normalized)) {
            const key = makeKey(normalized, node.name.text.replace(/[^a-zA-Z0-9]+/g, "_"))
            addLocaleEntry(key, normalized)
            replacements.push({
              start: node.initializer.getStart(sourceFile),
              end: node.initializer.getEnd(),
              text: `{t("${key}")}`,
            })
          }
        }
      }

      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        TS_UI_PROP_NAMES.has(node.name.text) &&
        ts.isStringLiteral(node.initializer)
      ) {
        const normalized = normalizeText(node.initializer.text)
        if (isLikelyUserVisibleText(normalized)) {
          const key = makeKey(normalized, `prop_${node.name.text}`)
          addLocaleEntry(key, normalized)
          replacements.push({
            start: node.initializer.getStart(sourceFile),
            end: node.initializer.getEnd(),
            text: `t("${key}")`,
          })
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)

    if (replacements.length === 0) {
      continue
    }

    sourceText = applyReplacements(sourceText, replacements)

    const needsUseTranslation = !/\bconst\s*{\s*t\b[^}]*}\s*=\s*useTranslation\(/.test(sourceText)
    if (needsUseTranslation) {
      const refreshedSourceFile = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JSX,
      )

      sourceText = ensureUseTranslationImport(refreshedSourceFile, sourceText)
      const withImportSourceFile = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JSX,
      )
      const hookInsertion = findHookInsertion(withImportSourceFile, sourceText)
      if (!hookInsertion) {
        skippedFiles.push(rel(filePath))
        continue
      }
      sourceText =
        sourceText.slice(0, hookInsertion.pos) +
        hookInsertion.text +
        sourceText.slice(hookInsertion.pos)

      sourceText = ensureUseClientDirective(sourceText)
    }

    fs.writeFileSync(filePath, sourceText)
    changedFiles += 1
  }

  // Always ensure key coverage for known missing reviewer statuses.
  const missingStatusKeys = {
    "dashboard.roles.reviewer.papers.table.actions": {
      en: "Actions",
      vi: "Hành động",
    },
    "dashboard.roles.reviewer.papers.statusValues.not_started": {
      en: "Not Started",
      vi: "Chưa bắt đầu",
    },
    "dashboard.roles.reviewer.papers.statusValues.accepted": {
      en: "Accepted",
      vi: "Đã chấp nhận",
    },
    "dashboard.roles.reviewer.papers.statusValues.declined": {
      en: "Declined",
      vi: "Đã từ chối",
    },
    "dashboard.roles.reviewer.papers.statusValues.submitted": {
      en: "Submitted",
      vi: "Đã nộp",
    },
  }

  for (const [key, value] of Object.entries(missingStatusKeys)) {
    setNestedValue(enJson, key, value.en)
    setNestedValue(viJson, key, value.vi)
  }

  for (const [key, enValue] of newLocaleEntries.entries()) {
    setNestedValue(enJson, key, enValue)
    setNestedValue(viJson, key, translateFallback(enValue, existingMap))
  }

  fs.writeFileSync(LOCALES_EN_PATH, `${JSON.stringify(enJson, null, 2)}\n`)
  fs.writeFileSync(LOCALES_VI_PATH, `${JSON.stringify(viJson, null, 2)}\n`)

  console.log(
    JSON.stringify(
      {
        changedFiles,
        generatedKeys: newLocaleEntries.size,
        skippedFiles,
      },
      null,
      2,
    ),
  )
}

run()
