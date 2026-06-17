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

function getPublicKey() {
  return window.YOCO_PK || 'pk_live_ZGM2YjY0ZjEtZmZkYy00MDg4LWI5YzgtZDRkMjc4MGNiZGM4';
}

function showToast(msg, type) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  if (type === 'error') t.style.borderColor = 'var(--state-error)';
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 4000);
}

function setBtnLoading(btn, loading, text) {
  if (loading) {
    btn.dataset.orig = btn.textContent;
    btn.textContent = 'Processing...';
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.orig || text;
    btn.disabled = false;
  }
}

async function startYocoPayment(amount, name, email, product, orderRef) {
  try {
    const yoco = new YocoSDK({ publicKey: getPublicKey() });
    const result = await yoco.showPopup({
      amountInCents: Math.round(amount * 100),
      currency: 'ZAR',
      name: name,
      description: product,
      metadata: {
        customerName: name,
        customerEmail: email,
        orderNumber: orderRef,
        product: product,
      },
    });

    const res = await fetch('/api/yoco-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: result.id,
        amountInCents: Math.round(amount * 100),
        currency: 'ZAR',
        metadata: {
          customerName: name,
          customerEmail: email,
          orderNumber: orderRef,
          product: product,
        },
      }),
    });

    const charge = await res.json();
    if (charge.success) {
      showToast('Payment successful! Thank you.', 'success');
      return true;
    } else {
      showToast('Payment failed: ' + (charge.details || charge.error), 'error');
      return false;
    }
  } catch (e) {
    if (e.message && e.message.includes('cancelled')) {
      showToast('Payment cancelled.', 'error');
    } else {
      showToast('Payment error: ' + (e.message || 'Connection failed'), 'error');
    }
    return false;
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

  let pendingItem = null;

  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      pendingItem = {
        amount: parseFloat(btn.dataset.amount),
        product: btn.dataset.product,
        name: btn.dataset.name,
      };
      document.getElementById('checkoutTitle').textContent = 'Buy ' + btn.dataset.name;
      document.getElementById('checkoutDesc').textContent = btn.dataset.product;
      document.getElementById('checkoutName').value = '';
      document.getElementById('checkoutEmail').value = '';
      document.getElementById('checkoutModal').classList.add('open');
    };
  });

  document.getElementById('checkoutCancel').onclick = () => {
    document.getElementById('checkoutModal').classList.remove('open');
    pendingItem = null;
  };
  document.getElementById('checkoutModal').onclick = (e) => {
    if (e.target === e.currentTarget) {
      e.target.classList.remove('open');
      pendingItem = null;
    }
  };

  document.getElementById('checkoutConfirm').onclick = async () => {
    const name = document.getElementById('checkoutName').value.trim();
    const email = document.getElementById('checkoutEmail').value.trim();
    if (!name || !email) {
      showToast('Please fill in your name and email.', 'error');
      return;
    }
    if (!pendingItem) return;

    const confirmBtn = document.getElementById('checkoutConfirm');
    setBtnLoading(confirmBtn, true, 'Pay Now');
    document.getElementById('checkoutCancel').disabled = true;

    const orderRef = 'OV-' + Date.now();
    const ok = await startYocoPayment(
      pendingItem.amount,
      name,
      email,
      pendingItem.product + ' — ' + pendingItem.name,
      orderRef
    );

    setBtnLoading(confirmBtn, false, 'Pay Now');
    document.getElementById('checkoutCancel').disabled = false;

    if (ok) {
      document.getElementById('checkoutModal').classList.remove('open');
      pendingItem = null;
    }
  };

  document.getElementById('orderTrackBtn').onclick = async () => {
    const song = document.getElementById('trackSong').value.trim();
    const artist = document.getElementById('trackArtist').value.trim();
    const key = document.getElementById('trackKey').value;
    const email = document.getElementById('trackEmail').value.trim();
    const notes = document.getElementById('trackNotes').value.trim();

    if (!song || !artist || !email) {
      showToast('Please fill in the song name, artist, and your email.', 'error');
      return;
    }

    const btn = document.getElementById('orderTrackBtn');
    setBtnLoading(btn, true, 'Order Track — $29');

    const productDesc = 'Custom Karaoke Track: ' + song + ' — ' + artist + ' (' + key + ')' + (notes ? ' | Notes: ' + notes : '');
    const orderRef = 'OV-K-' + Date.now();
    const ok = await startYocoPayment(
      29,
      song + ' - ' + artist,
      email,
      productDesc,
      orderRef
    );

    setBtnLoading(btn, false, 'Order Track — $29');

    if (ok) {
      document.getElementById('trackSong').value = '';
      document.getElementById('trackArtist').value = '';
      document.getElementById('trackNotes').value = '';
    }
  };
});
