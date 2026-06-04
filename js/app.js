// =============================================
//  app.js — Tab switching and initialization
// =============================================

document.addEventListener('DOMContentLoaded', () => {

  // ---- Tab navigation ----
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');

      // Re-draw canvas when switching to C8 tab (handles resize)
      if (target === 'c8') setTimeout(updateC8, 50);
    });
  });

  // ---- Init modules ----
  initC8();
  initC9();

  // ---- Redraw on resize ----
  window.addEventListener('resize', () => {
    const activeTab = document.querySelector('.tab-panel.active');
    if (activeTab && activeTab.id === 'tab-c8') updateC8();
  });

});
