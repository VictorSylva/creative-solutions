document.addEventListener('DOMContentLoaded', () => {
  const inputEl = document.getElementById('chat-widget-input');
  const sendBtn = document.getElementById('chat-widget-send');
  const messagesContainer = document.getElementById('chat-widget-messages');
  const typingIndicator = document.getElementById('chat-widget-typing');

  if (!inputEl || !sendBtn || !messagesContainer) return;

  // Retrieve existing history & lead ID from session storage
  let chatHistory = JSON.parse(sessionStorage.getItem('cs_chat_history')) || [];
  let leadId = sessionStorage.getItem('creative_solutions_lead_id') || null;

  // Simple parser to render basic markdown bolding, lists and linebreaks as HTML
  const formatBotMessage = (text) => {
    // Escape HTML first to prevent XSS
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold text (**text**)
    escaped = escaped.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
    
    // Bullet lists (- item or * item)
    escaped = escaped.replace(/(?:^|\n)[-*]\s+(.+)/g, '<li class="chat-bullet-item">$1</li>');
    // Wrap consecutive list items in <ul>
    escaped = escaped.replace(/(<li class="chat-bullet-item">[\s\S]+?<\/li>)/g, '<ul class="chat-list">$1</ul>');
    // Clean up duplicated nested ul wrappers
    escaped = escaped.replace(/<\/ul>\s*<ul class="chat-list">/g, '');

    // Paragraphs / Linebreaks
    escaped = escaped.replace(/\n\n/g, '</p><p>');
    escaped = escaped.replace(/\n/g, '<br/>');

    return `<p>${escaped}</p>`;
  };

  const appendMessage = (sender, text) => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    
    if (sender === 'bot') {
      bubble.innerHTML = formatBotMessage(text);
    } else {
      bubble.textContent = text;
    }
    
    messagesContainer.appendChild(bubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  // Re-populate history if page is refreshed
  if (chatHistory.length > 0) {
    messagesContainer.innerHTML = '';
    chatHistory.forEach(msg => {
      appendMessage(msg.sender, msg.text);
    });
  }

  const sendMessage = async () => {
    const text = inputEl.value.trim();
    if (!text) return;

    // Append user message
    appendMessage('user', text);
    inputEl.value = '';

    // Record user history
    chatHistory.push({ sender: 'user', text });
    sessionStorage.setItem('cs_chat_history', JSON.stringify(chatHistory));

    // Show typing indicator
    typingIndicator.style.display = 'block';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory,
          leadId: leadId
        })
      });

      const data = await response.json();

      // Hide typing indicator
      typingIndicator.style.display = 'none';

      if (data.reply) {
        appendMessage('bot', data.reply);
        chatHistory.push({ sender: 'bot', text: data.reply });
        sessionStorage.setItem('cs_chat_history', JSON.stringify(chatHistory));
      }

      if (data.leadId) {
        leadId = data.leadId;
        sessionStorage.setItem('creative_solutions_lead_id', leadId);
      }
    } catch (err) {
      console.error("AI Chat Error:", err);
      typingIndicator.style.display = 'none';
      appendMessage('bot', "I'm having trouble connecting to my strategist brain right now. Can you please check your internet or retry shortly?");
    }
  };

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
});
