import { Highlight, themes } from 'prism-react-renderer'
import { useEffect, useRef, useState } from 'react'

function inferLanguage(code: string, title?: string): string {
  if (title) {
    const ext = title.split('.').pop()?.toLowerCase()
    if (ext === 'ts' || ext === 'tsx') return 'tsx'
    if (ext === 'js' || ext === 'jsx') return 'jsx'
  }
  return 'tsx'
}

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const language = inferLanguage(code, title)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleCopy = () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- clipboard may be undefined in HTTP contexts
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(code.trim()).then(
      () => {
        setCopied(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setCopied(false), 2000)
      },
      () => {
        // Clipboard write failed (e.g. permissions denied)
      },
    )
  }

  return (
    <div className="code-block">
      {title && (
        <div className="code-block-header">
          <div className="code-title">{title}</div>
        </div>
      )}
      <button
        className="code-copy-btn"
        onClick={handleCopy}
        title="Copy to clipboard"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <Highlight theme={themes.nightOwl} code={code.trim()} language={language}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre>
            <code>
              {tokens.map((line, i) => (
                <span key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                  {'\n'}
                </span>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  )
}
