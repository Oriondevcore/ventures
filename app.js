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

function openCheckout(product, amount, name) {
  const modal = document.getElementById('checkoutModal');
  const title = document.getElementById('checkoutTitle');
  const desc = document.getElementById('checkoutDesc');
  const nameInput = document.getElementById('checkoutName');
  const emailInput = document.getElementById('checkoutEmail');
  title.textContent = `Buy ${name}`;
  desc.textContent = product;
  nameInput.value = '';
  emailInput.value = '';
  modal.dataset.product = product;
  modal.dataset.amount = amount;
  modal.dataset.name = name;
  modal.classList.add('open');
}

async function handleCheckoutConfirm() {
  const modal = document.getElementById('checkoutModal');
  const name = document.getElementById('checkoutName').value.trim();
  const email = document.getElementById('checkoutEmail').value.trim();
  if (!name || !email) {
    alert('Please fill in your name and email.');
    return;
  }
  const confirmBtn = document.getElementById('checkoutConfirm');
  confirmBtn.textContent = 'Processing...';
  confirmBtn.disabled = true;
  try {
    const res = await fetch('/api/yoco-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(modal.dataset.amount),
        name,
        email,
        product: modal.dataset.product + ' — ' + modal.dataset.name
      })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Payment link failed. Please try again.');
      confirmBtn.textContent = 'Pay Now';
      confirmBtn.disabled = false;
    }
  } catch (e) {
    alert('Connection error. Please try again.');
    confirmBtn.textContent = 'Pay Now';
    confirmBtn.disabled = false;
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

  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openCheckout(
        btn.dataset.product,
        btn.dataset.amount,
        btn.dataset.name
      );
    };
  });

  document.getElementById('checkoutCancel').onclick = () => {
    document.getElementById('checkoutModal').classList.remove('open');
  };
  document.getElementById('checkoutModal').onclick = (e) => {
    if (e.target === e.currentTarget) {
      e.target.classList.remove('open');
    }
  };
  document.getElementById('checkoutConfirm').onclick = handleCheckoutConfirm;

  document.getElementById('orderTrackBtn').onclick = async () => {
    const song = document.getElementById('trackSong').value.trim();
    const artist = document.getElementById('trackArtist').value.trim();
    const key = document.getElementById('trackKey').value;
    const email = document.getElementById('trackEmail').value.trim();
    const notes = document.getElementById('trackNotes').value.trim();

    if (!song || !artist || !email) {
      alert('Please fill in the song name, artist, and your email.');
      return;
    }

    const btn = document.getElementById('orderTrackBtn');
    btn.textContent = 'Processing...';
    btn.disabled = true;

    try {
      const productDesc = `Custom Karaoke Track: ${song} — ${artist} (${key})`;
      const res = await fetch('/api/yoco-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 29,
          name: song + ' - ' + artist,
          email,
          product: productDesc + (notes ? ' | Notes: ' + notes : '')
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Payment link failed. Please try again.');
        btn.textContent = 'Order Track — $29';
        btn.disabled = false;
      }
    } catch (e) {
      alert('Connection error. Please try again.');
      btn.textContent = 'Order Track — $29';
      btn.disabled = false;
    }
  };
});
