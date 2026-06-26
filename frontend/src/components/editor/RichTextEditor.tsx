'use client'

import { useRef, useCallback, useEffect } from 'react'
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link2, Image, Quote,
  Heading1, Heading2, Heading3, Code, Minus, Undo, Redo,
  Type, Palette,
} from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const COLORS = ['#000000', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#6b7280']
const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']

export default function RichTextEditor({ value, onChange, placeholder = 'Start writing...', minHeight = 400 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || ''
      }
    }
    isInternalChange.current = false
  }, [value])

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
    handleInput()
  }, [])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) exec('createLink', url)
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) exec('insertImage', url)
  }

  const insertHR = () => exec('insertHTML', '<hr/>')

  const ToolBtn = ({ onClick, active, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-all duration-150 ${active ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
    >
      {children}
    </button>
  )

  const Divider = () => <div className="w-px h-6 bg-gray-200 mx-1" />

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-gray-100 bg-gray-50/80 px-3 py-2 flex flex-wrap items-center gap-0.5">
        {/* History */}
        <ToolBtn onClick={() => exec('undo')} title="Undo"><Undo size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('redo')} title="Redo"><Redo size={15} /></ToolBtn>

        <Divider />

        {/* Text Style */}
        <select
          onChange={e => { if (e.target.value) exec('formatBlock', e.target.value); e.target.value = '' }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 cursor-pointer hover:border-gray-300 focus:outline-none"
          defaultValue=""
        >
          <option value="" disabled>Block</option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Quote</option>
          <option value="pre">Code Block</option>
        </select>

        <select
          onChange={e => { if (e.target.value) exec('fontSize', '3'); /* then override */ e.target.value = '' }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 cursor-pointer hover:border-gray-300 focus:outline-none ml-1"
          defaultValue=""
        >
          <option value="" disabled>Size</option>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <Divider />

        {/* Formatting */}
        <ToolBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)"><Bold size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)"><Italic size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)"><Underline size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough size={15} /></ToolBtn>

        <Divider />

        {/* Color */}
        <div className="relative group">
          <ToolBtn title="Text Color"><Palette size={15} /></ToolBtn>
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-xl shadow-xl p-2 hidden group-hover:flex gap-1 z-20">
            {COLORS.map(c => (
              <button key={c} onClick={() => exec('foreColor', c)}
                className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition"
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <Divider />

        {/* Headings */}
        <ToolBtn onClick={() => exec('formatBlock', 'h2')} title="Heading 2"><Heading2 size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'h3')} title="Heading 3"><Heading3 size={15} /></ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet List"><List size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered List"><ListOrdered size={15} /></ToolBtn>

        <Divider />

        {/* Alignment */}
        <ToolBtn onClick={() => exec('justifyLeft')} title="Align Left"><AlignLeft size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyCenter')} title="Align Center"><AlignCenter size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyRight')} title="Align Right"><AlignRight size={15} /></ToolBtn>

        <Divider />

        {/* Insert */}
        <ToolBtn onClick={insertLink} title="Insert Link"><Link2 size={15} /></ToolBtn>
        <ToolBtn onClick={insertImage} title="Insert Image"><Image size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'blockquote')} title="Blockquote"><Quote size={15} /></ToolBtn>
        <ToolBtn onClick={insertHR} title="Horizontal Line"><Minus size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'pre')} title="Code Block"><Code size={15} /></ToolBtn>

        <Divider />

        {/* Clear */}
        <ToolBtn onClick={() => exec('removeFormat')} title="Clear Formatting"><Type size={15} /></ToolBtn>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={e => {
          e.preventDefault()
          const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain')
          exec('insertHTML', text)
        }}
        className="outline-none px-6 py-5 prose prose-sm sm:prose-base max-w-none"
        style={{
          minHeight,
          fontFamily: "'Inter', 'DM Sans', -apple-system, sans-serif",
          lineHeight: 1.8,
          color: '#1f2937',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
        [contenteditable] h1 { font-size: 2em; font-weight: 700; margin: 0.8em 0 0.4em; color: #111827; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: 700; margin: 0.7em 0 0.3em; color: #1f2937; }
        [contenteditable] h3 { font-size: 1.25em; font-weight: 600; margin: 0.6em 0 0.3em; color: #374151; }
        [contenteditable] h4 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0 0.2em; color: #4b5563; }
        [contenteditable] p { margin: 0.5em 0; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] li { margin: 0.25em 0; }
        [contenteditable] blockquote { border-left: 4px solid #10b981; padding: 0.5em 1em; margin: 0.8em 0; background: #f0fdf4; border-radius: 0 8px 8px 0; color: #065f46; font-style: italic; }
        [contenteditable] pre { background: #1f2937; color: #e5e7eb; padding: 1em; border-radius: 10px; font-family: 'Fira Code', monospace; font-size: 0.9em; overflow-x: auto; margin: 0.8em 0; }
        [contenteditable] code { background: #f3f4f6; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; color: #dc2626; }
        [contenteditable] a { color: #2563eb; text-decoration: underline; }
        [contenteditable] img { max-width: 100%; height: auto; border-radius: 10px; margin: 0.8em 0; }
        [contenteditable] hr { border: none; border-top: 2px solid #e5e7eb; margin: 1.5em 0; }
        [contenteditable] strong { font-weight: 700; }
        [contenteditable] em { font-style: italic; }
        [contenteditable]:focus { box-shadow: none; }
      `}</style>
    </div>
  )
}
