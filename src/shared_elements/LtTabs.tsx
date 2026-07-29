import React from 'react'
import { Tabs, TabsProps } from '@mantine/core'
import { Image, MessageSquare, Settings, FileText, Clipboard, Clock, Database, Terminal, Cpu, Layers, FileSpreadsheet } from 'lucide-react'

export interface LtTabItem {
  value: string
  label: string
  icon?: React.ComponentType<{ size?: number }>
  count?: number
  disabled?: boolean
}

export interface LtTabsProps {
  tabs: LtTabItem[]
  value: string
  onChange: (value: string | null) => void
  variant?: TabsProps['variant']
  fullWidth?: boolean
  className?: string
  style?: React.CSSProperties
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  gallery: Image,
  messages: MessageSquare,
  settings: Settings,
  summary: FileText,
  activity: Clipboard,
  visit: Clock,
  storage: Database,
  logs: Terminal,
  prompt: Cpu,
  workshop: FileSpreadsheet,
  bulk: Layers,
}

export function LtTabs({
  tabs,
  value,
  onChange,
  variant = 'outline',
  fullWidth = true,
  className,
  style,
}: LtTabsProps) {
  return (
    <Tabs
      variant={variant}
      value={value}
      onChange={onChange}
      className={className}
      style={style}
    >
      <Tabs.List style={{ flexWrap: 'nowrap', overflowX: 'auto', backgroundColor: 'transparent', border: 'none', padding: 'xs' }}>
        {tabs.map((tab) => {
          const IconComponent = tab.icon ?? ICON_MAP[tab.value]
          return (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              leftSection={IconComponent ? <IconComponent size={12} /> : undefined}
              disabled={tab.disabled}
              h={32}
              px="xs"
              style={{ whiteSpace: 'nowrap' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    style={{
                      height: 14,
                      padding: '0 4px',
                      fontSize: 9,
                      fontWeight: 600,
                      borderRadius: 'var(--mantine-radius-sm)',
                      backgroundColor: 'var(--mantine-color-gray-light)',
                      color: 'var(--mantine-color-gray)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </Tabs.Tab>
          )
        })}
      </Tabs.List>
    </Tabs>
  )
}

export function LtTabPanel({ value, children, activeValue }: { value: string; children: React.ReactNode; activeValue: string }) {
  return value === activeValue ? <>{children}</> : null
}