// DOM Elements
const bannerSlider = document.getElementById("banner-slider")
const sliderIndicators = document.getElementById("slider-indicators")
const sliderPrev = document.getElementById("slider-prev")
const sliderNext = document.getElementById("slider-next")
const productsContainer = document.getElementById("products-container")
const reviewSlider = document.getElementById("review-slider")
const reviewIndicators = document.getElementById("review-indicators")
const reviewPrev = document.getElementById("review-prev")
const reviewNext = document.getElementById("review-next")
const cartBtn = document.getElementById("cart-btn")
const closeCartBtn = document.getElementById("close-cart")
const cartSidebar = document.getElementById("cart-sidebar")
const cartItems = document.getElementById("cart-items")
const cartCount = document.getElementById("cart-count")
const cartSubtotal = document.getElementById("cart-subtotal")
const cartShipping = document.getElementById("cart-shipping")
const cartDiscount = document.getElementById("cart-discount")
const cartTotal = document.getElementById("cart-total")
const couponInput = document.getElementById("coupon-code")
const applyCouponBtn = document.getElementById("apply-coupon")
const contactForm = document.getElementById("contact-form")
const filterBtns = document.querySelectorAll(".filter-btn")

// Global variables
let phones = []
let cart = []
let currentBannerSlide = 0
let currentReviewSlide = 0
let bannerSlides = []
let reviewSlides = []
let appliedCoupon = null
let bannerSlideInterval
let currentFilter = "all"
let showAllProducts = false // Track if we're showing all products or just 8
const PRODUCTS_LIMIT = 8 // Initial number of products to show
const SHIPPING_FEE = 10.0
const COUPONS = {
  IPHONE10: 0.1, // 10% off
  IPHONE20: 0.2, // 20% off
  FREESHIP: "freeshipping", // Free shipping
}

// Fetch data from JSON files
async function fetchData() {
  try {
    // Fetch phones data
    const phonesResponse = await fetch("/public/phones.json")
    phones = await phonesResponse.json()

    // Fetch slider data
    const sliderResponse = await fetch("/public/slider.json")
    bannerSlides = await sliderResponse.json()

    // Fetch review slider data
    const reviewResponse = await fetch("/public/reviewSlider.json")
    reviewSlides = await reviewResponse.json()

    // Initialize UI
    initializeBannerSlider(bannerSlides)
    renderProducts(phones)
    initializeReviewSlider(reviewSlides)

    // Load cart from localStorage if available
    loadCart()

    // Initialize filter buttons
    initializeFilters()
  } catch (error) {
    console.error("Error fetching data:", error)
    // Show error message to user
    productsContainer.innerHTML = `
            <div class="col-span-full text-center py-10">
                <div class="alert alert-error shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Error loading data. Please refresh the page.</span>
                </div>
            </div>
        `
  }
}

