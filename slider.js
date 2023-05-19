var slides = document.getElementsByClassName("slide");
var triggersContainer = document.querySelector(".screens");

var currentIndex = 0;
var slideInterval;
var startX = 0;
var threshold = 100; // Минимальное расстояние для определения свайпа

var prevButton = document.querySelector(".prev-button");
var nextButton = document.querySelector(".next-button");

function removeAllTriggers() {
  var existingTriggers = triggersContainer.querySelectorAll(
    "input[type='radio'], label"
  );
  existingTriggers.forEach(function (trigger) {
    triggersContainer.removeChild(trigger);
  });
}

function createTrigger(index) {
  var trigger = document.createElement("input");
  trigger.type = "radio";
  trigger.id = "trigger" + (index + 1);
  trigger.name = "slider";
  if (index === currentIndex) {
    trigger.checked = true;
  }

  // Добавляем обработчик события change
  trigger.addEventListener("change", function () {
    var previousSlide = slides[currentIndex];
    previousSlide.classList.remove("active");
    currentIndex = index;
    showSlide(currentIndex, null);
    startSlideShow();
  });

  var label = document.createElement("label");
  label.setAttribute("for", trigger.id);

  triggersContainer.appendChild(trigger);
  triggersContainer.appendChild(label);
}

function createTriggers() {
  removeAllTriggers();
  for (var i = 0; i < slides.length; i++) {
    createTrigger(i);
  }
}

function showSlide(index, direction) {
  var currentSlide = slides[currentIndex];
  var nextSlide = slides[index];

  currentSlide.classList.remove("active", "next", "previous");
  nextSlide.classList.add("active");

  // Добавляем класс для направления анимации
  if (direction === "next") {
    nextSlide.classList.add("next");
  } else if (direction === "previous") {
    nextSlide.classList.add("previous");
  }

  currentIndex = index;

  // Добавляем класс "active" к соответствующему label
  var triggerLabels = triggersContainer.querySelectorAll("label");
  triggerLabels.forEach(function (label, labelIndex) {
    if (labelIndex === index) {
      label.classList.add("active");
    } else {
      label.classList.remove("active");
    }
  });

  // Проверяем границы слайдов и скрываем/отображаем кнопки "Prev" и "Next"
  if (currentIndex === 0) {
    prevButton.disabled = true;
    nextButton.disabled = false;
  } else if (currentIndex === slides.length - 1) {
    prevButton.disabled = false;
    nextButton.disabled = true;
  } else {
    prevButton.disabled = false;
    nextButton.disabled = false;
  }
}

createTriggers();

// Добавляем обработчик для события touchstart
triggersContainer.addEventListener("touchstart", function (event) {
  startX = event.touches[0].clientX;
});

// Добавляем обработчик для события touchend
triggersContainer.addEventListener("touchend", function (event) {
  var endX = event.changedTouches[0].clientX;
  var deltaX = endX - startX;

  if (deltaX > threshold) {
    // Переключаемся на предыдущий слайд
    previousSlide();
    startSlideShow();
  } else if (deltaX < -threshold) {
    // Переключаемся на следующий слайд
    nextSlide();
    startSlideShow();
  }
});

triggersContainer.addEventListener("mouseenter", function () {
  stopSlideShow();
});

triggersContainer.addEventListener("mouseleave", function () {
  startSlideShow();
});

// Остальная часть JavaScript кода остается неизменной

function startSlideShow() {
  stopSlideShow();
  slideInterval = setInterval(nextSlide, 5000); // Интервал автоматического переключения слайдов (5 секунды)
}

function stopSlideShow() {
  clearInterval(slideInterval);
}

function nextSlide() {
  var nextIndex = (currentIndex + 1) % slides.length;
  showSlide(nextIndex, "next");
}

function previousSlide() {
  var previousIndex = (currentIndex - 1 + slides.length) % slides.length;
  showSlide(previousIndex, "previous");
}

document.addEventListener("DOMContentLoaded", function () {
  showSlide(currentIndex);
  startSlideShow();
});

// Добавляем обработчик для кнопки "Prev"
prevButton.addEventListener("click", function () {
  if (currentIndex !== 0) {
    previousSlide();
    startSlideShow();
  }
});

// Добавляем обработчик для кнопки "Next"
nextButton.addEventListener("click", function () {
  if (currentIndex !== slides.length - 1) {
    nextSlide();
    startSlideShow();
  }
});
