const heroDownload = document.querySelector('#hero-download');
const bar = document.querySelector<HTMLElement>('[data-mobile-download]');
if (heroDownload && bar && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(([entry]) => {
    bar.hidden = entry.isIntersecting || entry.boundingClientRect.bottom > 0;
  });
  observer.observe(heroDownload);
  document.body.classList.add('has-mobile-download');
}
