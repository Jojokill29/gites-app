/**
 * Extract a human-readable display name from an email address.
 * "56johan.simon@gmail.com" → "Johan S."
 * "elcoltan@hotmail.com" → "Elcoltan"
 */
export function getDisplayName(email: string): string {
  const local = email.split('@')[0]
  // Remove leading digits
  const cleaned = local.replace(/^\d+/, '')
  // Split on dots, underscores, hyphens
  const parts = cleaned.split(/[._-]/).filter(Boolean)

  if (parts.length === 0) return email

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

  if (parts.length === 1) {
    return capitalize(parts[0])
  }

  // "Johan S." format
  return `${capitalize(parts[0])} ${parts[1].charAt(0).toUpperCase()}.`
}

/**
 * Extract initials for avatar display.
 * "56johan.simon@gmail.com" → "JS"
 * "elcoltan@hotmail.com" → "EL"
 */
export function getInitials(email: string): string {
  const local = email.split('@')[0]
  const cleaned = local.replace(/^\d+/, '')
  const parts = cleaned.split(/[._-]/).filter(Boolean)

  if (parts.length === 0) return '?'

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }

  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}
