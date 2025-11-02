
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.officer-container .card');
    cards.forEach((card, i) => {
      card.style.setProperty('--stagger', `${(i + 1) * 80}ms`);
    });
  });