// Initialize Banner Slider
function initializeBannerSlider(sliderData) {
  bannerSlider.innerHTML = ""
  sliderIndicators.innerHTML = ""

  sliderData.forEach((slide, index) => {
    const slideElement = document.createElement("div")
    slideElement.className = `carousel-item relative w-full banner-slide`
    slideElement.style.backgroundImage = `url(${slide.image})`
    slideElement.id = `slide${index}`

    // Create gradient overlay based on slide color
    const gradientClass = slide.color || "from-black/70 to-black/40"

    slideElement.innerHTML = `
            <div class="absolute inset-0 bg-gradient-to-r ${gradientClass}"></div>
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="slide-content">
                    <h2 class="slide-title text-white slide-left" style="animation-delay: 0.1s">${slide.title}</h2>
                    <p class="slide-subtitle text-white slide-left" style="animation-delay: 0.3s">${slide.subtitle}</p>
                    <p class="slide-description text-white/80 slide-left" style="animation-delay: 0.5s">${slide.description}</p>
                    <a href="${slide.buttonLink}" class="btn bg-white hover:bg-white/90 text-apple-blue border-none px-8 py-3 slide-left" style="animation-delay: 0.7s">
                        ${slide.buttonText}
                    </a>
                </div>
            </div>
        `

    bannerSlider.appendChild(slideElement)

    // Create indicator
    const indicator = document.createElement("div")
    indicator.className = `slider-indicator ${index === 0 ? "active" : ""}`
    indicator.setAttribute("data-index", index)
    indicator.addEventListener("click", () => {
      showBannerSlide(index)
    })
    sliderIndicators.appendChild(indicator)
  })

  // Show first slide
  showBannerSlide(0)

  // Add event listeners for banner navigation buttons
  sliderPrev.addEventListener("click", () => {
    currentBannerSlide = (currentBannerSlide - 1 + sliderData.length) % sliderData.length
    showBannerSlide(currentBannerSlide)
  })

  sliderNext.addEventListener("click", () => {
    currentBannerSlide = (currentBannerSlide + 1) % sliderData.length
    showBannerSlide(currentBannerSlide)
  })

  // Start auto-sliding
  startBannerAutoSlide(sliderData.length)

  // Pause auto-slide on hover
  bannerSlider.addEventListener("mouseenter", stopBannerAutoSlide)
  bannerSlider.addEventListener("mouseleave", () => {
    startBannerAutoSlide(sliderData.length)
  })
}

// Show specific banner slide
function showBannerSlide(index) {
  currentBannerSlide = index
  const slides = bannerSlider.querySelectorAll(".carousel-item")
  const indicators = sliderIndicators.querySelectorAll(".slider-indicator")

  slides.forEach((slide, i) => {
    if (i === index) {
      slide.style.display = "block"
      // Reset animations
      const animElements = slide.querySelectorAll(".slide-left, .slide-right, .slide-up, .fade-in")
      animElements.forEach((el) => {
        el.style.animation = "none"
        el.offsetHeight // Trigger reflow
        el.style.animation = null
      })
    } else {
      slide.style.display = "none"
    }
  })

  indicators.forEach((indicator, i) => {
    indicator.classList.toggle("active", i === index)
  })
}

// Start auto-sliding for banner
function startBannerAutoSlide(totalSlides) {
  // Clear any existing interval
  if (bannerSlideInterval) {
    clearInterval(bannerSlideInterval)
  }

  // Set new interval
  bannerSlideInterval = setInterval(() => {
    currentBannerSlide = (currentBannerSlide + 1) % totalSlides
    showBannerSlide(currentBannerSlide)
  }, 6000) // Change slide every 6 seconds
}

// Stop auto-sliding
function stopBannerAutoSlide() {
  if (bannerSlideInterval) {
    clearInterval(bannerSlideInterval)
  }
}

// Initialize filters
function initializeFilters() {
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const filter = this.getAttribute("data-filter")
      currentFilter = filter

      // Update active state
      filterBtns.forEach((b) => b.classList.remove("active"))
      this.classList.add("active")

      // Filter products
      filterProducts(filter)
    })
  })
}

// Filter products
function filterProducts(filter) {
  let filteredPhones = phones

  if (filter !== "all") {
    const year = Number.parseInt(filter)
    filteredPhones = phones.filter((phone) => phone.release_year === year)
  }

  // Reset showAllProducts when changing filters
  showAllProducts = false

  renderProducts(filteredPhones)
}

// Toggle between showing all products and limited products
function toggleProductsView() {
  showAllProducts = !showAllProducts

  // Re-render products with current filter
  let filteredPhones = phones
  if (currentFilter !== "all") {
    const year = Number.parseInt(currentFilter)
    filteredPhones = phones.filter((phone) => phone.release_year === year)
  }

  renderProducts(filteredPhones)

  // Scroll back to products section if showing less
  if (!showAllProducts) {
    const productsSection = document.getElementById("products")
    if (productsSection) {
      window.scrollTo({
        top: productsSection.offsetTop - 80,
        behavior: "smooth",
      })
    }
  }
}

