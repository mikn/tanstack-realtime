import { useState } from 'react'
import { CodeBlock } from './CodeBlock'

type Framework = 'react' | 'solid' | 'vue'

interface FrameworkTabsProps {
  react: { code: string; title?: string }
  solid: { code: string; title?: string }
  vue: { code: string; title?: string }
}

const labels: Record<Framework, string> = {
  react: 'React',
  solid: 'Solid',
  vue: 'Vue',
}

export function FrameworkTabs({ react, solid, vue }: FrameworkTabsProps) {
  const [active, setActive] = useState<Framework>('react')
  const tabs: Record<Framework, { code: string; title?: string }> = {
    react,
    solid,
    vue,
  }

  return (
    <div className="framework-tabs">
      <div className="framework-tab-bar">
        {(Object.keys(labels) as Array<Framework>).map((fw) => (
          <button
            key={fw}
            className={`framework-tab${active === fw ? ' active' : ''}`}
            onClick={() => setActive(fw)}
          >
            {labels[fw]}
          </button>
        ))}
      </div>
      <div className="framework-tab-content">
        <CodeBlock code={tabs[active].code} title={tabs[active].title} />
      </div>
    </div>
  )
}
