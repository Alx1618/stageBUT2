document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".tab-link");
  const valueItems = document.querySelectorAll(".value-item");
  const dots = document.querySelectorAll(".dots-container:not(.mobile) .dot");
  const slides = document.querySelectorAll(".slider-mobile .slide");
  const mobileDots = document.querySelectorAll(".dots-container.mobile .dot");

  // Le conteneur principal
  const valeursContainer = document.querySelector(".valeurs-container");

  // Index courant (pour desktop + mobile)
  let currentIndex = 0;

  // Variables pour le swipe mobile
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;
  let isAnimating = false;

  // Gestion de l’auto-cycle
  let autoCycle = null;
  const swipeThreshold = 50; // Seuil minimal pour le swipe horizontal

  // Flags pour stopper l’auto-cycle
  let blockHovered = false;
  let blockFullyVisible = false;

  // ---------------------------------------------------------
  // 1) Fonction fadeIn simple pour la partie desktop
  // ---------------------------------------------------------
  function fadeIn(element) {
    // Force l'affichage en "flex"
    element.style.display = "flex";
    element.style.opacity = 0;
    element.style.transition = ""; // Réinitialise la transition

    // Au prochain frame, on enclenche l’animation vers opacité 1
    requestAnimationFrame(() => {
      element.style.transition = "opacity 0.5s ease-in-out";
      element.style.opacity = 1;
    });
  }

  // ---------------------------------------------------------
  // 2) Mise à jour Desktop (onglets + dots + fade-in)
  // ---------------------------------------------------------
  function updateDesktop(index) {
    // Retire l'état actif des onglets, items, dots
    tabs.forEach(tab => tab.classList.remove("active"));
    dots.forEach(dot => dot.classList.remove("active"));

    // On cache immédiatement tous les .value-item
    valueItems.forEach(item => {
      item.classList.remove("active");
      item.style.display = "none";
      item.style.opacity = 0;
      item.style.transition = "";
    });

    // Active l’onglet + dot ciblés
    tabs[index].classList.add("active");
    dots[index].classList.add("active");

    // Active et fadeIn le .value-item correspondant
    const newItem = valueItems[index];
    newItem.classList.add("active");
    fadeIn(newItem);
  }

  // ---------------------------------------------------------
  // 3) Mise à jour Mobile instantanée (sans animation)
  // ---------------------------------------------------------
  function updateMobileInstant(index) {
    slides.forEach(slide => {
      slide.classList.remove("active");
      slide.style.transition = "";
      slide.style.transform = "translateX(100%)";
      slide.style.opacity = 1;
    });
    mobileDots.forEach(dot => dot.classList.remove("active"));

    slides[index].classList.add("active");
    slides[index].style.transform = "translateX(0)";
    mobileDots[index].classList.add("active");
  }

  // ---------------------------------------------------------
  // 4) Animation de transition Mobile (slide + léger fondu)
  // ---------------------------------------------------------
  function animateTransition(newIndex, direction) {
    if (isAnimating) return;
    isAnimating = true;

    const currentSlide = slides[currentIndex];
    const nextSlide = slides[newIndex];

    // Prépare la slide suivante
    nextSlide.classList.add("active");
    nextSlide.style.transition = "none";
    nextSlide.style.transform = (direction === "left")
      ? "translateX(100%)"
      : "translateX(-100%)";
    nextSlide.style.opacity = 0;

    requestAnimationFrame(() => {
      nextSlide.getBoundingClientRect();

      currentSlide.style.transition = "transform 0.5s ease-in-out, opacity 0.5s ease-in-out";
      nextSlide.style.transition = "transform 0.5s ease-in-out, opacity 0.5s ease-in-out";

      currentSlide.style.transform = (direction === "left")
        ? "translateX(-100%)"
        : "translateX(100%)";
      currentSlide.style.opacity = 0;

      nextSlide.style.transform = "translateX(0)";
      nextSlide.style.opacity = 1;
    });

    mobileDots.forEach(dot => dot.classList.remove("active"));
    mobileDots[newIndex].classList.add("active");

    setTimeout(() => {
      currentSlide.classList.remove("active");
      currentSlide.style.transition = "";
      currentSlide.style.opacity = 1;
      nextSlide.style.transition = "";

      currentIndex = newIndex;
      isAnimating = false;
    }, 500);
  }

  // ---------------------------------------------------------
  // 5) Listeners Desktop (clic onglets + clic dots)
  // ---------------------------------------------------------
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      currentIndex = index;
      updateDesktop(index);
      updateMobileInstant(index);
    });
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      currentIndex = index;
      updateDesktop(index);
      updateMobileInstant(index);
    });
  });

  // ---------------------------------------------------------
  // 6) Listeners Mobile (dots + swipe)
  // ---------------------------------------------------------
  mobileDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      currentIndex = index;
      updateMobileInstant(index);
      updateDesktop(index);
    });
  });

  const sliderMobile = document.querySelector(".slider-mobile");
  sliderMobile.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  sliderMobile.addEventListener("touchend", (e) => {
    if (isAnimating) return;

    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Geste majoritairement horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX < 0) {
        const newIndex = (currentIndex + 1) % tabs.length;
        animateTransition(newIndex, "left");
        updateDesktop(newIndex);
      } else {
        const newIndex = (currentIndex - 1 + slides.length) % slides.length;
        animateTransition(newIndex, "right");
        updateDesktop(newIndex);
      }
    }
  });

  // ---------------------------------------------------------
  // 7) Auto-cycle Desktop (rotation onglets toutes les 5s)
  // ---------------------------------------------------------
  function startAutoCycle() {
    stopAutoCycle(); 
    autoCycle = setInterval(() => {
      currentIndex = (currentIndex + 1) % tabs.length;
      updateDesktop(currentIndex);
      updateMobileInstant(currentIndex);
    }, 5000);
  }

  function stopAutoCycle() {
    if (autoCycle) {
      clearInterval(autoCycle);
      autoCycle = null;
    }
  }

  // Gère l'état de l'auto-cycle selon la souris et la visibilité
  function updateAutoCycleState() {
    if (blockHovered || blockFullyVisible) {
      stopAutoCycle();
    } else {
      startAutoCycle();
    }
  }

  // ---------------------------------------------------------
  // 8) Survol de la zone => blockHovered
  // ---------------------------------------------------------
  if (valeursContainer) {
    valeursContainer.addEventListener("mouseover", () => {
      blockHovered = true;
      updateAutoCycleState();
    });
    valeursContainer.addEventListener("mouseleave", () => {
      blockHovered = false;
      updateAutoCycleState();
    });
  }

  // ---------------------------------------------------------
  // 9) IntersectionObserver => blockFullyVisible
  // ---------------------------------------------------------
  if (valeursContainer) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && entry.intersectionRatio === 1) {
        // Le bloc est entièrement visible
        blockFullyVisible = true;
      } else {
        blockFullyVisible = false;
      }
      updateAutoCycleState();
    }, { threshold: 1.0 });

    observer.observe(valeursContainer);
  }

  // ---------------------------------------------------------
  // 10) On lance l'auto-cycle au démarrage
  // ---------------------------------------------------------
  startAutoCycle();
});


