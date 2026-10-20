const theme=document.querySelector('.theme-toggle');
function reflectTheme(){theme.setAttribute('aria-checked',String(document.documentElement.dataset.theme==='dark'));}
theme.addEventListener('click',()=>{const value=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=value;try{localStorage.setItem('bp-theme',value);}catch{}reflectTheme();});
reflectTheme();
const url=new URL(location.href);
if(url.searchParams.has('option')&&url.searchParams.get('option')!=='1'){url.searchParams.set('option','1');history.replaceState(null,'',url);}
