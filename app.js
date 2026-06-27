class NalediChat {
  constructor(containerId, inputId, sendBtnId) {
    this.chatBox = document.getElementById(containerId);
    this.input = document.getElementById(inputId);
    this.sendBtn = document.getElementById(sendBtnId);
    this.apiUrl = 'https://helpme-api.orion269.workers.dev/api/incoming';
    this.sessionId = localStorage.getItem('naledi_session') || 'web_' + crypto.randomUUID();
    localStorage.setItem('naledi_session', this.sessionId);
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
    const typingEl = document.getElementById('nalediTyping');
    if (typingEl) typingEl.style.display = 'block';
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, from: this.sessionId, name: 'Website Visitor' })
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
      const menu = document.getElementById('mobileMenu');
      hamburger.classList.toggle('open');
      menu.classList.toggle('open');
    };
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.mobile-menu a')) {
      const menu = document.getElementById('mobileMenu');
      if (menu) menu.classList.remove('open');
      if (hamburger) hamburger.classList.remove('open');
    }
  });

  const nav = document.getElementById('nav');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
