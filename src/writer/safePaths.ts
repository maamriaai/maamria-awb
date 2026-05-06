import path from 'node:path'

/**
 * Reject anything that could escape the project root once written.
 * The backend already does this server-side, but we re-validate here as
 * defence in depth — the CLI is the one actually touching the disk.
 */
export const isSafeRelativePath = (p: string): boolean => {
  if (!p || typeof p !== 'string') return false
  if (p.includes('\0')) return false
  if (path.isAbsolute(p)) return false
  // Windows drive letters
  if (/^[a-zA-Z]:[\\/]/.test(p)) return false
  const parts = p.replace(/\\/g, '/').split('/')
  if (parts.some((segment) => segment === '..')) return false
  return true
}

export const resolveSafe = (root: string, rel: string): string => {
  if (!isSafeRelativePath(rel)) {
    throw new Error(`Unsafe file path rejected: ${rel}`)
  }
  const resolved = path.resolve(root, rel)
  const rootResolved = path.resolve(root)
  if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
    throw new Error(`Path escapes project root: ${rel}`)
  }
  return resolved
}
