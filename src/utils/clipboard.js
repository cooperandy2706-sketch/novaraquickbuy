/**
 * Robustly copy text to the clipboard with fallbacks for non-secure contexts.
 * @param {string} text - The text to copy.
 * @returns {Promise<boolean>} - Whether the copy was successful.
 */
export async function copyToClipboard(text) {
  if (!text) return false

  // 1. Modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('Modern clipboard copy failed, trying fallback...', err)
    }
  }

  // 2. Legacy Fallback (document.execCommand)
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // Prevent scrolling to bottom
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    return successful
  } catch (err) {
    console.error('Legacy clipboard copy failed:', err)
    return false
  }
}