document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll(".my-expertises-link");
  const slides = document.querySelectorAll(".my-expertises-slide");

  links.forEach(link => {
    link.addEventListener("click", () => {
      // Retire .is-active de tous les onglets
      links.forEach(l => l.classList.remove("is-active"));
      // Retire .is-active de toutes les slides
      slides.forEach(s => s.classList.remove("is-active"));

      // Active l'onglet cliqué
      link.classList.add("is-active");
      // Récupère l'index
      const index = link.getAttribute("data-index");
      // Montre la slide correspondante
      slides[index].classList.add("is-active");
    });
  });
});




document.addEventListener("DOMContentLoaded", function () {
  // Sélecteurs adaptés à ton HTML/CSS
  const myExpertisesTabs = document.querySelectorAll(".my-expertises-link");
  const myExpertisesSlides = document.querySelectorAll(".my-expertises-slide");
  const myExpertisesDots = document.querySelectorAll(".slider-dots .dot");

  // 1) Fonction fadeIn : affiche un slide en douceur
  function fadeIn(element) {
    element.style.display = "flex";  // ou "block", selon ta mise en page
    element.style.opacity = 0;
    element.style.transition = ""; // Réinitialise la transition

    // Au prochain "frame", on enclenche la transition vers opacité 1
    requestAnimationFrame(() => {
      element.style.transition = "opacity 0.5s ease-in-out";
      element.style.opacity = 1;
    });
  }

  // 2) Mise à jour : onglets, dots, slides + fadeIn
  function updateExpertises(index) {
    // Retire l’état actif de tous les onglets
    myExpertisesTabs.forEach(tab => tab.classList.remove("is-active"));
    // Retire l’état actif de tous les dots
    myExpertisesDots.forEach(dot => dot.classList.remove("active"));

    // Cache toutes les slides
    myExpertisesSlides.forEach(slide => {
      slide.classList.remove("is-active");
      slide.style.display = "none";
      slide.style.opacity = 0;
      slide.style.transition = "";
    });

    // Active l’onglet + dot ciblés
    myExpertisesTabs[index].classList.add("is-active");
    myExpertisesDots[index].classList.add("active");

    // FadeIn sur la slide correspondante
    const newSlide = myExpertisesSlides[index];
    newSlide.classList.add("is-active");
    fadeIn(newSlide);
  }

  // Clic sur les onglets
  myExpertisesTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      updateExpertises(index);
    });
  });

  
  // Initialisation : on affiche la première slide
  updateExpertises(0);
});

