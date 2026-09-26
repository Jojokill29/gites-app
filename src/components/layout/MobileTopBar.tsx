interface MobileTopBarProps {
  title: string
  /** Shown in mono on the right — replaces the desktop logout button. */
  identifier?: string
}

// 52px header, charte-graphique.md
export default function MobileTopBar({ title, identifier }: MobileTopBarProps) {
  return (
    <header className="bg-header border-b border-border h-[52px] flex items-center justify-between gap-3 px-5">
      <span className="font-semibold text-[15px] text-text truncate">
        {title}
      </span>
      {identifier && (
        <span className="font-mono text-[11px] text-text-muted shrink-0">
          {identifier}
        </span>
      )}
    </header>
  )
}
