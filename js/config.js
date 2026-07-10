// =========================================================
// config.js — Configuração do Supabase
// =========================================================

const SUPABASE_URL = "https://wdyvnczubupwkjkvlvgg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkeXZuY3p1YnVwd2tqa3ZsdmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDkwMzcsImV4cCI6MjA5OTE4NTAzN30._pO3_gVX-bkqLA9_UkdcPYTbWV3IH_G-8XG93-3vQFA";

// A CDN do Supabase expõe a biblioteca em window.supabase.
// Reatribuímos window.supabase para o CLIENTE (sem "const supabase = ...",
// que causava "Identifier 'supabase' has already been declared").
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_BUCKET = "erp";
