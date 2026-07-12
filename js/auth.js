// Variable global para almacenar el usuario autenticado
let usuarioActual = null;

// Control de vistas (Routing básico)
function mostrarVista(vista) {
  const publico = document.getElementById("vista-publico");
  const login = document.getElementById("vista-login");
  const admin = document.getElementById("vista-admin");

  // Ocultar todo primero
  publico.classList.add("hidden");
  login.classList.add("hidden");
  admin.classList.add("hidden");

  if (vista === "publico") {
    publico.classList.remove("hidden");
  } else if (vista === "login") {
    if (usuarioActual) {
      mostrarVista("admin");
    } else {
      login.classList.remove("hidden");
    }
  } else if (vista === "admin") {
    if (!usuarioActual) {
      mostrarVista("login");
    } else {
      admin.classList.remove("hidden");
    }
  }
}

// Iniciar sesión con el usuario de Supabase Auth
async function iniciarSesion() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const { data, error } = await _supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Error de autenticación: " + error.message);
  } else {
    usuarioActual = data.user;

    // Ajustar botones de la barra de navegación
    document.getElementById("btn-logout").classList.remove("hidden");
    document.getElementById("btn-vista-admin").classList.add("hidden");

    mostrarVista("admin");
    // Inicializar los datos del panel de administrador (Cargados desde torneo.js)
    if (typeof cargarPanelAdmin === "function") cargarPanelAdmin();
  }
}

// Cerrar sesión
async function cerrarSesion() {
  await _supabase.auth.signOut();
  usuarioActual = null;

  document.getElementById("btn-logout").classList.add("hidden");
  document.getElementById("btn-vista-admin").classList.remove("hidden");

  // Limpiar inputs de contraseña
  document.getElementById("login-password").value = "";

  mostrarVista("publico");
}