// Render Products
function renderProducts(products) {
  productsContainer.innerHTML = ""

  if (products.length === 0) {
    productsContainer.innerHTML = `
            <div class="col-span-full text-center py-10">
                <p class="text-apple-gray">No products found matching your criteria.</p>
            </div>
        `
    return
  }

  // Determine how many products to show
  const productsToShow = showAllProducts ? products : products.slice(0, PRODUCTS_LIMIT)

  // Create product cards
  productsToShow.forEach((phone) => {
    // Get the price of the first storage option
    const firstStorageOption = Object.keys(phone.price)[0]
    const price = phone.price[firstStorageOption]

    const productCard = document.createElement("div")
    productCard.className = "product-card shadow-md"

    productCard.innerHTML = `
            <div class="relative overflow-hidden group">
                <div class="bg-gradient-to-b from-gray-50 to-gray-100 p-6 flex items-center justify-center h-56">
                    <img src="${phone.image}" alt="${phone.name}" class="h-48 object-contain" />
                </div>
                <div class="absolute top-2 right-2">
                    <span class="badge bg-apple-blue text-white border-none">${phone.release_year}</span>
                </div>
            </div>
            <div class="p-6">
                <h3 class="font-bold text-lg mb-1">${phone.name}</h3>
                <p class="text-sm text-apple-gray mb-3">${phone.subtitle}</p>
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xl font-bold text-apple-blue">${price}</span>
                    <span class="text-xs text-apple-gray">${firstStorageOption}</span>
                </div>
                <div class="text-xs text-apple-gray mb-4">
                    <span>${phone.chipset}</span> • <span>${phone.camera_info}</span>
                </div>
                <div class="flex justify-between gap-2">
                    <button class="btn btn-outline btn-sm flex-1 view-details" data-id="${phone.id}">Details</button>
                    <button class="btn bg-apple-blue hover:bg-blue-600 text-white border-none btn-sm flex-1 add-to-cart" data-id="${phone.id}" data-storage="${firstStorageOption}">Add to Cart</button>
                </div>
            </div>
        `

    productsContainer.appendChild(productCard)
  })

  // Add "View All" / "Show Less" button if there are more than PRODUCTS_LIMIT products
  if (products.length > PRODUCTS_LIMIT) {
    const viewAllContainer = document.createElement("div")
    viewAllContainer.className = "col-span-full flex justify-center mt-8"

    const viewAllButton = document.createElement("button")
    viewAllButton.className =
      "btn btn-lg bg-white hover:bg-apple-blue hover:text-white border-apple-blue text-apple-blue transition-all duration-300"
    viewAllButton.id = "view-all-btn"

    // Set button text based on current state
    viewAllButton.innerHTML = showAllProducts
      ? `<i class="fas fa-chevron-up mr-2"></i> Show Less`
      : `<i class="fas fa-chevron-down mr-2"></i> View All Products (${products.length})`

    viewAllButton.addEventListener("click", toggleProductsView)

    viewAllContainer.appendChild(viewAllButton)
    productsContainer.appendChild(viewAllContainer)
  }

  // Add event listeners to buttons
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", addToCartHandler)
  })

  document.querySelectorAll(".view-details").forEach((button) => {
    button.addEventListener("click", viewDetailsHandler)
  })
}

