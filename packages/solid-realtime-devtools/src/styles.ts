/**
 * CSS-in-JS styles for the devtools panel.
 *
 * All styles are inline objects to avoid any CSS dependency or build step.
 * Colours follow the TanStack brand palette.
 */

import type { JSX } from 'solid-js'

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const colors = {
  bg: '#1e1e2e',
  bgAlt: '#181825',
  surface: '#313244',
  surfaceHover: '#45475a',
  text: '#cdd6f4',
  textMuted: '#a6adc8',
  textDim: '#6c7086',
  accent: '#f38ba8',
  accentAlt: '#fab387',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  blue: '#89b4fa',
  red: '#f38ba8',
  purple: '#cba6f7',
  border: '#45475a',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const fontMono =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
const fontSans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

const baseFontSize = '12px'

// ---------------------------------------------------------------------------
// Component styles
// ---------------------------------------------------------------------------

export const styles = {
  toggleButton: {
    position: 'fixed',
    bottom: '12px',
    left: '12px',
    'z-index': 99999,
    width: '40px',
    height: '40px',
    'border-radius': '8px',
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.accent,
    cursor: 'pointer',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'font-family': fontSans,
    'font-size': '18px',
    'font-weight': 700,
    'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.4)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    padding: 0,
  } satisfies JSX.CSSProperties,

  panel: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    'z-index': 99998,
    height: '360px',
    background: colors.bg,
    'border-top': `1px solid ${colors.border}`,
    'font-family': fontMono,
    'font-size': baseFontSize,
    color: colors.text,
    display: 'flex',
    'flex-direction': 'column',
    'box-shadow': '0 -4px 20px rgba(0, 0, 0, 0.3)',
  } satisfies JSX.CSSProperties,

  header: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    padding: '6px 12px',
    background: colors.bgAlt,
    'border-bottom': `1px solid ${colors.border}`,
    'flex-shrink': 0,
  } satisfies JSX.CSSProperties,

  headerLeft: {
    display: 'flex',
    'align-items': 'center',
    gap: '12px',
  } satisfies JSX.CSSProperties,

  headerTitle: {
    'font-family': fontSans,
    'font-weight': 700,
    'font-size': '13px',
    color: colors.accent,
  } satisfies JSX.CSSProperties,

  statusBadge: (status: string): JSX.CSSProperties => ({
    display: 'inline-flex',
    'align-items': 'center',
    gap: '5px',
    padding: '2px 8px',
    'border-radius': '9999px',
    'font-size': '11px',
    'font-weight': 600,
    'font-family': fontSans,
    background:
      status === 'connected'
        ? 'rgba(166, 227, 161, 0.15)'
        : status === 'reconnecting'
          ? 'rgba(249, 226, 175, 0.15)'
          : 'rgba(243, 139, 168, 0.15)',
    color:
      status === 'connected'
        ? colors.green
        : status === 'reconnecting'
          ? colors.yellow
          : colors.red,
  }),

  statusDot: (status: string): JSX.CSSProperties => ({
    width: '6px',
    height: '6px',
    'border-radius': '50%',
    background:
      status === 'connected'
        ? colors.green
        : status === 'reconnecting'
          ? colors.yellow
          : colors.red,
  }),

  headerRight: {
    display: 'flex',
    'align-items': 'center',
    gap: '6px',
  } satisfies JSX.CSSProperties,

  tabBar: {
    display: 'flex',
    gap: '0',
    'border-bottom': `1px solid ${colors.border}`,
    background: colors.bgAlt,
    'flex-shrink': 0,
  } satisfies JSX.CSSProperties,

  tab: (active: boolean): JSX.CSSProperties => ({
    padding: '6px 14px',
    border: 'none',
    'border-bottom': active
      ? `2px solid ${colors.accent}`
      : '2px solid transparent',
    background: 'transparent',
    color: active ? colors.text : colors.textMuted,
    cursor: 'pointer',
    'font-family': fontSans,
    'font-size': '12px',
    'font-weight': active ? 600 : 400,
    transition: 'color 0.1s',
  }),

  tabCount: {
    'margin-left': '4px',
    padding: '0 5px',
    'border-radius': '9999px',
    background: colors.surface,
    'font-size': '10px',
    color: colors.textMuted,
    'font-weight': 600,
  } satisfies JSX.CSSProperties,

  content: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 12px',
  } satisfies JSX.CSSProperties,

  channelRow: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    padding: '6px 8px',
    'border-radius': '4px',
    'margin-bottom': '2px',
  } satisfies JSX.CSSProperties,

  channelName: {
    'font-family': fontMono,
    'font-size': '12px',
    color: colors.blue,
    overflow: 'hidden',
    'text-overflow': 'ellipsis',
    'white-space': 'nowrap',
    'max-width': '60%',
  } satisfies JSX.CSSProperties,

  channelMeta: {
    display: 'flex',
    gap: '12px',
    'font-size': '11px',
    color: colors.textDim,
  } satisfies JSX.CSSProperties,

  messageRow: (direction: 'inbound' | 'outbound'): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'flex-start',
    gap: '8px',
    padding: '4px 8px',
    'border-radius': '4px',
    'margin-bottom': '2px',
    'border-left': `3px solid ${direction === 'inbound' ? colors.blue : colors.accentAlt}`,
  }),

  messageDirection: (direction: 'inbound' | 'outbound'): JSX.CSSProperties => ({
    'flex-shrink': 0,
    'font-size': '10px',
    'font-weight': 700,
    'font-family': fontSans,
    'text-transform': 'uppercase',
    color: direction === 'inbound' ? colors.blue : colors.accentAlt,
    width: '24px',
    'margin-top': '2px',
  }),

  messageChannel: {
    'flex-shrink': 0,
    color: colors.textMuted,
    'font-size': '11px',
    'max-width': '180px',
    overflow: 'hidden',
    'text-overflow': 'ellipsis',
    'white-space': 'nowrap',
    'margin-top': '1px',
  } satisfies JSX.CSSProperties,

  messageDataExpandable: {
    flex: 1,
    color: colors.text,
    'font-size': '11px',
    'line-height': '1.4',
    cursor: 'pointer',
    overflow: 'hidden',
    'text-overflow': 'ellipsis',
    'white-space': 'nowrap',
  } satisfies JSX.CSSProperties,

  messageDataExpanded: {
    flex: 1,
    color: colors.text,
    'font-size': '11px',
    'white-space': 'pre-wrap',
    'word-break': 'break-all',
    'line-height': '1.4',
    background: colors.bgAlt,
    padding: '4px 6px',
    'border-radius': '4px',
    cursor: 'pointer',
    'font-family': fontMono,
  } satisfies JSX.CSSProperties,

  messageTime: {
    'flex-shrink': 0,
    'font-size': '10px',
    color: colors.textDim,
    'margin-top': '2px',
  } satisfies JSX.CSSProperties,

  eventRow: (type: string): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
    padding: '4px 8px',
    'margin-bottom': '2px',
    'border-left': `3px solid ${
      type === 'connect' || type === 'reconnect'
        ? colors.green
        : type === 'disconnect'
          ? colors.red
          : type === 'presence'
            ? colors.purple
            : type === 'queue'
              ? colors.yellow
              : colors.blue
    }`,
  }),

  eventType: {
    'flex-shrink': 0,
    'font-size': '10px',
    'font-weight': 700,
    'font-family': fontSans,
    'text-transform': 'uppercase',
    width: '80px',
  } satisfies JSX.CSSProperties,

  eventDetail: {
    flex: 1,
    'font-size': '11px',
    color: colors.textMuted,
  } satisfies JSX.CSSProperties,

  eventTime: {
    'flex-shrink': 0,
    'font-size': '10px',
    color: colors.textDim,
  } satisfies JSX.CSSProperties,

  iconButton: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    width: '24px',
    height: '24px',
    border: 'none',
    'border-radius': '4px',
    background: 'transparent',
    color: colors.textMuted,
    cursor: 'pointer',
    'font-size': '14px',
    padding: 0,
  } satisfies JSX.CSSProperties,

  empty: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    height: '100%',
    color: colors.textDim,
    'font-family': fontSans,
    'font-size': '13px',
  } satisfies JSX.CSSProperties,

  infoGrid: {
    display: 'grid',
    'grid-template-columns': 'auto 1fr',
    gap: '4px 16px',
    padding: '8px',
    'font-size': '12px',
  } satisfies JSX.CSSProperties,

  infoLabel: {
    color: colors.textDim,
    'font-family': fontSans,
    'font-weight': 600,
  } satisfies JSX.CSSProperties,

  infoValue: {
    color: colors.text,
    'font-family': fontMono,
  } satisfies JSX.CSSProperties,

  presenceSection: {
    'margin-top': '4px',
    padding: '4px 8px',
    'border-left': `2px solid ${colors.purple}`,
    'margin-left': '8px',
  } satisfies JSX.CSSProperties,

  presenceUserRow: {
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
    padding: '2px 0',
    'font-size': '11px',
  } satisfies JSX.CSSProperties,

  presenceDot: {
    width: '6px',
    height: '6px',
    'border-radius': '50%',
    background: colors.purple,
    'flex-shrink': 0,
  } satisfies JSX.CSSProperties,

  presenceConnectionId: {
    color: colors.textMuted,
    'font-family': fontMono,
    'font-size': '10px',
    'max-width': '120px',
    overflow: 'hidden',
    'text-overflow': 'ellipsis',
    'white-space': 'nowrap',
  } satisfies JSX.CSSProperties,

  presenceData: {
    flex: 1,
    color: colors.textDim,
    'font-family': fontMono,
    'font-size': '10px',
    overflow: 'hidden',
    'text-overflow': 'ellipsis',
    'white-space': 'nowrap',
  } satisfies JSX.CSSProperties,

  presenceCount: {
    'font-size': '10px',
    color: colors.purple,
    'font-weight': 600,
  } satisfies JSX.CSSProperties,

  queueFlushingBadge: {
    display: 'inline-flex',
    'align-items': 'center',
    gap: '4px',
    padding: '2px 8px',
    'border-radius': '9999px',
    'font-size': '10px',
    'font-weight': 600,
    'font-family': fontSans,
    background: 'rgba(249, 226, 175, 0.15)',
    color: colors.yellow,
  } satisfies JSX.CSSProperties,
} as const
