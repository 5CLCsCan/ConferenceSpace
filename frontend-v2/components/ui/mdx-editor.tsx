"use client"

import { forwardRef } from "react"
import {
  MDXEditor as BaseMDXEditor,
  MDXEditorMethods,
  MDXEditorProps,
  toolbarPlugin,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  thematicBreakPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  markdownShortcutPlugin,
  frontmatterPlugin,
  directivesPlugin,
  AdmonitionDirectiveDescriptor,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  CodeToggle,
  InsertCodeBlock,
  Separator,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
  StrikeThroughSupSubToggles,
  InsertAdmonition,
} from "@mdxeditor/editor"
import "@mdxeditor/editor/style.css"

interface RichEditorProps extends Omit<MDXEditorProps, "plugins"> {
  className?: string
  contentEditableClassName?: string
  placeholder?: string
  imageUploadHandler?: (image: File) => Promise<string>
  readOnly?: boolean
}

const RichEditor = forwardRef<MDXEditorMethods, RichEditorProps>(
  (
    {
      className = "",
      contentEditableClassName = "",
      placeholder = "Start typing...",
      imageUploadHandler,
      readOnly = false,
      ...props
    },
    ref,
  ) => {
    const defaultImageUploadHandler = async (image: File): Promise<string> => {
      // Default: convert to base64 data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(image)
      })
    }

    const plugins = [
      headingsPlugin(),
      listsPlugin(),
      quotePlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      imagePlugin({
        imageUploadHandler: imageUploadHandler || defaultImageUploadHandler,
      }),
      tablePlugin(),
      thematicBreakPlugin(),
      codeBlockPlugin({ defaultCodeBlockLanguage: "text" }),
      codeMirrorPlugin({
        codeBlockLanguages: {
          text: "Plain Text",
          js: "JavaScript",
          jsx: "JavaScript (React)",
          ts: "TypeScript",
          tsx: "TypeScript (React)",
          css: "CSS",
          html: "HTML",
          python: "Python",
          markdown: "Markdown",
          json: "JSON",
          sql: "SQL",
          bash: "Bash",
          shell: "Shell",
        },
      }),
      markdownShortcutPlugin(),
      frontmatterPlugin(),
      directivesPlugin({
        directiveDescriptors: [AdmonitionDirectiveDescriptor],
      }),
      toolbarPlugin({
        toolbarClassName: "mdx-editor-toolbar",
        toolbarContents: () => (
          <ConditionalContents
            options={[
              {
                when: (editor) => editor?.editorType === "codeblock",
                contents: () => <ChangeCodeMirrorLanguage />,
              },
              {
                fallback: () => (
                  <>
                    <UndoRedo />
                    <Separator />
                    <BoldItalicUnderlineToggles />
                    <StrikeThroughSupSubToggles />
                    <CodeToggle />
                    <Separator />
                    <BlockTypeSelect />
                    <Separator />
                    <ListsToggle />
                    <Separator />
                    <CreateLink />
                    <InsertImage />
                    <InsertTable />
                    <InsertThematicBreak />
                    <Separator />
                    <InsertCodeBlock />
                    <InsertAdmonition />
                  </>
                ),
              },
            ]}
          />
        ),
      }),
    ]

    return (
      <BaseMDXEditor
        ref={ref}
        plugins={plugins}
        className={`mdx-editor-wrapper ${className}`}
        contentEditableClassName={`mdx-editor-content ${contentEditableClassName}`}
        placeholder={placeholder}
        readOnly={readOnly}
        {...props}
      />
    )
  },
)

RichEditor.displayName = "RichEditor"

export { RichEditor }
export type { RichEditorProps, MDXEditorMethods }
