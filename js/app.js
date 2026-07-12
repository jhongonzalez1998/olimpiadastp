const musica = document.getElementById("musica-torneo");
const iconoPlay = document.getElementById("icono-play");
const iconoPausa = document.getElementById("icono-pausa");

// Volumen inicial de fondo (0.3 es perfecto para que no moleste)
musica.volume = 0.3;

function controlarMusica() {
  if (musica.paused) {
    musica
      .play()
      .then(() => {
        iconoPlay.classList.add("hidden");
        iconoPausa.classList.remove("hidden");
      })
      .catch((err) =>
        console.log("Interacción requerida para reproducir audio.", err),
      );
  } else {
    musica.pause();
    iconoPlay.classList.remove("hidden");
    iconoPausa.classList.add("hidden");
  }
}

// Escuchar cuando el HTML termine de cargar por completo
document.addEventListener("DOMContentLoaded", () => {
  // Primera carga de datos públicos del torneo
  if (typeof inicializarTorneoRealtime === "function") {
    inicializarTorneoRealtime();
  }
});