document.addEventListener("DOMContentLoaded", () => {
  const linksContainer = document.querySelector(".my-expertises-tabs");
  const links = document.querySelectorAll(".my-expertises-link");

  // 1) Crée la flèche
  const indicator = document.createElement("div");
  indicator.classList.add("active-indicator");
  indicator.textContent = "➤";  // Affiche une flèche
  linksContainer.appendChild(indicator);

  // 2) Fonction qui déplace la flèche sur l'onglet actif
  function moveIndicator(activeLink) {
  if (!activeLink) return;

  const linkRect = activeLink.getBoundingClientRect();
  const containerRect = activeLink.parentElement.getBoundingClientRect();

  // On calcule la position Y voulue
  const topOffset = linkRect.top - containerRect.top + (linkRect.height / 2) - 8;

  // On applique transform => CSS fait le reste
  indicator.style.transform = `translateY(${topOffset}px)`;
}


  // 3) Active un onglet + déplace la flèche
  function activateLink(link) {
    // Désactive tous les onglets
    links.forEach(l => l.classList.remove("is-active"));
    // Active celui-ci
    link.classList.add("is-active");
    // Déplace la flèche
    moveIndicator(link);
  }

  // 4) Initialise
  let defaultLink = document.querySelector(".my-expertises-link.is-active") || links[0];
  activateLink(defaultLink);

  // 5) Au clic, on active l'onglet
  links.forEach(link => {
    link.addEventListener("click", () => {
      activateLink(link);
    });
  });
});


  document.addEventListener("DOMContentLoaded", function () {
    if (window.innerWidth <= 768) {
      document.querySelectorAll(".btn-learn-more").forEach(btn => {
        btn.textContent = "En savoir plus";
      });
    }
  });
