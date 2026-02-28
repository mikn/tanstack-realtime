import { Highlight, themes } from 'prism-react-renderer'

function inferLanguage(code: string, title?: string): string {
  if (title) {
    const ext = title.split('.').pop()?.toLowerCase()
    if (ext === 'ts' || ext === 'tsx') return 'tsx'
    if (ext === 'js' || ext === 'jsx') return 'jsx'
  }
  return 'tsx'
}

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  const language = inferLanguage(code, title)
  return (
    <div className="code-block">
      {title && <div className="code-title">{title}</div>}
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
