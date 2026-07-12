// Configuración de la conexión con Supabase
const SUPABASE_URL = "https://tccfaxjfwbcpqcfyxvql.supabase.co"; // Cambia esto
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjY2ZheGpmd2JjcHFjZnl4dnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MjIwNjYsImV4cCI6MjA5OTM5ODA2Nn0.vXnP5psPFPjWY4dGJMgNYsseQHtv7y2jUxytD-s0meI"; // Cambia esto

// Inicializar el cliente global que usarán los otros scripts
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
