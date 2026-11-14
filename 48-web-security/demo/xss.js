// Stored XSS: a comment saved by one user is shown to others. If it is inserted as HTML, any markup in it
// runs in the victim's page. Escaping on output turns the markup back into plain text.
const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ENTITIES[character]);
}
// the HTML the page will insert for this comment
export function renderComment(comment, escapeOnOutput) {
  return escapeOnOutput ? escapeHtml(comment) : comment;
}
