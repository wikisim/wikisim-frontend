import { Extension } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Mention from '@tiptap/extension-mention'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import { EditorContent, ReactRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import tippy from 'tippy.js'

// Single line extension to enforce single line behavior
const SingleLineExtension = Extension.create({
  name: 'singleLine',

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        // Prevent Enter key from creating new lines
        return true
      },
      'Shift-Enter': () => {
        // Also prevent Shift+Enter
        return true
      },
    }
  },
})

// Mention suggestion component
function MentionList({ items, command, range }: any) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = items[index]
    if (item) {
      command({
        id: item.id,
        label: item.label,
        data: item // Store additional data for the chip
      })
    }
  }

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  return (
    <div className="mention-suggestions">
      {items.map((item: any, index: number) => (
        <div
          key={item.id}
          className={`mention-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => selectItem(index)}
        >
          <strong>{item.label}</strong>
          <div className="mention-description">{item.description}</div>
        </div>
      ))}
    </div>
  )
}

// Custom mention extension with chip functionality
const CustomMention = Mention.extend({
  name: 'customMention',

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('span')
      dom.className = 'mention-chip'
      dom.setAttribute('data-id', node.attrs.id)
      dom.setAttribute('data-label', node.attrs.label)
      dom.textContent = `@${node.attrs.label}`

      // Make chip clickable and editable
      dom.addEventListener('click', (e) => {
        e.preventDefault()
        // You could open an edit modal here
        console.log('Clicked mention:', node.attrs)
      })

      // Add delete functionality
      dom.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const pos = getPos()
          if (pos !== undefined) {
            editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run()
          }
        }
      })

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'customMention') return false
          dom.setAttribute('data-id', updatedNode.attrs.id)
          dom.setAttribute('data-label', updatedNode.attrs.label)
          dom.textContent = `@${updatedNode.attrs.label}`
          return true
        }
      }
    }
  }
})

// Context menu component
function ContextMenu({ x, y, onClose, editor }: any) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const formatText = (format: string) => {
    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run()
        break
      case 'italic':
        editor.chain().focus().toggleItalic().run()
        break
      case 'underline':
        editor.chain().focus().toggleUnderline().run()
        break
      case 'strike':
        editor.chain().focus().toggleStrike().run()
        break
      case 'highlight':
        editor.chain().focus().toggleHighlight().run()
        break
    }
    onClose()
  }

  const insertLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 1000
      }}
    >
      <div className="context-menu-group">
        <button onClick={() => document.execCommand('copy')}>Copy</button>
        <button onClick={() => document.execCommand('cut')}>Cut</button>
        <button onClick={() => document.execCommand('paste')}>Paste</button>
      </div>
      <div className="context-menu-divider"></div>
      <div className="context-menu-group">
        <button onClick={() => formatText('bold')}>Bold</button>
        <button onClick={() => formatText('italic')}>Italic</button>
        <button onClick={() => formatText('underline')}>Underline</button>
        <button onClick={() => formatText('strike')}>Strikethrough</button>
        <button onClick={() => formatText('highlight')}>Highlight</button>
      </div>
      <div className="context-menu-divider"></div>
      <div className="context-menu-group">
        <button onClick={insertLink}>Insert Link</button>
      </div>
    </div>
  )
}

interface TipTapEditorProps {
  initialContent?: string
  singleLine?: boolean
  autoFocus?: boolean
  selectAllOnFocus?: boolean
  onUpdate?: (json: any, html: string) => void
  label?: string
}

export function TipTapEditor({
  initialContent = '',
  singleLine = false,
  autoFocus = false,
  selectAllOnFocus = false,
  onUpdate,
  label = 'Start typing...'
}: TipTapEditorProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null)
  const [searchModal, setSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data for mentions
  const mockMentions = [
    { id: '1', label: 'John Doe', description: 'Software Engineer' },
    { id: '2', label: 'Jane Smith', description: 'Product Manager' },
    { id: '3', label: 'Mike Johnson', description: 'Designer' },
    { id: '4', label: 'Sarah Wilson', description: 'Data Scientist' },
  ]

  const suggestion = {
    items: ({ query }: { query: string }) => {
      return mockMentions.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    },

    render: () => {
      let component: ReactRenderer
      let popup: any

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          })

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },

        onUpdate(props: any) {
          component.updateProps(props)
          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          })
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup[0].hide()
            return true
          }
          return component.ref?.onKeyDown?.(props)
        },

        onExit() {
          popup[0].destroy()
          component.destroy()
        },
      }
    },
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // For single line mode, keep paragraph but disable block elements
        heading: singleLine ? false : undefined,
        bulletList: singleLine ? false : undefined,
        orderedList: singleLine ? false : undefined,
        blockquote: singleLine ? false : undefined,
        codeBlock: singleLine ? false : undefined,
        horizontalRule: singleLine ? false : undefined,
      }),
      // Add single line extension only when in single line mode
      ...(singleLine ? [SingleLineExtension] : []),
      Highlight,
      Typography,
      Underline,
      CustomMention.configure({
        HTMLAttributes: {
          class: 'mention-chip',
        },
        suggestion,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
    ],
    content: initialContent,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ${singleLine ? 'single-line' : ''}`,
      },
      handleKeyDown: (view, event) => {
        // Prevent new lines in single line mode
        if (singleLine && event.key === 'Enter') {
          event.preventDefault()
          return true
        }

        // Handle keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 'b':
              event.preventDefault()
              editor?.chain().focus().toggleBold().run()
              return true
            case 'i':
              event.preventDefault()
              editor?.chain().focus().toggleItalic().run()
              return true
            case 'u':
              event.preventDefault()
              editor?.chain().focus().toggleUnderline().run()
              return true
            case 'k':
              event.preventDefault()
              const url = window.prompt('Enter URL:')
              if (url) {
                editor?.chain().focus().setLink({ href: url }).run()
              }
              return true
          }
        }
        return false
      },
      handleDOMEvents: {
        contextmenu: (view, event) => {
          event.preventDefault()
          setContextMenu({ x: event.clientX, y: event.clientY })
          return true
        },
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      const html = editor.getHTML()
      onUpdate?.(json, html)
    },
  })

  // Select all text on focus if specified
  useEffect(() => {
    if (editor && selectAllOnFocus && autoFocus) {
      setTimeout(() => {
        editor.commands.selectAll()
      }, 100)
    }
  }, [editor, selectAllOnFocus, autoFocus])

  // Handle @ symbol for search modal
  useEffect(() => {
    if (!editor) return

    const handleTransaction = () => {
      const { selection } = editor.state
      const { from } = selection
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 10), from, '\0', '\0')

      if (textBefore.endsWith('@')) {
        setSearchModal(true)
      }
    }

    editor.on('transaction', handleTransaction)
    return () => editor.off('transaction', handleTransaction)
  }, [editor])

  const insertMention = useCallback((item: any) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from })
        .insertContent({
          type: 'customMention',
          attrs: {
            id: item.id,
            label: item.label,
          },
        })
        .run()
    }
    setSearchModal(false)
    setSearchQuery('')
  }, [editor])

  const getEditorData = useCallback(() => {
    if (!editor) return { json: null, html: '', text: '' }

    return {
      json: editor.getJSON(),
      html: editor.getHTML(),
      text: editor.getText(),
    }
  }, [editor])

  const setEditorContent = useCallback((content: any) => {
    if (editor) {
      editor.commands.setContent(content)
    }
  }, [editor])

  return (
    <div className="tiptap-editor-container">
      <div className="editor-toolbar">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={editor?.isActive('bold') ? 'active' : ''}
        >
          Bold
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={editor?.isActive('italic') ? 'active' : ''}
        >
          Italic
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHighlight().run()}
          className={editor?.isActive('highlight') ? 'active' : ''}
        >
          Highlight
        </button>
        {!singleLine && (
          <>
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor?.isActive('heading', { level: 2 }) ? 'active' : ''}
            >
              H2
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={editor?.isActive('bulletList') ? 'active' : ''}
            >
              Bullet List
            </button>
          </>
        )}
        <button onClick={() => console.log('Editor data:', getEditorData())}>
          Get JSON
        </button>
      </div>

      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          editor={editor}
          onClose={() => setContextMenu(null)}
        />
      )}

      {searchModal && (
        <div className="search-modal-overlay" onClick={() => setSearchModal(false)}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <h3>Search People</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              placeholder="Type to search..."
              autoFocus
            />
            <div className="search-results">
              {mockMentions
                .filter(item =>
                  item.label.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(item => (
                  <div
                    key={item.id}
                    className="search-result-item"
                    onClick={() => insertMention(item)}
                  >
                    <strong>{item.label}</strong>
                    <div>{item.description}</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tiptap-editor-container {
          border: 1px solid #ccc;
          border-radius: 8px;
          overflow: hidden;
        }

        .editor-toolbar {
          background: #f5f5f5;
          border-bottom: 1px solid #ccc;
          padding: 8px;
          display: flex;
          gap: 8px;
        }

        .editor-toolbar button {
          padding: 4px 8px;
          border: 1px solid #ccc;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .editor-toolbar button.active {
          background: #007bff;
          color: white;
        }

        .editor-content {
          padding: 16px;
          min-height: 200px;
        }

        .single-line .ProseMirror {
          white-space: nowrap;
          overflow-x: auto;
        }

        .mention-chip {
          background: #e3f2fd;
          color: #1976d2;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 0.9em;
          cursor: pointer;
          border: 1px solid #1976d2;
          display: inline-block;
          margin: 0 2px;
        }

        .mention-chip:hover {
          background: #bbdefb;
        }

        .editor-link {
          color: #1976d2;
          text-decoration: underline;
        }

        .context-menu {
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 4px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          min-width: 150px;
        }

        .context-menu button {
          display: block;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
        }

        .context-menu button:hover {
          background: #f5f5f5;
        }

        .context-menu-divider {
          height: 1px;
          background: #eee;
          margin: 4px 0;
        }

        .search-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .search-modal {
          background: white;
          border-radius: 8px;
          padding: 20px;
          width: 400px;
          max-height: 500px;
          overflow-y: auto;
        }

        .search-modal input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .search-result-item, .mention-item {
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        }

        .search-result-item:hover, .mention-item:hover {
          background: #f5f5f5;
        }

        .mention-item.selected {
          background: #e3f2fd;
        }

        .mention-suggestions {
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          max-height: 200px;
          overflow-y: auto;
        }

        .mention-description {
          font-size: 0.9em;
          color: #666;
        }

        .ProseMirror {
          outline: none;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
}

// Demo component showing different configurations
export function TipTapDemo() {
  const [singleLineContent, setSingleLineContent] = useState('')
  const [multiLineContent, setMultiLineContent] = useState('')

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>TipTap Editor Demo</h1>

      <h2>Single Line Editor</h2>
      <TipTapEditor
        singleLine={true}
        autoFocus={true}
        selectAllOnFocus={false}
        label="Single line input..."
        onUpdate={(json, html) => setSingleLineContent(html)}
      />
      <details style={{ marginTop: '10px' }}>
        <summary>Single Line Content</summary>
        <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
          {singleLineContent}
        </pre>
      </details>

      <h2 style={{ marginTop: '40px' }}>Multi Line Editor</h2>
      <TipTapEditor
        singleLine={false}
        autoFocus={false}
        selectAllOnFocus={false}
        label="Multi line input with full features..."
        onUpdate={(json, html) => setMultiLineContent(html)}
      />
      <details style={{ marginTop: '10px' }}>
        <summary>Multi Line Content</summary>
        <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
          {multiLineContent}
        </pre>
      </details>

      <div style={{ marginTop: '40px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Features Demonstrated:</h3>
        <ul>
          <li>✅ Single line vs multi-line mode</li>
          <li>✅ Auto-focus and text selection</li>
          <li>✅ @ symbol triggers mention search</li>
          <li>✅ Interactive chips/mentions</li>
          <li>✅ JSON serialization (click "Get JSON" button)</li>
          <li>✅ Corruption-resistant format</li>
          <li>✅ Right-click context menu</li>
          <li>✅ Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K)</li>
          <li>✅ Markdown shortcuts (##, *, etc.)</li>
          <li>✅ Link insertion</li>
        </ul>
      </div>
    </div>
  )
}