// Initialize Review Slider
function initializeReviewSlider(reviews) {
  reviewSlider.innerHTML = ""
  reviewIndicators.innerHTML = ""

  reviews.forEach((review, index) => {
    const slideElement = document.createElement("div")
    slideElement.className = `carousel-item relative w-full`
    slideElement.id = `review${index}`

    slideElement.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div class="review-card">
                    <div class="flex items-center mb-4">
                        <div class="avatar placeholder">
                            <div class="bg-apple-blue text-white rounded-full w-12">
                                <span>${review.name01.charAt(0)}</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <h3 class="font-bold">${review.name01}</h3>
                            <div class="stars">
                                ${generateStars(review.rating01)}
                            </div>
                        </div>
                    </div>
                    <p class="text-apple-gray">"${review.subtitle01}"</p>
                </div>
                
                <div class="review-card">
                    <div class="flex items-center mb-4">
                        <div class="avatar placeholder">
                            <div class="bg-apple-blue text-white rounded-full w-12">
                                <span>${review.name02.charAt(0)}</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <h3 class="font-bold">${review.name02}</h3>
                            <div class="stars">
                                ${generateStars(review.rating02)}
                            </div>
                        </div>
                    </div>
                    <p class="text-apple-gray">"${review.subtitle02}"</p>
                </div>
                
                <div class="review-card">
                    <div class="flex items-center mb-4">
                        <div class="avatar placeholder">
                            <div class="bg-apple-blue text-white rounded-full w-12">
                                <span>${review.name03.charAt(0)}</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <h3 class="font-bold">${review.name03}</h3>
                            <div class="stars">
                                ${generateStars(review.rating03)}
                            </div>
                        </div>
                    </div>
                    <p class="text-apple-gray">"${review.subtitle03}"</p>
                </div>
            </div>
        `

    reviewSlider.appendChild(slideElement)

    // Create indicator
    const indicator = document.createElement("div")
    indicator.className = `review-dot ${index === 0 ? "active" : ""}`
    indicator.setAttribute("data-index", index)
    indicator.addEventListener("click", () => {
      showReviewSlide(index)
    })
    reviewIndicators.appendChild(indicator)
  })

  // Show first slide
  showReviewSlide(0)

  // Add event listeners for review navigation
  reviewPrev.addEventListener("click", () => {
    currentReviewSlide = (currentReviewSlide - 1 + reviewSlides.length) % reviewSlides.length
    showReviewSlide(currentReviewSlide)
  })

  reviewNext.addEventListener("click", () => {
    currentReviewSlide = (currentReviewSlide + 1) % reviewSlides.length
    showReviewSlide(currentReviewSlide)
  })
}

// Show specific review slide
function showReviewSlide(index) {
  currentReviewSlide = index
  const slides = reviewSlider.querySelectorAll(".carousel-item")
  const indicators = reviewIndicators.querySelectorAll(".review-dot")

  slides.forEach((slide, i) => {
    slide.style.display = i === index ? "block" : "none"
  })

  indicators.forEach((indicator, i) => {
    indicator.classList.toggle("active", i === index)
  })
}

// Generate star rating HTML
function generateStars(rating) {
  const fullStars = Math.floor(rating)
  const halfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0)

  let starsHTML = ""

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<i class="fas fa-star"></i>'
  }

  // Half star
  if (halfStar) {
    starsHTML += '<i class="fas fa-star-half-alt"></i>'
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<i class="far fa-star"></i>'
  }

  return starsHTML
}

// Add to Cart Handler
function addToCartHandler(event) {
  const button = event.currentTarget
  const phoneId = Number.parseInt(button.getAttribute("data-id"))
  const storage = button.getAttribute("data-storage")

  // Find the phone in our data
  const phone = phones.find((p) => p.id === phoneId)

  if (phone) {
    // Check if this item is already in the cart
    const existingItem = cart.find((item) => item.id === phone.id && item.storage === storage)

    if (existingItem) {
      // Increment quantity
      existingItem.quantity += 1
    } else {
      // Add new item to cart
      cart.push({
        id: phone.id,
        name: phone.name,
        image: phone.image,
        price: phone.price[storage].replace("$", ""),
        storage: storage,
        quantity: 1,
      })
    }

    // Update UI
    updateCartUI()
    saveCart()

    // Show success toast
    showToast(`Added ${phone.name} (${storage}) to cart`, "success")

    // Open cart sidebar
    openCart()
  }
}

// View Details Handler
function viewDetailsHandler(event) {
  const button = event.currentTarget
  const phoneId = Number.parseInt(button.getAttribute("data-id"))

  // Find the phone in our data
  const phone = phones.find((p) => p.id === phoneId)

  if (phone) {
    // Create modal for phone details
    const modal = document.createElement("dialog")
    modal.className = "modal modal-bottom sm:modal-middle custom-modal"
    modal.id = "phone-details-modal"

    const storageOptions = Object.entries(phone.price)
      .map(
        ([storage, price]) => `
            <div class="form-control">
                <label class="label cursor-pointer justify-start">
                    <input type="radio" name="storage" class="radio radio-primary" value="${storage}" ${storage === Object.keys(phone.price)[0] ? "checked" : ""}>
                    <span class="label-text ml-2">${storage} - ${price}</span>
                </label>
            </div>
        `,
      )
      .join("")

    modal.innerHTML = `
            <div class="modal-box bg-white p-0 rounded-2xl overflow-hidden max-w-3xl">
                <div class="bg-apple-blue text-white p-4 flex justify-between items-center">
                    <h3 class="font-bold text-xl">${phone.name}</h3>
                    <button class="btn btn-sm btn-circle bg-white/20 hover:bg-white/30 border-none text-white">✕</button>
                </div>
                <div class="p-6">
                    <div class="flex flex-col md:flex-row gap-6">
                        <div class="md:w-1/3 bg-gray-50 p-4 rounded-xl flex items-center justify-center">
                            <img src="${phone.image}" alt="${phone.name}" class="w-full max-h-64 object-contain">
                        </div>
                        <div class="md:w-2/3">
                            <p class="py-2 text-apple-gray">${phone.description}</p>
                            <div class="divider"></div>
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div class="flex items-center">
                                    <i class="fas fa-calendar-alt text-apple-blue mr-2"></i>
                                    <span><span class="font-medium">Release:</span> ${phone.release_year}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-microchip text-apple-blue mr-2"></i>
                                    <span><span class="font-medium">Chipset:</span> ${phone.chipset}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-camera text-apple-blue mr-2"></i>
                                    <span><span class="font-medium">Camera:</span> ${phone.camera_info}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-hdd text-apple-blue mr-2"></i>
                                    <span><span class="font-medium">Storage:</span> ${phone.storage[0]}</span>
                                </div>
                            </div>
                            <div class="divider"></div>
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">Select Storage Option:</span>
                                </label>
                                ${storageOptions}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-action bg-gray-50 p-4">
                    <button class="btn btn-outline close-modal">Close</button>
                    <button class="btn bg-apple-blue hover:bg-blue-600 text-white border-none add-to-cart-modal" data-id="${phone.id}">Add to Cart</button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        `

    document.body.appendChild(modal)
    modal.showModal()

    // Add event listener to the close button
    modal.querySelector(".close-modal").addEventListener("click", () => {
      modal.close()
      setTimeout(() => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal)
        }
      }, 300)
    })

    // Add event listener to the Add to Cart button in the modal
    modal.querySelector(".add-to-cart-modal").addEventListener("click", () => {
      const selectedStorage = modal.querySelector('input[name="storage"]:checked').value

      // Create a fake button with the necessary data attributes
      const fakeButton = {
        getAttribute: (attr) => {
          if (attr === "data-id") return phone.id
          if (attr === "data-storage") return selectedStorage
          return null
        },
      }

      // Call the add to cart handler with our fake event
      addToCartHandler({ currentTarget: fakeButton })

      // Close the modal
      modal.close()

      // Remove the modal from the DOM after it's closed
      setTimeout(() => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal)
        }
      }, 300)
    })
  }
}

// Update Cart UI
function updateCartUI() {
  // Update cart count
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)
  cartCount.textContent = totalItems

  // Update cart items
  if (cart.length === 0) {
    cartItems.innerHTML = `
            <div class="text-center text-gray-500 py-10">
                <i class="fas fa-shopping-cart text-4xl mb-3 opacity-30"></i>
                <p>Your cart is empty</p>
                <a href="#products" class="text-apple-blue hover:underline text-sm mt-2 inline-block" onclick="closeCart()">Continue Shopping</a>
            </div>
        `
  } else {
    cartItems.innerHTML = ""

    cart.forEach((item) => {
      const cartItem = document.createElement("div")
      cartItem.className = "flex items-center gap-3 mb-4 pb-4 border-b cart-item"

      cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-contain rounded bg-gray-50 p-1">
                <div class="flex-grow">
                    <h4 class="font-medium text-sm">${item.name}</h4>
                    <p class="text-xs text-gray-500">${item.storage}</p>
                    <div class="flex items-center mt-1">
                        <button class="btn btn-xs btn-circle btn-ghost decrease-quantity" data-id="${item.id}" data-storage="${item.storage}">-</button>
                        <span class="mx-2 text-sm">${item.quantity}</span>
                        <button class="btn btn-xs btn-circle btn-ghost increase-quantity" data-id="${item.id}" data-storage="${item.storage}">+</button>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-medium">$${(Number.parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                    <button class="btn btn-xs btn-ghost text-red-500 mt-1 remove-item" data-id="${item.id}" data-storage="${item.storage}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `

      cartItems.appendChild(cartItem)
    })

    // Add event listeners to cart item buttons
    document.querySelectorAll(".decrease-quantity").forEach((button) => {
      button.addEventListener("click", decreaseQuantityHandler)
    })

    document.querySelectorAll(".increase-quantity").forEach((button) => {
      button.addEventListener("click", increaseQuantityHandler)
    })

    document.querySelectorAll(".remove-item").forEach((button) => {
      button.addEventListener("click", removeItemHandler)
    })
  }

  // Update cart totals
  updateCartTotals()
}

