export function formatDate(dateString?: string): string {
  if (!dateString) return "No registrado";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "No registrado";
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return "No registrado";
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return "No registrado";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "No registrado";
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return "No registrado";
  }
}
