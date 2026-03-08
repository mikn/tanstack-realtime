/**
 * CSS-in-JS styles for the devtools panel.
 *
 * All styles are inline objects to avoid any CSS dependency or build step.
 * Colours follow the TanStack brand palette.
 */

import type { CSSProperties } from 'react'

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
  // Toggle button (floating)
  toggleButton: {
    position: 'fixed',
    bottom: '12px',
    left: '12px',
    zIndex: 99999,
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.accent,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fontSans,
    fontSize: '18px',
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    padding: 0,
  } satisfies CSSProperties,

  // Panel container
  panel: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99998,
    height: '360px',
    background: colors.bg,
    borderTop: `1px solid ${colors.border}`,
    fontFamily: fontMono,
    fontSize: baseFontSize,
    color: colors.text,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
  } satisfies CSSProperties,

  // Header bar
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 12px',
    background: colors.bgAlt,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  } satisfies CSSProperties,

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } satisfies CSSProperties,

  headerTitle: {
    fontFamily: fontSans,
    fontWeight: 700,
    fontSize: '13px',
    color: colors.accent,
  } satisfies CSSProperties,

  statusBadge: (status: string): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: fontSans,
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

  statusDot: (status: string): CSSProperties => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background:
      status === 'connected'
        ? colors.green
        : status === 'reconnecting'
          ? colors.yellow
          : colors.red,
  }),

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  } satisfies CSSProperties,

  // Tabs
  tabBar: {
    display: 'flex',
    gap: '0',
    borderBottom: `1px solid ${colors.border}`,
    background: colors.bgAlt,
    flexShrink: 0,
  } satisfies CSSProperties,

  tab: (active: boolean): CSSProperties => ({
    padding: '6px 14px',
    border: 'none',
    borderBottom: active
      ? `2px solid ${colors.accent}`
      : '2px solid transparent',
    background: 'transparent',
    color: active ? colors.text : colors.textMuted,
    cursor: 'pointer',
    fontFamily: fontSans,
    fontSize: '12px',
    fontWeight: active ? 600 : 400,
    transition: 'color 0.1s',
  }),

  tabCount: {
    marginLeft: '4px',
    padding: '0 5px',
    borderRadius: '9999px',
    background: colors.surface,
    fontSize: '10px',
    color: colors.textMuted,
    fontWeight: 600,
  } satisfies CSSProperties,

  // Content area
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 12px',
  } satisfies CSSProperties,

  // Channels tab
  channelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
    borderRadius: '4px',
    marginBottom: '2px',
  } satisfies CSSProperties,

  channelName: {
    fontFamily: fontMono,
    fontSize: '12px',
    color: colors.blue,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '60%',
  } satisfies CSSProperties,

  channelMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: colors.textDim,
  } satisfies CSSProperties,

  // Messages tab
  messageRow: (direction: 'inbound' | 'outbound'): CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '4px 8px',
    borderRadius: '4px',
    marginBottom: '2px',
    borderLeft: `3px solid ${direction === 'inbound' ? colors.blue : colors.accentAlt}`,
  }),

  messageDirection: (direction: 'inbound' | 'outbound'): CSSProperties => ({
    flexShrink: 0,
    fontSize: '10px',
    fontWeight: 700,
    fontFamily: fontSans,
    textTransform: 'uppercase',
    color: direction === 'inbound' ? colors.blue : colors.accentAlt,
    width: '24px',
    marginTop: '2px',
  }),

  messageChannel: {
    flexShrink: 0,
    color: colors.textMuted,
    fontSize: '11px',
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '1px',
  } satisfies CSSProperties,

  messageData: {
    flex: 1,
    color: colors.text,
    fontSize: '11px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    lineHeight: '1.4',
  } satisfies CSSProperties,

  messageTime: {
    flexShrink: 0,
    fontSize: '10px',
    color: colors.textDim,
    marginTop: '2px',
  } satisfies CSSProperties,

  // Events tab
  eventRow: (type: string): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    marginBottom: '2px',
    borderLeft: `3px solid ${
      type === 'connect' || type === 'reconnect'
        ? colors.green
        : type === 'disconnect'
          ? colors.red
          : colors.blue
    }`,
  }),

  eventType: {
    flexShrink: 0,
    fontSize: '10px',
    fontWeight: 700,
    fontFamily: fontSans,
    textTransform: 'uppercase',
    width: '80px',
  } satisfies CSSProperties,

  eventDetail: {
    flex: 1,
    fontSize: '11px',
    color: colors.textMuted,
  } satisfies CSSProperties,

  eventTime: {
    flexShrink: 0,
    fontSize: '10px',
    color: colors.textDim,
  } satisfies CSSProperties,

  // Small icon-style button
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    border: 'none',
    borderRadius: '4px',
    background: 'transparent',
    color: colors.textMuted,
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0,
  } satisfies CSSProperties,

  // Empty state
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: colors.textDim,
    fontFamily: fontSans,
    fontSize: '13px',
  } satisfies CSSProperties,

  // Client info section
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '4px 16px',
    padding: '8px',
    fontSize: '12px',
  } satisfies CSSProperties,

  infoLabel: {
    color: colors.textDim,
    fontFamily: fontSans,
    fontWeight: 600,
  } satisfies CSSProperties,

  infoValue: {
    color: colors.text,
    fontFamily: fontMono,
  } satisfies CSSProperties,
} as const
