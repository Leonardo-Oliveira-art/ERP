// =========================================================
// config.js — Configuração do Supabase
// Substitua os valores abaixo pelos do SEU projeto Supabase.
// (Project Settings → API)
// =========================================================

const SUPABASE_URL = "https://wdyvnczubupwkjkvlvgg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkeXZuY3p1YnVwd2tqa3ZsdmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDkwMzcsImV4cCI6MjA5OTE4NTAzN30._pO3_gVX-bkqLA9_UkdcPYTbWV3IH_G-8XG93-3vQFA";

// Cliente Supabase global (usa CDN incluída no HTML)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bucket usado para logos e imagens
const STORAGE_BUCKET = "erp";
