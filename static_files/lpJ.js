
function flipCard() {
  const card = document.getElementById("card");
 

  // Spamming messes it up so this locks it
  if (card.classList.contains("is-animating")) return;
  card.classList.add("is-animating");
  card.classList.add("fade-shadow");

  setTimeout(() => {card.classList.toggle("flipped");}, 180);

  setTimeout(() => {card.classList.remove("fade-shadow");}, 860);

  setTimeout(() => {card.classList.remove("is-animating");}, 1030);
}
