// =========================================================
// config.js — Configuração do Supabase
// Substitua os valores abaixo pelos do SEU projeto Supabase.
// (Project Settings → API)
// =========================================================

const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA_ANON_KEY_AQUI";

// Cliente Supabase global (usa CDN incluída no HTML)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bucket usado para logos e imagens
const STORAGE_BUCKET = "erp";
