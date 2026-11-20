const products = [
  { name: "Madder Cotton Saree", category: "Sarees", price: 2450, position: "0%" },
  { name: "Indigo Block Print Kurta", category: "Kurtas", price: 1690, position: "50%" },
  { name: "Gulab Woven Dupatta", category: "Dupattas", price: 1150, position: "100%" }
];

const splash = document.querySelector("#splash");
const login = document.querySelector("#login");
const store = document.querySelector("#store");
const bag = document.querySelector("#bag");
const quantities = new Map();
const money = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
});

function showScreen(screen) {
  for (const section of [splash, login, store]) {
    section.hidden = section !== screen;
  }
  window.scrollTo(0, 0);
  const title = screen.querySelector("h1");
  title.tabIndex = -1;
  title.focus({ preventScroll: true });
}

window.setTimeout(() => showScreen(login), 2580);

document.querySelector("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  showScreen(store);
});

document.querySelector("#sign-out").addEventListener("click", () => {
  quantities.clear();
  updateBag();
  renderProducts("All");
  document.querySelector("#login-form").reset();
  history.replaceState(null, "", location.pathname + location.search);
  showScreen(login);
});

function renderProducts(category) {
  document.querySelector("#collection-title").textContent = category === "All"
    ? "Shop the collection"
    : category;
  document.querySelector("#show-all").hidden = category === "All";
  for (const button of document.querySelectorAll("nav [data-filter]")) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === category));
  }
  const cards = products.filter((product) => category === "All" || product.category === category)
    .map((product) => {
      const card = document.createElement("article");
      card.className = "product";
      card.innerHTML = `
        <div class="product-photo" role="img" aria-label="${product.name} on a dress form" style="--position: ${product.position}"></div>
        <h3>${product.name}</h3>
        <div class="product-details">
          <span>${money.format(product.price)}</span>
          <button aria-label="Add ${product.name} to bag">Add to bag</button>
        </div>`;
      card.querySelector("button").addEventListener("click", () => {
        quantities.set(product, (quantities.get(product) || 0) + 1);
        updateBag();
        bag.showModal();
      });
      return card;
    });
  document.querySelector("#products").replaceChildren(...cards);
}

function updateBag() {
  const items = [];
  let count = 0;
  let total = 0;
  for (const [product, quantity] of quantities) {
    count += quantity;
    total += quantity * product.price;
    const item = document.createElement("li");
    item.innerHTML = `<span>${product.name} × ${quantity}</span><button aria-label="Remove one ${product.name}">Remove</button>`;
    item.querySelector("button").addEventListener("click", () => {
      if (quantity === 1) {
        quantities.delete(product);
      } else {
        quantities.set(product, quantity - 1);
      }
      updateBag();
      (document.querySelector("#bag-items button") || bag.querySelector("form button")).focus();
    });
    items.push(item);
  }
  document.querySelector("#bag-count").textContent = count;
  document.querySelector("#bag-items").replaceChildren(...items);
  document.querySelector("#bag-total").textContent = count
    ? `Subtotal ${money.format(total)}`
    : "Your bag is empty.";
}

document.querySelector("#open-bag").addEventListener("click", () => bag.showModal());
for (const control of document.querySelectorAll("[data-filter]")) {
  control.addEventListener("click", () => {
    renderProducts(control.dataset.filter);
    if (control.matches("nav button")) {
      document.querySelector("#collection").scrollIntoView();
    }
    if (control.id === "show-all") {
      const title = document.querySelector("#collection-title");
      title.tabIndex = -1;
      title.focus();
    }
  });
}
renderProducts("All");
updateBag();
