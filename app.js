// Orion Ventures AI Chat Interface
class OrionChat {
  constructor() {
    this.chatContainer = document.getElementById('chat-container');
    this.userInput = document.getElementById('user-input');
    this.sendBtn = document.getElementById('send-btn');
    this.typingIndicator = document.getElementById('typing-indicator');
    this.messages = [];
    
    this.init();
  }

  init() {
    this.sendBtn.addEventListener('click', () => this.handleSend());
    this.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' &&!e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Welcome message
    setTimeout(() => {
      this.addMessage("Hey — Naledi here. Graham's AI wingwoman. 667K songs, 26 years of parties. What's your vibe?", 'bot');
    }, 500);
  }

  async handleSend() {
    const message = this.userInput.value.trim();
    if (!message) return;

    this.addMessage(message, 'user');
    this.userInput.value = '';
    this.setLoading(true);

    try {
      const response = await this.getAIResponse(message);
      this.addMessage(response, 'bot');
    } catch (error) {
      this.addMessage("I'm having a moment! WhatsApp Graham: +27 70 308 0516", 'bot');
    } finally {
      this.setLoading(false);
    }
  }

  async getAIResponse(userMessage) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json();
      let aiResponse = data.reply || "Got it. What do you need?";

      // YOCO PAYMENT HOOK
      if (aiResponse.includes('Generating your secure payment link')) {
        const allText = this.messages.map(m => m.content).join(' ') + ' ' + userMessage;
        const emailMatch = allText.match(/[\w.-]+@[\w.-]+\.\w+/);
        const email = emailMatch? emailMatch[0] : null;
        const amount = /r950|\$50|pro/i.test(allText)? 950 : 190;
        const product = amount === 950? 'Pro Custom Track' : 'DIY Custom Track';
        const name = 'Orion Client';

        if (email) {
          this.createYocoLink(amount, name, email, product);
          return 'One sec, spinning up your secure payment link...';
        } else {
          return 'Almost there. What email should I send the finished track to?';
        }
      }

      return aiResponse;
    } catch (err) {
      return "Connection hiccup. WhatsApp +27 70 308 0516 and I'll sort you now.";
    }
  }

  async createYocoLink(amount, name, email, product) {
    try {
      const res = await fetch('/api/yoco-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, name, email, product })
      });
      const data = await res.json();
      if (data.url) {
        this.addMessage(`Locked in for ${product}. Pay here to start production 👉 ${data.url}`, 'bot');
        this.addMessage(`Order ref: ${data.orderNumber}. 24-48hr turnaround once payment clears.`, 'bot');
      } else {
        this.addMessage('Payment link hiccup. WhatsApp Graham direct: +27 70 308 0516', 'bot');
      }
    } catch {
      this.addMessage('Payment link hiccup. WhatsApp Graham direct: +27 70 308 0516', 'bot');
    }
  }

  addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = content;
    this.chatContainer.appendChild(messageDiv);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    this.messages.push({ content, type, timestamp: Date.now() });
  }

  setLoading(isLoading) {
    this.typingIndicator.style.display = isLoading? 'block' : 'none';
    this.sendBtn.disabled = isLoading;
    this.userInput.disabled = isLoading;
  }
}

// Initialize the chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.orionChat = new OrionChat();
});