// Update Cart Totals
function updateCartTotals() {
  // Calculate subtotal
  const subtotal = cart.reduce((total, item) => {
    return total + Number.parseFloat(item.price) * item.quantity
  }, 0)

  // Calculate shipping
  let shipping = cart.length > 0 ? SHIPPING_FEE : 0

  // Apply coupon if any
  let discount = 0

  if (appliedCoupon) {
    if (appliedCoupon === "freeshipping") {
      shipping = 0
    } else {
      discount = subtotal * appliedCoupon
    }
  }

  // Calculate total
  const total = subtotal + shipping - discount

  // Update UI
  cartSubtotal.textContent = `$${subtotal.toFixed(2)}`
  cartShipping.textContent = `$${shipping.toFixed(2)}`
  cartDiscount.textContent = `-$${discount.toFixed(2)}`
  cartTotal.textContent = `$${total.toFixed(2)}`
}

// Decrease Quantity Handler
function decreaseQuantityHandler(event) {
  const button = event.currentTarget
  const id = Number.parseInt(button.getAttribute("data-id"))
  const storage = button.getAttribute("data-storage")

  const itemIndex = cart.findIndex((item) => item.id === id && item.storage === storage)

  if (itemIndex !== -1) {
    if (cart[itemIndex].quantity > 1) {
      cart[itemIndex].quantity -= 1
    } else {
      cart.splice(itemIndex, 1)
    }

    updateCartUI()
    saveCart()
  }
}

