document.getElementById("darkButton").addEventListener("click", function() {
    document.body.classList.add("darkmode");
    document.body.classList.remove("lightmode");
});

document.getElementById("lightButton").addEventListener("click", function() {
    document.body.classList.add("lightmode");
    document.body.classList.remove("darkmode");
});