import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
export const formatDate     = (d) => format(new Date(d), 'dd MMM yyyy')
export const formatDateTime = (d) => format(new Date(d), 'dd MMM yyyy, h:mm a')
export const timeAgo        = (d) => formatDistanceToNow(new Date(d), { addSuffix: true })
export const chatTimestamp  = (d) => { const date = new Date(d); if (isToday(date)) return format(date,'h:mm a'); if (isYesterday(date)) return 'Yesterday'; return format(date,'dd/MM/yyyy') }