// Increase Quantity Handler
function increaseQuantityHandler(event) {
  const button = event.currentTarget
  const id = Number.parseInt(button.getAttribute("data-id"))
  const storage = button.getAttribute("data-storage")

  const itemIndex = cart.findIndex((item) => item.id === id && item.storage === storage)

  if (itemIndex !== -1) {
    cart[itemIndex].quantity += 1
    updateCartUI()
    saveCart()
  }
}

// Remove Item Handler
function removeItemHandler(event) {
  const button = event.currentTarget
  const id = Number.parseInt(button.getAttribute("data-id"))
  const storage = button.getAttribute("data-storage")

  const itemIndex = cart.findIndex((item) => item.id === id && item.storage === storage)

  if (itemIndex !== -1) {
    cart.splice(itemIndex, 1)
    updateCartUI()
    saveCart()

    showToast("Item removed from cart", "info")
  }
}

// Checkout Handler
function checkoutHandler() {
  if (cart.length === 0) {
    showToast("Your cart is empty. Add some products first.", "error")
    return
  }

  // Calculate total amount
  const subtotal = cart.reduce((total, item) => {
    return total + Number.parseFloat(item.price) * item.quantity
  }, 0)

  // Calculate shipping
  let shipping = SHIPPING_FEE

  // Apply coupon if any
  let discount = 0

  if (appliedCoupon) {
    if (appliedCoupon === "freeshipping") {
      shipping = 0
    } else {
      discount = subtotal * appliedCoupon
    }
  }

  // Calculate total
  const total = subtotal + shipping - discount

  // In a real application, you would process payment here

  // Create a more detailed success message
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0)
  const message = `Thank you for your purchase! Your order for ${itemCount} item${itemCount > 1 ? "s" : ""} totaling $${total.toFixed(2)} has been placed successfully.`

  // Clear the cart
  cart = []
  appliedCoupon = null

  // Update UI
  updateCartUI()
  saveCart()

  // Close cart sidebar
  closeCart()

  // Show success notification
  showToast(message, "success", 5000) // Show for 5 seconds
}

