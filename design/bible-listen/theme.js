const toggle=document.querySelector('.theme-switch');
function setTheme(theme) {
  document.documentElement.dataset.theme=theme;
  if(!toggle)return;
  toggle.setAttribute('aria-checked',String(theme==='dark'));
  toggle.setAttribute('aria-label','Dark mode');
  toggle.title=theme==='dark'?'Switch to light mode':'Switch to dark mode';
  const icon=toggle.querySelector('svg');
  if(icon)icon.innerHTML=theme==='dark'?'<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6.25 6.25 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>';
}
setTheme('dark');
toggle?.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
