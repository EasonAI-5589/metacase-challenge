(() => {
  let theme = "dark";
  try {
    if (localStorage.getItem("inferencenet-theme") === "light") theme = "light";
  } catch {}
  document.documentElement.dataset.theme = theme;
  // Each submission type keeps the colour of its card on the main site; set before first paint.
  document.documentElement.dataset.kind =
    location.pathname.split("/")[2] || "harness";
})();