// Apply Coupon Handler
function applyCouponHandler() {
  const couponCode = couponInput.value.trim().toUpperCase()

  if (couponCode === "") {
    showToast("Please enter a coupon code", "error")
    return
  }

  if (COUPONS[couponCode]) {
    appliedCoupon = COUPONS[couponCode]
    updateCartTotals()
    showToast(`Coupon ${couponCode} applied successfully!`, "success")
    saveCart()
  } else {
    showToast("Invalid coupon code", "error")
  }
}

// Open Cart
function openCart() {
  cartSidebar.classList.remove("translate-x-full")

  // Add overlay
  const overlay = document.createElement("div")
  overlay.className = "cart-overlay"
  overlay.id = "cart-overlay"
  overlay.addEventListener("click", closeCart)
  document.body.appendChild(overlay)

  // Show overlay
  setTimeout(() => {
    overlay.classList.add("active")
  }, 10)

  // Prevent body scrolling
  document.body.style.overflow = "hidden"
}

// Close Cart
function closeCart() {
  cartSidebar.classList.add("translate-x-full")

  // Remove overlay
  const overlay = document.getElementById("cart-overlay")
  if (overlay) {
    overlay.classList.remove("active")
    setTimeout(() => {
      document.body.removeChild(overlay)
    }, 300)
  }

  // Restore body scrolling
  document.body.style.overflow = ""
}

// Save Cart to localStorage
function saveCart() {
  localStorage.setItem(
    "cart",
    JSON.stringify({
      items: cart,
      appliedCoupon: appliedCoupon,
    }),
  )
}

// Load Cart from localStorage
function loadCart() {
  const savedCart = localStorage.getItem("cart")

  if (savedCart) {
    const parsedCart = JSON.parse(savedCart)
    cart = parsedCart.items || []
    appliedCoupon = parsedCart.appliedCoupon || null
    updateCartUI()
  }
}

