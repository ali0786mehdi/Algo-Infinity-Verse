const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || '') ||
  (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');

function isModKey(e) {
  return e.ctrlKey || e.metaKey;
}

function updateShortcutLabels() {
  if (!isMac) return;
  document.querySelectorAll('#shortcutsModal kbd').forEach(el => {
    if (el.textContent === 'Ctrl') el.textContent = 'Ctrl/Cmd';
    if (el.textContent === 'Alt') el.textContent = 'Alt/Option';
  });
  document.querySelectorAll('.shortcut-key').forEach(el => {
    if (el.textContent.includes('Ctrl/Cmd')) return;
    el.textContent = el.textContent.replace(/Ctrl/g, 'Ctrl/Cmd');
  });
}

export function initKeyboardShortcuts() {
  const toggleBtn = document.getElementById('shortcutsToggle');
  const modal = document.getElementById('shortcutsModal');
  const closeBtns = document.querySelectorAll('#shortcutsModalClose');

  if (toggleBtn && modal) {
    toggleBtn.addEventListener('click', () => toggleShortcutModal());
    closeBtns.forEach(btn => btn.addEventListener('click', () => closeShortcutModal()));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeShortcutModal();
    });
  }

  updateShortcutLabels();

  document.addEventListener('keydown', function(e) {
    const tag = e.target.tagName;
    const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

    if (isModKey(e) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.focus();
    }
    if (e.altKey && e.code === 'KeyH') {
      e.preventDefault();
      window.location.href = '#home';
    }
    if (e.altKey && e.code === 'KeyT') {
      e.preventDefault();
      window.location.href = '/pages/learning/learning-topics.html';
    }
    if (e.altKey && e.code === 'KeyP') {
      e.preventDefault();
      window.location.href = '/pages/practice/problems.html';
    }
    if (e.altKey && e.code === 'KeyQ') {
      e.preventDefault();
      window.location.href = '#quiz';
    }
    if (e.altKey && e.code === 'KeyD') {
      e.preventDefault();
      window.location.href = '#dashboard';
    }
    if (e.altKey && e.code === 'KeyS') {
      e.preventDefault();
      toggleDropdown('.nav-settings-dropdown');
    }
    if (e.altKey && e.code === 'KeyL') {
      e.preventDefault();
      toggleDropdown('.nav-learn-dropdown');
    }
    if (
      e.key === '/' &&
      !isEditing &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      const navSearch = document.getElementById('navSearchDesktop');
      const searchInput = navSearch?.querySelector('.nav-search-input');
      if (navSearch && searchInput) {
        if (!navSearch.classList.contains('expanded')) {
          navSearch.classList.add('expanded');
        }
        setTimeout(() => {
          searchInput.focus();
          searchInput.select();
        }, 250);
      }
    }
    if (e.key === 'Escape') {
      const modal = document.getElementById('shortcutsModal');
      if (modal && modal.style.display !== 'none') {
        closeShortcutModal();
      }
    }
    if (e.key === '?' && !isEditing) {
      e.preventDefault();
      toggleShortcutModal();
    }
  });
}

function toggleDropdown(selector) {
  const parent = document.querySelector(selector);
  if (!parent) return;
  document.querySelectorAll('.has-dropdown.open').forEach(el => {
    if (el !== parent) {
      el.classList.remove('open');
      el.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
    }
  });
  const isOpen = parent.classList.toggle('open');
  parent.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', isOpen);
}

function toggleShortcutModal() {
  const modal = document.getElementById('shortcutsModal');
  if (!modal) return;
  const isVisible = modal.classList.contains('shortcuts-modal--visible');
  if (isVisible) {
    closeShortcutModal();
  } else {
    openShortcutModal();
  }
}

function openShortcutModal() {
  const modal = document.getElementById('shortcutsModal');
  if (!modal) return;
  updateShortcutLabels();
  modal.style.display = 'flex';
  // Force reflow to ensure the display property takes effect before the class transition
  void modal.offsetWidth;
  modal.classList.add('shortcuts-modal--visible');
  document.body.classList.add('modal-open');
  document.body.classList.add('shortcuts-modal-open');
}

function closeShortcutModal() {
  const modal = document.getElementById('shortcutsModal');
  if (!modal) return;
  modal.classList.remove('shortcuts-modal--visible');
  // Unlock scroll immediately; visibility transition handles the fade-out visually
  document.body.classList.remove('modal-open');
  document.body.classList.remove('shortcuts-modal-open');
  // Wait for the CSS transition to complete before hiding the element
  setTimeout(() => {
    if (!modal.classList.contains('shortcuts-modal--visible')) {
      modal.style.display = 'none';
    }
  }, 200); // match CSS transition duration
}

window.openShortcutModal = openShortcutModal;
window.closeShortcutModal = closeShortcutModal;
// Legacy global exports
window.initKeyboardShortcuts = initKeyboardShortcuts;
