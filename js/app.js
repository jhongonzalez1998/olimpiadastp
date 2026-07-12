const musica = document.getElementById("musica-torneo");
const iconoPlay = document.getElementById("icono-play");
const iconoPausa = document.getElementById("icono-pausa");

// Volumen inicial de fondo
musica.volume = 0.3;

function controlarMusica() {
  if (musica.paused) {
    reproducirAudio();
  } else {
    pausarAudio();
  }
}

function reproducirAudio() {
  musica
    .play()
    .then(() => {
      iconoPlay.classList.add("hidden");
      iconoPausa.classList.remove("hidden");
    })
    .catch((err) =>
      console.log(
        "Auto-play bloqueado temporalmente por el navegador. Esperando interacción.",
      ),
    );
}

function pausarAudio() {
  musica.pause();
  iconoPlay.classList.remove("hidden");
  iconoPausa.classList.add("hidden");
}

// 🔥 EL TRUCO DEL AUTOPLAY: Intentar reproducir al primer clic en cualquier lado de la web
function activarAutoplay() {
  reproducirAudio();
  // Una vez que suena, removemos los listeners para que no se reinicie el audio en cada clic
  document.removeEventListener("click", activarAutoplay);
  document.removeEventListener("touchstart", activarAutoplay);
}

// Escuchar cuando el HTML termine de cargar por completo
document.addEventListener("DOMContentLoaded", () => {
  // Intentar arrancar directo (por si el navegador lo permite en algunos casos)
  reproducirAudio();

  // Si el navegador lo bloqueó, se activará al primer clic o toque táctil del usuario
  document.addEventListener("click", activarAutoplay);
  document.addEventListener("touchstart", activarAutoplay);

  // Primera carga de datos públicos del torneo
  if (typeof inicializarTorneoRealtime === "function") {
    inicializarTorneoRealtime();
  }
});
