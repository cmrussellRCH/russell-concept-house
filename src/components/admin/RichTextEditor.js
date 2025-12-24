import { useEffect, useRef } from 'react'

export default function RichTextEditor({ id, value, onChange, placeholder }) {
  const editorRef = useRef(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || ''
    }
  }, [value])

  const applyCommand = (command, commandValue = null) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand(command, false, commandValue)
    if (onChange) {
      onChange(editor.innerHTML)
    }
  }

  const handleLink = () => {
    const url = window.prompt('Enter a URL')
    if (!url) return
    applyCommand('createLink', url)
  }

  return (
    <div className="admin-editor-shell">
      <div className="admin-toolbar" role="toolbar" aria-label="Rich text editor">
        <button type="button" onClick={() => applyCommand('bold')} aria-label="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => applyCommand('italic')} aria-label="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={handleLink} aria-label="Insert link">
          Link
        </button>
        <button type="button" onClick={() => applyCommand('unlink')} aria-label="Remove link">
          Unlink
        </button>
      </div>
      <div
        className="admin-editor"
        contentEditable
        ref={editorRef}
        id={id}
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={(event) => onChange?.(event.currentTarget.innerHTML)}
        onBlur={(event) => onChange?.(event.currentTarget.innerHTML)}
        suppressContentEditableWarning
      />
    </div>
  )
}