document.addEventListener("DOMContentLoaded", function () {
  // =========================
  // Variables globales
  // =========================
  let currentIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const swipeThreshold = 50; // distance minimale en px pour valider le swipe

  // =========================
  // Sélecteurs
  // =========================
  const tabs = document.querySelectorAll(".my-expertises-link");
  const slides = document.querySelectorAll(".my-expertises-slide");
  const carousel = document.querySelector(".my-expertises-carousel");
  // On ne met PAS d'écouteur sur les dots, donc on peut les sélectionner ou pas
  const dots = document.querySelectorAll(".slider-dots .dot");

  // =========================
  // Fonctions
  // =========================

  // -- fadeIn(element) : Affiche en douceur
  function fadeIn(element) {
    element.style.display = "flex";
    element.style.opacity = 0;
    element.style.transition = "";

    requestAnimationFrame(() => {
      element.style.transition = "opacity 0.5s ease-in-out";
      element.style.opacity = 1;
    });
  }

  // -- updateExpertises(index) : Met à jour la slide active + l’onglet actif
  function updateExpertises(index) {
    // Retire l’état actif de tous les onglets
    tabs.forEach(tab => tab.classList.remove("is-active"));
    // Cache toutes les slides
    slides.forEach(slide => {
      slide.classList.remove("is-active");
      slide.style.display = "none";
      slide.style.opacity = 0;
      slide.style.transition = "";
    });
    // (Optionnel) Retire l’état actif de tous les dots
    dots.forEach(dot => dot.classList.remove("active"));

    // Active l’onglet + la slide ciblés
    tabs[index].classList.add("is-active");
    const newSlide = slides[index];
    newSlide.classList.add("is-active");
    fadeIn(newSlide);

    // (Optionnel) Active le dot correspondant
    dots[index].classList.add("active");

    // Met à jour l’indicateur flèche
    moveIndicator(tabs[index]);

    currentIndex = index;
  }

  // -- moveIndicator(activeLink) : Déplace la flèche à côté de l’onglet actif
  const linksContainer = document.querySelector(".my-expertises-tabs");
  const indicator = document.createElement("div");
  indicator.classList.add("active-indicator");
  indicator.textContent = "➤"; // Icône flèche
  linksContainer.appendChild(indicator);

  function moveIndicator(activeLink) {
    if (!activeLink) return;
    const linkRect = activeLink.getBoundingClientRect();
    const containerRect = activeLink.parentElement.getBoundingClientRect();

    const topOffset = linkRect.top - containerRect.top + (linkRect.height / 2) - 8;
    indicator.style.transform = `translateY(${topOffset}px)`;
  }

  // =========================
  // Écouteurs
  // =========================

  // 1) Clic sur les onglets
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => {
      updateExpertises(i);
    });
  });

  // 2) On NE MET PAS d'écouteur sur les dots => pas de clic sur dots
  // (on commente ou on ne met pas du tout)
  /*
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      // on ne fait rien
    });
  });
  */

  // 3) Swipe sur mobile (ou sur carousel)
  carousel.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  carousel.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Vérifie geste horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      let newIndex = currentIndex;
      if (deltaX < 0) {
        // Swipe vers la gauche => slide suivante
        newIndex = (currentIndex + 1) % slides.length;
      } else {
        // Swipe vers la droite => slide précédente
        newIndex = (currentIndex - 1 + slides.length) % slides.length;
      }
      updateExpertises(newIndex);
    }
  });

  // =========================
  // Initialisation
  // =========================
  // On force l’affichage de la première slide
  updateExpertises(0);
});

document.addEventListener("DOMContentLoaded", function() {
  // Sélecteurs pour la seconde section
  const tabs2 = document.querySelectorAll(".my-expertises2-link");
  const slides2 = document.querySelectorAll(".my-expertises2-slide");
  const dots2 = document.querySelectorAll(".slider-dots2 .dot2");
  let currentIndex2 = 0;

  function updateExpertises2(index2) {
    // Désactive tout
    tabs2.forEach(tab => tab.classList.remove("is-active"));
    slides2.forEach(slide => {
      slide.classList.remove("is-active");
      slide.style.display = "none";
      slide.style.opacity = 0;
    });
    dots2.forEach(dot => dot.classList.remove("active"));

    // Active l'onglet, la slide et le dot
    tabs2[index2].classList.add("is-active");
    slides2[index2].classList.add("is-active");
    slides2[index2].style.display = "block";
    slides2[index2].style.opacity = 1;
    dots2[index2].classList.add("active");

    currentIndex2 = index2;
  }

  // Clic sur onglets
  tabs2.forEach((tab, i) => {
    tab.addEventListener("click", () => {
      updateExpertises2(i);
    });
  });

  // Optionnel : clic sur dots
  dots2.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      updateExpertises2(i);
    });
  });

  // Initialise la première slide
  updateExpertises2(0);
});

document.addEventListener('DOMContentLoaded', () => {
  const tags = document.querySelectorAll('.my-acc-tag2');
  const slides = document.querySelectorAll('.my-expertises4-slide');

  // Si aucune slide n'est active au départ, on affiche la première
  if (!document.querySelector('.my-expertises4-slide.is-active') && slides.length > 0) {
    slides[0].classList.add('is-active');
  }

  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      // Retire la classe is-active de tous les boutons et slides
      tags.forEach(t => t.classList.remove('is-active'));
      slides.forEach(slide => slide.classList.remove('is-active'));

      // Active le bouton cliqué
      tag.classList.add('is-active');

      // Récupère la valeur de data-target, par exemple "slide-1"
      const target = tag.dataset.target; 
      // Convertit "slide-1" en index numérique : 1 - 1 = 0
      const index = parseInt(target.replace('slide-', ''), 10) - 1;
      
      // Sélectionne la slide dont data-index correspond
      const targetSlide = document.querySelector(`.my-expertises4-slide[data-index="${index}"]`);

      // Affiche la slide correspondante
      if (targetSlide) {
        targetSlide.classList.add('is-active');
      } else {
        console.log('Aucune slide trouvée pour l’index', index);
      }
    });
  });
});

