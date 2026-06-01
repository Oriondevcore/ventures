// app.js - Optimized for Naledi Integration
class NalediChat {
  constructor() {
    this.chatBox = document.getElementById('chatMessages');
    this.input = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('chatSend');
    
    // Bindings
    if (this.sendBtn) this.sendBtn.onclick = () => this.handleSend();
    if (this.input) this.input.onkeypress = (e) => { if (e.key === 'Enter') this.handleSend(); };
  }

  async handleSend() {
    const text = this.input.value.trim();
    if (!text) return;

    this.appendMsg('user', text);
    this.input.value = '';

    try {
      // NOTE: Pointing to the new /naledi/chat endpoint
      const response = await fetch('/naledi/chat', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      
      const data = await response.json();
      this.appendMsg('bot', data.reply || "Naledi is processing...");
    } catch (e) {
      console.error("Connection Error:", e);
      this.appendMsg('bot', "Connection error. Please try again.");
    }
  }

  appendMsg(sender, text) {
    if (!this.chatBox) return;
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg-${sender}`;
    div.textContent = text;
    this.chatBox.appendChild(div);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => new NalediChat());