// Show Toast Notification
function showToast(message, type = "info", duration = 3000) {
  // Check if a toast container exists
  let toastContainer = document.getElementById("toast-container")

  // If not, create one
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.id = "toast-container"
    toastContainer.className = "toast-container"
    document.body.appendChild(toastContainer)
  }

  // Create toast
  const toast = document.createElement("div")
  toast.className = `toast ${type}`

  // Icon based on type
  let icon = ""
  if (type === "success") {
    icon = '<i class="fas fa-check-circle mr-2"></i>'
  } else if (type === "error") {
    icon = '<i class="fas fa-exclamation-circle mr-2"></i>'
  } else {
    icon = '<i class="fas fa-info-circle mr-2"></i>'
  }

  toast.innerHTML = `
        ${icon}
        <span class="flex-grow">${message}</span>
        <button class="btn btn-xs btn-circle ml-2">✕</button>
    `

  // Add flex styling to toast
  toast.style.display = "flex"
  toast.style.alignItems = "center"

  // Add to container
  toastContainer.appendChild(toast)

  // Add event listener to close button
  const closeBtn = toast.querySelector(".btn-circle")
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      toast.style.opacity = "0"
      setTimeout(() => {
        if (document.body.contains(toast)) {
          toastContainer.removeChild(toast)

          // Remove container if empty
          if (toastContainer.children.length === 0) {
            document.body.removeChild(toastContainer)
          }
        }
      }, 300)
    })
  }

  // Remove after specified duration
  setTimeout(() => {
    if (document.body.contains(toast) && toast.style.opacity !== "0") {
      toast.style.opacity = "0"
      setTimeout(() => {
        if (document.body.contains(toast)) {
          toastContainer.removeChild(toast)

          // Remove container if empty
          if (toastContainer.children.length === 0) {
            document.body.removeChild(toastContainer)
          }
        }
      }, 300)
    }
  }, duration)
}

// Contact Form Submission
contactForm.addEventListener("submit", (event) => {
  event.preventDefault()

  // Get form data
  const formData = new FormData(contactForm)
  const formValues = Object.fromEntries(formData.entries())

  // In a real application, you would send this data to a server
  console.log("Form submitted:", formValues)

  // Show success message
  showToast("Message sent successfully! We will get back to you soon.", "success")

  // Reset form
  contactForm.reset()
})

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Fetch data
  fetchData()

  // Cart toggle
  cartBtn.addEventListener("click", openCart)
  closeCartBtn.addEventListener("click", closeCart)

  // Apply coupon
  applyCouponBtn.addEventListener("click", applyCouponHandler)

  // Find the checkout button and add event listener
  const checkoutBtn = document.querySelector("#cart-sidebar .btn.w-full")
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", checkoutHandler)
  }

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      const targetElement = document.querySelector(targetId)

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Adjust for navbar height
          behavior: "smooth",
        })
      }
    })
  })

  // Add functionality for all close buttons
  document.addEventListener("click", (event) => {
    // Check if the clicked element has a close button class
    if (
      event.target.classList.contains("btn-circle") &&
      (event.target.textContent.includes("✕") || event.target.innerHTML.includes("fa-times"))
    ) {
      // Find the closest modal, alert, or dialog
      const modal = event.target.closest(".modal")
      const alert = event.target.closest(".alert")
      const toast = event.target.closest(".toast")

      if (modal) {
        // Close modal
        modal.close()
        // If it's a custom modal that was dynamically added, remove it after closing
        if (modal.id === "phone-details-modal" || modal.classList.contains("custom-modal")) {
          setTimeout(() => {
            if (document.body.contains(modal)) {
              document.body.removeChild(modal)
            }
          }, 300)
        }
      } else if (alert) {
        // Fade out and remove alert
        alert.style.opacity = "0"
        setTimeout(() => {
          if (alert.parentNode) {
            alert.parentNode.removeChild(alert)
          }
        }, 300)
      } else if (toast) {
        // Fade out and remove toast
        toast.style.opacity = "0"
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast)
          }
        }, 300)
      }
    }
  })

  // Add escape key functionality to close modals and dialogs
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      // Close cart if open
      if (!cartSidebar.classList.contains("translate-x-full")) {
        closeCart()
      }

      // Close any open modals
      const openModals = document.querySelectorAll(".modal[open]")
      openModals.forEach((modal) => {
        modal.close()
        // Remove dynamically added modals
        if (modal.id === "phone-details-modal" || modal.classList.contains("custom-modal")) {
          setTimeout(() => {
            if (document.body.contains(modal)) {
              document.body.removeChild(modal)
            }
          }, 300)
        }
      })
    }
  })
})
