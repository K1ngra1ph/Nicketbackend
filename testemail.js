fetch("https://nicketbackend.onrender.com/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Raphael",
    email: "pauloanmove@gmail.com",
    phone: "08012345678",
    eventValue: "Monochrome",
    selectedNumbers: [1, 2, 3],
    totalValue: 3000
  })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
