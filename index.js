/**
 * Name: Joshua Ren and Jong-Hyun Lee
 * Date: December 06, 2024
 * Section: CSE 154 AB
 *
 * This is the index.js page that is used by the HuskyExchange website for the Final Project in
 * CSE 154. It sets up the forms and buttons on the website and allows the user to log in, log
 * out, buy items, view individual item details, view all the items listed for sale, search/filter
 * through the items, get financial advice on the products, and view their purchase history.
 */

"use strict";
(function() {
  window.addEventListener("load", initialize);

  /**
   * Checks to see if any users are logged in. If an error is caught, an error message is displayed
   * for the user.
   * @return {String | Boolean} if a user is logged in, their username is returned, otherwise
   * a boolean false is returned
   */
  async function loggedIn() {
    try {
      let data = await fetch("/user/logged-in");
      await statusCheck(data);
      data = await data.text();
      if (data !== "false") {
        return data;
      }
      return false;
    } catch (err) {
      handleError();
    }
  }

  /**
   * Initializes the page by detecting what page the user is on and setting up the buttons and
   * and forms for that specific page
   */
  function initialize() {
    initializeNavBar();
    const onHomePage = id("search-bar");
    if (onHomePage) {
      initializeHome();
    }
    const onSignUp = id("sign-up");
    if (onSignUp) {
      initializeSignUp();
    }
    const onLogin = id("log-in");
    if (onLogin) {
      initializeLogin();
    }
    const onPurchaseHistory = id("purchase-history");
    if (onPurchaseHistory) {
      initializePurchaseHistory();
    }
    const onSell = id("sell");
    if (onSell) {
      initializeSell();
    }
    const onProductDetail = id("product-detail");
    if (onProductDetail) {
      initializeProductDetails();
    }
  }

  /**
   * Initializes the nav bar by setting up the log in and out buttons based on whether or not the
   * user is logged in. If an error is caught, an error message is displayed for the user.
   */
  async function initializeNavBar() {
    try {
      const logOutForm = qs("header form");
      logOutForm.addEventListener("submit", logOut);
      const logIn = qs("header a.log-in-or-out");
      if (await loggedIn()) {
        logIn.classList.add("hidden");
        logOutForm.classList.remove("hidden");
      } else {
        logIn.classList.remove("hidden");
        logOutForm.classList.add("hidden");
      }
    } catch (err) {
      handleError();
    }
  }

  /**
   * Initializes the home page by setting up the buttons and forms on it and loading in all the
   * products.
   */
  function initializeHome() {
    const scrollDistance = 310;
    const rightArrow = id("right-arrow");
    const leftArrow = id("left-arrow");
    displayHomePageProducts();
    leftArrow.addEventListener("click", function() {
      scroll(-scrollDistance);
    });
    rightArrow.addEventListener("click", function() {
      scroll(scrollDistance);
    });
    const searchBar = qs("#search-bar form");
    searchBar.addEventListener("submit", search);
    const clothingFilter = id("clothing");
    const furnitureFilter = id("furniture");
    const schoolSuppliesFilter = id("school-supplies");
    clothingFilter.addEventListener("click", toggleCheckbox);
    furnitureFilter.addEventListener("click", toggleCheckbox);
    schoolSuppliesFilter.addEventListener("click", toggleCheckbox);
    const filterForm = qs("#filter form");
    filterForm.addEventListener("submit", filter);
    const toggleViewButton = qs("#toggle-view button");
    toggleViewButton.addEventListener("click", toggleProductView);
    const popupDoneButton = qs("#popup button");
    popupDoneButton.addEventListener("click", hidePopup);
  }

  /** Initializes the sign up page by setting up the sign up form. */
  function initializeSignUp() {
    const signUpForm = qs("#sign-up form");
    signUpForm.addEventListener("submit", signUp);
  }

  /**
   * Initializes the login page by checking if the user is logged in and then setting up the log
   * in form. If an error is caught, an error message is displayed for the user.
   */
  async function initializeLogin() {
    try {
      if (await loggedIn()) {
        const loginSuccess = id("login-success");
        const alreadyLoggedIn = id("already-logged-in");
        const loginForm = qs("#log-in form");
        loginSuccess.classList.add("hidden");
        loginForm.classList.add("hidden");
        alreadyLoggedIn.classList.remove("hidden");
      } else {
        const loginForm = qs("#log-in form");
        loginForm.addEventListener("submit", login);
        const loginSuccess = id("login-success");
        const alreadyLoggedIn = id("already-logged-in");
        loginSuccess.classList.add("hidden");
        loginForm.classList.remove("hidden");
        alreadyLoggedIn.classList.add("hidden");
      }
    } catch (err) {
      handleError();
    }
  }

  /**
   * Gets the product id from the url of the current website
   * @return {String} the id of the product that the user is currently looking at/buying
   */
  function getProductId() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("productId");
    return productId;
  }

  /**
   * Initializes the item details page by setting up the forms and buttons while also loading in
   * the product's data/information.
   */
  function initializeProductDetails() {
    const productId = getProductId();
    const buyForm = qs("#product-detail form");
    buyForm.addEventListener("submit", buyFormSubmitted);
    if (productId) {
      fetchProductDetails(productId);
      const confirmPickup = qs("#confirm-pickup");
      confirmPickup.addEventListener("click", toggleCheckbox);
    } else {
      const productSold = id("product-sold");
      const productNonexistent = id("product-nonexistent");
      const productDetail = id("product-detail");
      productDetail.classList.add("hidden");
      productSold.classList.add("hidden");
      productNonexistent.classList.remove("hidden");
    }
  }

  /**
   * This function manages the submission of the buy product form. If the confirm purchase button
   * was clicked, it buys the product. If return to details is clicked, it goes back to the buy
   * button. If the buy button is clicked, it brings the user to the purchase confirmation view.
   * If an error is caught, an error message is displayed for the user.
   */
  async function buyFormSubmitted() {
    try {
      event.preventDefault();
      const submitter = event.submitter.id;
      if (submitter === "confirm-purchase") {
        await confirmPurchase();
      } else if (submitter === "return-to-details") {
        returnToDetails();
      } else {
        toConfirmationScreen();
      }
    } catch (err) {
      handleError();
    }
  }

  /**
   * Returns to the details page of the product view page. Hides the confirm and return to details
   * buttons while showing the buy button. Enables the willing to pick up product checkbox
   */
  function returnToDetails() {
    const confirmButton = id("confirm-purchase");
    const returnToDetailsButton = id("return-to-details");
    const buyButton = id("buy-now");
    const checkbox = qs("#product-detail form input");
    confirmButton.classList.add("hidden");
    returnToDetailsButton.classList.add("hidden");
    buyButton.classList.remove("hidden");
    checkbox.disabled = false;
  }

  /**
   * Brings the user to the product confirmation screen. Shows the confirm and return to details
   * buttons while hiding the buy button. Disables the willing to pick up product checkbox
   */
  function toConfirmationScreen() {
    const confirmButton = id("confirm-purchase");
    const returnToDetailsButton = id("return-to-details");
    const buyButton = id("buy-now");
    const checkbox = qs("#product-detail form input");
    confirmButton.classList.remove("hidden");
    returnToDetailsButton.classList.remove("hidden");
    buyButton.classList.add("hidden");
    checkbox.disabled = true;
  }

  /**
   * Purchases an item and then displays the confirmation number for the purchase. If an error is
   * caught, an error message is displayed for the user.
   */
  async function confirmPurchase() {
    try {
      const productId = getProductId();
      const formInput = qs("#product-detail input");
      const willingToPickUp = formInput.checked;
      let formParams = new FormData();
      formParams.append("id", productId);
      formParams.append("willingToPickUp", willingToPickUp);
      let purchaseData = await fetch("/products/buy", {
        method: "POST",
        body: formParams
      });
      await statusCheck(purchaseData);
      purchaseData = await purchaseData.text();
      displayPurchaseConfirmation(purchaseData);
    } catch (err) {
      if (err.message === "Willing to pick up parameter must be true") {
        const willingToPickUp = qsa("#purchase-failed p")[1];
        willingToPickUp.classList.remove("hidden");
      } else if (err.message === "You cannot buy an item that you're selling") {
        const buyOwn = qsa("#purchase-failed p")[0];
        buyOwn.classList.remove("hidden");
      } else if (err.message === "Not logged in.") {
        window.location.href = "/authentication-required.html";
      } else {
        handleError();
      }
    }
  }

  /**
   * Hides all the product information and displays the purchase confirmation code for the user.
   * @param {String} purchaseData - the purchase confirmation code
   */
  function displayPurchaseConfirmation(purchaseData) {
    if (purchaseData) {
      const productSold = id("product-sold");
      const productNonexistent = id("product-nonexistent");
      const productDetail = id("product-detail");
      const productPurchased = id("product-purchased");
      const productPurchasedMessage = qs("#product-purchased h1");
      productSold.classList.add("hidden");
      productNonexistent.classList.add("hidden");
      productDetail.classList.add("hidden");
      productPurchased.classList.remove("hidden");
      productPurchasedMessage.textContent = "You have successfully purchased this product. " +
      "The confirmation code for your purchase is " + purchaseData;
    }
  }

  /**
   * Hides all of the error and confirmation messages on the item detail page and displays the
   * section that will contain the product's data.
   */
  function showProductDetails() {
    const productPurchased = id("product-purchased");
    const productSold = id("product-sold");
    const productNonexistent = id("product-nonexistent");
    const productDetail = id("product-detail");
    const buyOwn = qsa("#purchase-failed p")[0];
    const willingToPickUp = qsa("#purchase-failed p")[1];
    productPurchased.classList.add("hidden");
    productSold.classList.add("hidden");
    productNonexistent.classList.add("hidden");
    buyOwn.classList.add("hidden");
    willingToPickUp.classList.add("hidden");
    productDetail.classList.remove("hidden");
  }

  /**
   * Loads in all of the individual product's information for the user to view
   * @param {JSON} product - information about the product that's getting displayed
   */
  function displayProductDetails(product) {
    id("product-name").textContent = product.name;
    id("product-image").src = product.image;
    id("product-image").alt = product.name;
    id("product-price").textContent = `$${product.price}`;
    id("product-description").textContent = product.description;
    id("product-seller").textContent = "Seller: " + product.username;
  }

  /**
   * Gets data about the individual product and then loads the information onto the page for the
   * user to view. If an error is caught, an error message is displayed for the user.
   * @param {String} productId - the id of the product that's getting displayed
   */
  async function fetchProductDetails(productId) {
    const productPurchased = id("product-purchased");
    const productSold = id("product-sold");
    const productNonexistent = id("product-nonexistent");
    const productDetail = id("product-detail");
    const willingToPickUp = qsa("#purchase-failed p")[1];
    try {
      showProductDetails();
      const response = await fetch(`/products/product/${productId}`);
      await statusCheck(response);
      const product = await response.json();
      displayProductDetails(product);
    } catch (err) {
      productDetail.classList.add("hidden");
      if (err.message === "Product does not exist") {
        productPurchased.classList.add("hidden");
        productSold.classList.add("hidden");
        willingToPickUp.classList.add("hidden");
        productNonexistent.classList.remove("hidden");
      } else if (err.message === "Product has already been sold") {
        productPurchased.classList.add("hidden");
        productSold.classList.remove("hidden");
        willingToPickUp.classList.add("hidden");
        productNonexistent.classList.add("hidden");
      } else {
        handleError();
      }
    }
  }

  /**
   * Displays the data of the past purchases of the logged in user.
   * @param {JSON} productData - data on the product and its purchase
   */
  function createPurchaseHistoryContainer(productData) {
    const product = document.createElement("article");
    const imageContainer = document.createElement("div");
    const image = document.createElement("img");
    imageContainer.appendChild(image);
    imageContainer.classList.add("image-container");
    image.src = productData.image;
    image.alt = productData.name;
    const textContainer = document.createElement("div");
    textContainer.classList.add("text-container");
    const header = document.createElement("h2");
    const purchaseInformation = "Purchased on " + productData.purchase_date + " from " +
    productData.seller + " for $" + productData.price + ". Confirmation number " +
    productData.id;
    header.textContent = productData.name;
    const purchaseInformationContainer = document.createElement("p");
    purchaseInformationContainer.textContent = purchaseInformation;
    product.appendChild(imageContainer);
    product.appendChild(textContainer);
    textContainer.appendChild(header);
    textContainer.appendChild(purchaseInformationContainer);
    const productHistory = id("purchase-history");
    productHistory.appendChild(product);
    product.classList.add("flex");
  }

  /**
   * Initializes the purchase history page by displaying all of the user's previous purchases.
   * If an error is caught, an error message is displayed for the user.
   */
  async function initializePurchaseHistory() {
    try {
      const results = await fetch("/user/purchases");
      await statusCheck(results);
      const data = await results.json();
      for (let i = 0; i < data.length; i++) {
        createPurchaseHistoryContainer(data[i]);
      }
    } catch (err) {
      if (err.message === "Not logged in.") {
        window.location.href = "/authentication-required.html";
      } else {
        handleError();
      }
    }
  }

  /**
   * Displays all items avaialable for sale on the home page. If an error is caught, an error
   * message is displayed for the user.
   */
  async function displayHomePageProducts() {
    try {
      const results = await fetch("/products/all");
      await statusCheck(results);
      const data = await results.json();
      const carousel = id("product-carousel");
      createMainProductView(data);
      carousel.classList.add("hidden");
      createProductCarousel(data);
      const mainView = sessionStorage.getItem("productView");
      if (mainView === null) {
        sessionStorage.setItem("productView", "true");
      } else if (mainView === "false") {
        const main = id("main-product-view");
        main.classList.add("hidden");
        carousel.classList.remove("hidden");
        carousel.classList.add("flex");
      }
    } catch (err) {
      handleError();
    }
  }

  /**
   * Toggles the checkbox display (ie. if it's currenctly checked, it will switch to unchecked and)
   * vice versa
   */
  function toggleCheckbox() {
    const checkbox = this.querySelector("input");
    if (!checkbox.disabled) {
      const newCheckbox = this.querySelector("span");
      if (checkbox.checked) {
        checkbox.checked = false;
        newCheckbox.classList.remove("checked");
        newCheckbox.classList.add("unchecked");
      } else {
        checkbox.checked = true;
        newCheckbox.classList.add("checked");
        newCheckbox.classList.remove("unchecked");
      }
    }
  }

  /**
   * Makes a search through all products available for sale based on the user's search query in the
   * search bar. Displays all products that contain the search query in the name or description and
   * hides the rest. If an error is caught, an error message is displayed for the user.
   */
  async function search() {
    try {
      event.preventDefault();
      const searchBar = qs("#search-bar form input");
      const searchQuery = searchBar.value;
      if (searchQuery.trim()) {
        const results = await fetch("/products/search/" + searchQuery);
        await statusCheck(results);
        const data = await results.json();
        hideAndShowProducts(data);
      }
    } catch (err) {
      handleError();
    }
  }

  /**
   * Based on data containing which products to show, this function goes through all products,
   * shows the ones that should be shown, and hides the rest.
   * @param {JSON} data - the ids of the products that will be shown
   */
  function hideAndShowProducts(data) {
    const mainViewArticles = qsa("#main-product-view article");
    const carouselViewArticles = qsa("#carousel article");
    for (let j = 0; j < mainViewArticles.length; j++) {
      const mainArticle = mainViewArticles[j];
      const carouselArticle = carouselViewArticles[j];
      const id = mainArticle.id;
      let display = false;
      for (let i = 0; i < data.length; i++) {
        if (data[i].id === parseInt(id)) {
          display = true;
        }
      }
      if (display) {
        mainArticle.classList.remove("hidden");
        carouselArticle.classList.remove("hidden");
        mainArticle.classList.add("flex");
        carouselArticle.classList.add("inline-block");
      } else {
        mainArticle.classList.add("hidden");
        carouselArticle.classList.add("hidden");
        mainArticle.classList.remove("flex");
        carouselArticle.classList.remove("inline-block");
      }
    }
  }

  /**
   * Creates a string used to filter through all the products based on which checkboxes were
   * selected by the user.
   * @param {HTMLElement} form - the form containing all the checkboxes
   * @return {String} the parameters that will be used to filter the items
   */
  function createFilterQueryParameters(form) {
    let filterParameters = "";
    let firstHappened = false;
    if (form.clothing.checked) {
      filterParameters += "?clothing=Clothing";
      firstHappened = true;
    }
    if (form.furniture.checked) {
      if (firstHappened) {
        filterParameters += "&";
      } else {
        filterParameters += "?";
        firstHappened = true;
      }
      filterParameters += "furniture=Furniture";
    }
    if (form["school-supplies"].checked) {
      if (firstHappened) {
        filterParameters += "&";
      } else {
        filterParameters += "?";
        firstHappened = true;
      }
      filterParameters += "schoolSupplies=schoolSupplies";
    }
    return filterParameters;
  }

  /**
   * Gets data on all the products that match the user's filters and then displays those products
   * and hides the rest. If an error is caught, an error message is displayed for the user.
   */
  async function filter() {
    event.preventDefault();
    try {
      const error = id("filter-error");
      error.classList.add("hidden");
      const form = qs("#filter form");
      const filterParameters = createFilterQueryParameters(form);
      let data = await fetch("/products/filter" + filterParameters);
      await statusCheck(data);
      data = await data.json();
      hideAndShowProducts(data);
    } catch (err) {
      if (err.message === "Missing one or more of the required parameters.") {
        const error = id("filter-error");
        error.classList.remove("hidden");
      } else {
        handleError();
      }
    }
  }

  /** Toggles the user's product view between the carousel view and the main view. */
  function toggleProductView() {
    const main = id("main-product-view");
    const carousel = id("product-carousel");
    const mainView = sessionStorage.getItem("productView");
    if (mainView === "true") {
      sessionStorage.setItem("productView", "false");
    } else if (mainView === "false") {
      sessionStorage.setItem("productView", "true");
    } else if (main.classList.contains("hidden")) {
      sessionStorage.setItem("productView", "true");
    } else {
      sessionStorage.setItem("productView", "false");
    }
    main.classList.toggle("hidden");
    carousel.classList.toggle("hidden");
    carousel.classList.toggle("flex");
  }

  /**
   * Creates the image section of the product's display on the main product view for the home page.
   * @param {JSON} productData - the data on the product that's getting its image container created
   * @return {HTMLElement} The container for the product's image
   */
  function createMainProductImage(productData) {
    const imageContainer = document.createElement("div");
    const image = document.createElement("img");
    imageContainer.appendChild(image);
    imageContainer.classList.add("image-container");
    image.src = productData.image;
    image.alt = productData.name;
    return imageContainer;
  }

  /**
   * Creates the main product view for the user. Displays all of the products and their data
   * @param {JSON} data - the data on the products that get displayed on the page
   */
  function createMainProductView(data) {
    const home = id("main-product-view");
    for (let i = 0; i < data.length; i++) {
      const productData = data[i];
      const product = document.createElement("article");
      product.id = productData.id;
      const imageContainer = createMainProductImage(productData);
      const textContainer = document.createElement("div");
      textContainer.classList.add("text-container");
      const header = document.createElement("h2");
      header.textContent = productData.name;
      const price = document.createElement("p");
      price.textContent = "$" + productData.price;
      const description = document.createElement("p");
      description.textContent = productData.description;
      const analyze = document.createElement("button");
      analyze.textContent = "Analyze the Price";
      product.appendChild(imageContainer);
      product.appendChild(textContainer);
      textContainer.appendChild(header);
      textContainer.appendChild(price);
      textContainer.appendChild(description);
      textContainer.appendChild(analyze);
      home.appendChild(product);
      product.classList.add("flex");
      product.addEventListener("click", function() {
        openItemPage(productData);
      });
    }
  }

  /**
   * If the analyze price button on a product is clicked, it analyzes the price and displays that
   * analysis. If it's anywhere else on the product that's clicked, the function open's that item's
   * individual item view page.
   * @param {JSON} productData - data on the product that got clicked
   */
  function openItemPage(productData) {
    if (event.target.tagName === "BUTTON") {
      analyzePrice(event.target.parentElement);
    } else {
      window.location.href = `item-detail.html?productId=${productData.id}`;
    }
  }

  /**
   * Gets analysis on the price, description, and name of a certain product and displays the
   * analysis in a popup. If an error is caught, an error message is displayed for the user.
   * @param {HTMLElement} textContainer - the container for the text section of the product that's
   * getting analyzed
   */
  async function analyzePrice(textContainer) {
    try {
      const nameContainer = textContainer.querySelector("h2");
      const descriptionContainer = textContainer.querySelectorAll("p")[0];
      const priceContainer = textContainer.querySelectorAll("p")[1];
      const name = nameContainer.textContent;
      const description = descriptionContainer.textContent;
      const price = priceContainer.textContent;
      let analysis = await fetch("/products/analyze/" + name + "/" + description + "/" + price);
      await statusCheck(analysis);
      analysis = await analysis.text();
      showPopup(analysis);
    } catch (err) {
      if (err.message === "Failed to analyze the provided product") {
        showPopup("Failed to analyze the provided product");
      } else {
        handleError();
      }
    }
  }

  /**
   * Displays a popup with analysis on how good of a deal buying a certain product is. Also blurs
   * the background behind the popup
   * @param {String} analysis - the analysis on whether or not the product is a good deal
   */
  function showPopup(analysis) {
    const overlay = id("popup");
    overlay.classList.add("show");
    const analysisParagraph = qs("#popup p");
    analysisParagraph.textContent = analysis;
    const nonPopup = qsa(".non-popup");
    for (let i = 0; i < nonPopup.length; i++) {
      nonPopup[i].classList.add("blur");
    }
  }

  /**
   * Hides the popup that displayed analysis on how good of a deal buying a certain product is.
   * Unblurs the background behind the popup.
   */
  function hidePopup() {
    const overlay = id("popup");
    overlay.classList.remove("show");
    const nonPopup = qsa(".non-popup");
    for (let i = 0; i < nonPopup.length; i++) {
      nonPopup[i].classList.remove("blur");
    }
  }

  /**
   * Creates the carousel product view for the user. Displays all of the products and their data
   * @param {JSON} data - the data on the products that get displayed on the page
   */
  function createProductCarousel(data) {
    const home = id("carousel");
    for (let i = 0; i < data.length; i++) {
      const productData = data[i];
      const product = document.createElement("article");
      const imageContainer = document.createElement("div");
      const image = document.createElement("img");
      imageContainer.appendChild(image);
      image.src = productData.image;
      image.alt = productData.name;
      const header = document.createElement("h2");
      header.textContent = productData.name;
      const price = document.createElement("p");
      price.textContent = "$" + productData.price;
      const description = document.createElement("p");
      description.textContent = productData.description;
      product.appendChild(imageContainer);
      product.appendChild(header);
      product.appendChild(price);
      product.appendChild(description);
      product.addEventListener("click", function() {
        window.location.href = `item-detail.html?productId=${productData.id}`;
      });
      home.appendChild(product);
      product.classList.add("inline-block");
    }
  }

  /**
   * This function scrolls the carousel a certain distance
   * @param {Integer} scrollDistance - the distance that the carousel will scroll on click
   */
  function scroll(scrollDistance) {
    const carousel = document.getElementById("carousel");
    carousel.scrollLeft += scrollDistance;
  }

  /**
   * Verifies that the user's password and username match. If they do, the function logs them into
   * their account. If an error is caught, an error message is displayed for the user.
   */
  async function login() {
    event.preventDefault();
    deleteContents("#login-error-box");
    try {
      const userInput = qsa("#log-in input");
      let params = new FormData();
      params.append("username", userInput[0].value);
      params.append("password", userInput[1].value);
      let loginData = await fetch("/user/login", {
        method: "POST",
        body: params
      });
      await statusCheck(loginData);
      loginData = await loginData.text();
      document.cookie = "authorization=" + loginData;
      successfulLogin();
    } catch (err) {
      if (err.message === "No such user") {
        signUpLogInErrorMessage("No such user", "login-error-box");
      } else if (err.message === "Password doesn't match username") {
        signUpLogInErrorMessage("Password doesn't match username", "login-error-box");
      } else {
        handleError();
      }
    }
  }

  /**
   * Hides the login form, switches the log in button in the navigatiion bar to the log out
   * button, and shows a login success message.
   */
  function successfulLogin() {
    const form = qs("#log-in form");
    form.classList.add("hidden");
    const success = id("login-success");
    success.classList.remove("hidden");
    const logOutButton = qs("header form");
    const logInButton = qs("a.log-in-or-out");
    logOutButton.classList.remove("hidden");
    logInButton.classList.add("hidden");
  }

  /**
   * Creates an account for the user. If an error is caught, an error message is displayed for the
   * user.
   */
  async function signUp() {
    event.preventDefault();
    deleteContents("#signup-error-box");
    try {
      const userInput = qsa("#sign-up input");
      let params = new FormData();
      params.append("username", userInput[0].value);
      params.append("email", userInput[1].value);
      params.append("password", userInput[2].value);
      params.append("password-confirm", userInput[3].value);
      let signUpDate = await fetch("/user/signup", {
        method: "POST",
        body: params
      });
      await statusCheck(signUpDate);
      signUpDate = await signUpDate.text();
      const form = qs("#sign-up form");
      form.classList.add("hidden");
      const success = id("signup-success");
      success.classList.remove("hidden");
    } catch (err) {
      if (err.message === "Username already in use") {
        signUpLogInErrorMessage("Username already in use", "sign-up-error-box");
      } else if (err.message === "Passwords don't match") {
        signUpLogInErrorMessage("Passwords don't match", "sign-up-error-box");
      } else {
        handleError();
      }
    }
  }

  /**
   * Logs the user out of their account and redirects them to the log out successful page
   */
  function logOut() {
    event.preventDefault();
    document.cookie = "authorization=;";
    window.location.href = "/log-out-successful.html";
  }

  /**
   * Displays a sign up or log in error to the user
   * @param {String} message - The error that's getting displayed to the user
   * @param {String} errorContainerId - id of the container that will contain the error
   */
  function signUpLogInErrorMessage(message, errorContainerId) {
    const error = id(errorContainerId);
    const errorMessage = document.createElement("p");
    errorMessage.textContent = message;
    error.appendChild(errorMessage);
  }

  /**
   * Deletes all the contents in a container.
   * @param {String} selector - the selector for the container that will have its contents cleared
   */
  function deleteContents(selector) {
    const containerContents = qsa(selector + " *");
    for (let i = 0; i < containerContents.length; i++) {
      containerContents[i].remove();
    }
  }

  /** Initializes the sell page by setting up the sell item form and its inputs. */
  function initializeSell() {
    const sellForm = qs("#sell form");
    sellForm.addEventListener("submit", sell);
    const sellFormInputs = qsa("#sell .sell-input");
    for (let i = 0; i < sellFormInputs.length; i++) {
      sellFormInputs[i].classList.remove("hidden");
    }
    const success = qs("#sell form h2");
    success.classList.add("hidden");
    const categoryDropdown = qs("#sell form select");
    categoryDropdown.addEventListener("input", changeCategoryColor);
  }

  /**
   * Changes the color of the category selector dropdown on the item detail page. If the dropdown
   * selected is "Category", then the color of the text is gray. Otherwise it's set to black.
   */
  function changeCategoryColor() {
    const categoryDropdown = qs("#sell form select");
    const allOptions = categoryDropdown.querySelectorAll("option");
    for (let i = 0; i < allOptions.length; i++) {
      const option = allOptions[i];
      if (option.selected === true) {
        if (option.value === "Category") {
          categoryDropdown.classList.add("gray");
          categoryDropdown.classList.remove("black");
        } else {
          categoryDropdown.classList.add("black");
          categoryDropdown.classList.remove("gray");
        }
      }
    }
  }

  /**
   * Creates the form data object with information on a product that is being sold
   * @param {Array} sellForm - data on the name, price, and image of the product
   * @param {HTMLElement} categoryInput - the input containing the category selected by the user
   * @return {FormData} The form data object containing the data on the product
   */
  function createSellRequestParams(sellForm, categoryInput) {
    let params = new FormData();
    params.append("name", sellForm[0].value);
    params.append("price", sellForm[1].value);
    params.append("image", sellForm[2].value);
    params.append("description", sellForm[3].value);
    params.append("category", categoryInput.value);
    return params;
  }

  /**
   * Adds a product to be sold on the website. If an error is caught, an error message is
   * displayed for the user.
   */
  async function sell() {
    event.preventDefault();
    try {
      const categoryRequired = id("sell-error");
      const sellForm = qsa("#sell form input");
      const categoryInput = qs("#sell form select");
      const params = createSellRequestParams(sellForm, categoryInput);
      if (categoryInput.value === "category") {
        categoryRequired.classList.remove("hidden");
      } else {
        categoryRequired.classList.add("hidden");
        let data = await fetch("/products/add", {
          method: "POST",
          body: params
        });
        await statusCheck(data);
        sellSuccess();
      }
    } catch (err) {
      if (err.message === "Not logged in.") {
        window.location.href = "/authentication-required.html";
      } else {
        handleError();
      }
    }
  }

  /** Hides the sell form and displays text saying that that product was succesfully sold. */
  function sellSuccess() {
    const sellFormInputs = qsa("#sell .sell-input");
    for (let i = 0; i < sellFormInputs.length; i++) {
      sellFormInputs[i].classList.add("hidden");
    }
    const success = qs("#sell form h2");
    success.classList.remove("hidden");
  }

  /**
   * Redirects the user to the error page
   */
  function handleError() {
    window.location.href = "/error.html";
  }

  /**
   * This function runs a check on data to see if it's valid. If it's not, it throws an error
   * @param {Response} res - the response data that's getting checked
   * @return {Response} the response from the server
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * This function finds an element using its id and returns it
   * @param {string} id - the id of the element that gets returned
   * @return {HTMLElement} the element that gets selected
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * This function finds an element using its DOM selector and returns it
   * @param {string} selector - the DOM selector of the element that gets returned
   * @return {HTMLElement} the element that gets selected
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * This function creates/finds an array of elements using a DOM selector and returns it
   * @param {string} selector - the DOM selector of the elements that get added to the array
   * @return {Array} the array of elements that get selected
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }
})();