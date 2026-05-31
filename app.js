/* ═══════════════════════════════════════════════
   Orion Ventures — Main Site
   App Logic: Nav, Chat, Scroll Effects
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Elements ── */
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section, .hero');
  const heroCursor = document.querySelector('.hero-cursor');
  const heroTagline = document.querySelector('.hero-tagline');
  const chatFab = document.getElementById('chatFab');
  const chatPopup = document.getElementById('chatPopup');
  const chatClose = document.getElementById('chatClose');
  const chatPreview = document.getElementById('chatPreview');
  const toast = document.getElementById('toast');

  /* ── Chat state ── */
  let chatHistory = [];

  /* ── Nav Hide/Show on Scroll ── */
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const current = window.pageYOffset;
    if (current > lastScroll && current > 100) {
      nav.classList.add('hidden');
    } else {
      nav.classList.remove('hidden');
    }
    lastScroll = current;

    // Active nav link based on scroll position
    let active = 'hero';
    sections.forEach(sec => {
      const top = sec.offsetTop - 150;
      const bottom = top + sec.offsetHeight;
      if (current >= top && current < bottom) {
        active = sec.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${active}`);
    });
  });

  /* ── Mobile Hamburger ── */
  let mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) {
    mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    mobileMenu.id = 'mobileMenu';
    document.querySelectorAll('.nav-link').forEach(link => {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = link.textContent;
      a.className = link.className;
      mobileMenu.appendChild(a);
    });
    document.body.appendChild(mobileMenu);
  }

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ── Chat FAB toggle ── */
  if (chatFab && chatPopup && chatClose) {
    chatFab.addEventListener('click', () => {
      chatPopup.classList.toggle('open');
    });
    chatClose.addEventListener('click', () => {
      chatPopup.classList.remove('open');
    });

    // Chat popup send
    const popupInput = document.getElementById('chatPopupInput');
    const popupSend = document.getElementById('chatPopupSend');
    const popupMessages = document.getElementById('chatPopupMessages');

    function sendPopupMessage() {
      const text = popupInput.value.trim();
      if (!text) return;
      popupInput.value = '';
      addChatMessage(popupMessages, text, 'user');
      getAIResponse(text, popupMessages);
    }

    popupSend.addEventListener('click', sendPopupMessage);
    popupInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendPopupMessage(); });
  }

  /* ── Chat section widget ── */
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');

  if (chatSend && chatInput && chatMessages) {
    function sendSectionMessage() {
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      addChatMessage(chatMessages, text, 'user');
      getAIResponse(text, chatMessages);
    }

    chatSend.addEventListener('click', sendSectionMessage);
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendSectionMessage(); });
  }

  /* ── Chat helpers ── */
  function addChatMessage(container, text, role) {
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg-${role}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  async function getAIResponse(text, container) {
    // Show typing indicator
    const typing = document.createElement('div');
    typing.className = 'chat-msg chat-msg-bot';
    typing.textContent = '...';
    typing.id = 'typingIndicator';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();

      // Remove typing indicator
      const indicator = document.getElementById('typingIndicator');
      if (indicator) indicator.remove();

      const reply = data.reply || data.message || "Sorry, I couldn't process that.";
      addChatMessage(container, reply, 'bot');
    } catch (err) {
      const indicator = document.getElementById('typingIndicator');
      if (indicator) indicator.remove();
      addChatMessage(container, "I'm having trouble connecting right now. Please try again or WhatsApp me directly.", 'bot');
    }
  }

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  console.log('%c Orion Ventures ', 'background:#000;color:#39FF14;font-size:14px;font-weight:bold;padding:4px 8px;border-radius:4px;');
  console.log('%c Built with determination in Durban ', 'color:#a0a0a0;font-size:12px;');
});
