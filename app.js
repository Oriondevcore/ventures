class NalediChat {
  constructor(containerId, inputId, sendBtnId) {
    this.chatBox = document.getElementById(containerId);
    this.input = document.getElementById(inputId);
    this.sendBtn = document.getElementById(sendBtnId);
    if (this.sendBtn) this.sendBtn.onclick = () => this.handleSend();
    if (this.input) this.input.onkeypress = (e) => {
      if (e.key === 'Enter') this.handleSend();
    };
  }

  async handleSend() {
    const text = this.input.value.trim();
    if (!text) return;
    this.appendMsg('user', text);
    this.input.value = '';
    const typingEl = document.getElementById('naledi-typing');
    if (typingEl) typingEl.style.display = 'block';
    try {
      const response = await fetch('/naledi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();
      if (typingEl) typingEl.style.display = 'none';
      setTimeout(() => {
        this.appendMsg('bot', data.reply || "Naledi's thinking...");
      }, 400);
    } catch (e) {
      if (typingEl) typingEl.style.display = 'none';
      this.appendMsg('bot', 'Connection error. Try again?');
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

document.addEventListener('DOMContentLoaded', () => {
  new NalediChat('chatPopupMessages', 'chatPopupInput', 'chatPopupSend');

  const fab = document.getElementById('chatFab');
  const popup = document.getElementById('chatPopup');
  const close = document.getElementById('chatClose');
  if (fab && popup) {
    fab.onclick = () => popup.classList.toggle('open');
    if (close) close.onclick = () => popup.classList.remove('open');
  }

  const hamburger = document.getElementById('navHamburger');
  if (hamburger) {
    hamburger.onclick = () => {
      hamburger.classList.toggle('open');
      const menu = document.getElementById('mobileMenu');
      if (!menu) {
        const m = document.createElement('div');
        m.id = 'mobileMenu';
        m.className = 'mobile-menu';
        m.innerHTML = document.getElementById('navLinks').innerHTML;
        document.body.appendChild(m);
        setTimeout(() => m.classList.add('open'), 10);
      } else {
        menu.classList.toggle('open');
      }
    };
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.mobile-menu a')) {
      const menu = document.getElementById('mobileMenu');
      if (menu) menu.classList.remove('open');
      if (hamburger) hamburger.classList.remove('open');
    }
  });
});
