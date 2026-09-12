const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (targets.length && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('has-reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  for (const target of targets) observer.observe(target);
}
