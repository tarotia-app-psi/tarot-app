// ==========================================
// CONFIGURACIÓN GLOBAL Y VARIABLES DE ESTADO
// ==========================================
// ========================================================
// CONTROL DE ACCESO (ADMINISTRABLE DESDE ADMIN.HTML)
// ========================================================
// Si existe una simulación en el panel de control, la usa. Si no, por defecto arranca en false.
// ========================================================
// MOTOR DE ACCESO Y CUPONES (SINCRO CON ADMIN)
// ========================================================

// 1. Revisa si el Administrador forzó la vista desde el panel de control
let esUsuarioPremium = localStorage.getItem('simularPremium') === 'true';

// 2. Lista de códigos Premium válidos que vos controlás (Podés cambiarlos acá cuando quieras)
const codigosPremiumValidos = ["ADMIN2026", "PASEMISTICO", "TAROTGRATIS"];

// 3. Revisa si el cliente ya había metido un código válido antes para dejarlo guardado
if (localStorage.getItem('cuponPremiumActivo') === 'true') {
    esUsuarioPremium = true;
}

// 4. FUNCIÓN PÚBLICA: Para que el usuario (o vos) canjee el código en la interfaz
function canjearCodigoPremium(codigoIntroducido) {
    // Pasamos a mayúsculas para evitar errores si escriben en minúscula
    const codigoLimpio = codigoIntroducido.trim().toUpperCase(); 
    
    if (codigosPremiumValidos.includes(codigoLimpio)) {
        localStorage.setItem('cuponPremiumActivo', 'true');
        alert("✨ ¡Código Celestial Aceptado! Has desbloqueado TarotIA Premium.");
        window.location.reload(); // Recargamos para activar los paneles premium
        return true;
    } else {
        alert("❌ El oráculo no reconoce ese código. Intenta de nuevo.");
        return false;
    }
}

console.log(`[TarotIA] Modo de usuario actual: ${esUsuarioPremium ? 'PREMIUM ✨' : 'GRATIS 🃏'}`);

console.log(`[TarotIA Init] Entorno inicializado. Modo de usuario actual: ${esUsuarioPremium ? 'PREMIUM ✨' : 'GRATIS 🃏'}`);
let modoFisicoActivo = false;
let estiloSeleccionado = 'filosofico';
let cartasFisicasElegidas = [];
let ultimaLecturaGuardadaContexto = "";
let ultimasCartasElegidasContexto = { a: "", b: "", c: "", d: "" };

// Endpoint de tu backend en Render (Cambiar por tu URL de Render cuando subas a producción)
const API_URL = "https://tarot-613b.onrender.com"; 

// ==========================================
// NAVEGACIÓN ENTRE PANTALLAS
// ==========================================
function ocultarTodasLasPantallas() {
    const screens = ['screen-portada', 'screen-fisico', 'screen-selector', 'screen-pregunta', 'screen-result', 'screen-historial'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            el.style.display = 'none';
        }
    });
}

function irAlEjeConsulta(estilo) {
    window.speechSynthesis.cancel();
    estiloSeleccionado = estilo;
    modoFisicoActivo = false;
    
    ocultarTodasLasPantallas();
    const screenSelector = document.getElementById('screen-selector');
    if (screenSelector) {
        document.getElementById('titulo-eje-estilo').innerText = "Selecciona el eje de tu consulta:";
        screenSelector.classList.remove('hidden');
        screenSelector.style.display = 'block';
    }
}

function abrirPantallaPregunta() {
    ocultarTodasLasPantallas();
    const screenPregunta = document.getElementById('screen-pregunta');
    if (screenPregunta) {
        screenPregunta.classList.remove('hidden');
        screenPregunta.style.display = 'block';
        document.getElementById('texto-pregunta-usuario').value = "";
    }
}

function volverAPortada() {
    window.speechSynthesis.cancel();
    ocultarTodasLasPantallas();
    const portada = document.getElementById('screen-portada');
    if (portada) {
        portada.classList.remove('hidden');
        portada.style.display = 'block';
    }
}

function volverInicio() {
    window.speechSynthesis.cancel();
    modoFisicoActivo = false;
    // Reseteamos selects físicos por seguridad si existen
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`fisico-carta${i}`);
        if (select) select.selectedIndex = 0; 
    }
    window.location.reload();
}

// ==========================================
// FLUJO DE MAZO FÍSICO (PREMIUM)
// ==========================================
function abrirMensajePremium() {
    modoFisicoActivo = true;
    estiloSeleccionado = 'magico'; // Por defecto hereda el tono místico/directo

    ocultarTodasLasPantallas();
    const screenFisico = document.getElementById('screen-fisico');
    if (screenFisico) {
        screenFisico.classList.remove('hidden');
        screenFisico.style.display = 'block';
    }
    
    const idsSelects = ['fisico-carta1', 'fisico-carta2', 'fisico-carta3', 'fisico-carta4'];
    
    idsSelects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = ""; // Limpieza absoluta anti-duplicados

            let optDefault = document.createElement('option');
            optDefault.value = "";
            optDefault.innerText = "🔍 Selecciona una carta...";
            optDefault.disabled = true;
            optDefault.selected = true;
            select.appendChild(optDefault);
            
            // Verificamos si existe el array maestro de arcanos en arcanos.js
            if (typeof arcanosCompleto !== 'undefined') {
                const grupos = [
                    { nombre: "✨ Arcanos Mayores", inicio: 0, fin: 21 },
                    { nombre: "🌿 Palo de Bastos", inicio: 22, fin: 35 },
                    { nombre: "🏆 Palo de Copas", inicio: 36, fin: 49 },
                    { nombre: "⚔️ Palo de Espadas", inicio: 50, fin: 63 },
                    { nombre: "🪙 Palo de Oros", inicio: 64, fin: 77 }
                ];

                grupos.forEach(g => {
                    let grupoElemento = document.createElement('optgroup');
                    grupoElemento.label = g.nombre;
                    
                    for (let i = g.inicio; i <= g.fin; i++) {
                        let opt = document.createElement('option');
                        opt.value = arcanosCompleto[i]; 
                        opt.innerText = arcanosCompleto[i];
                        grupoElemento.appendChild(opt);
                    }
                    select.appendChild(grupoElemento);
                });
            }
        }
    });
}

function irAlEjeFisico() {
    const c1 = document.getElementById('fisico-carta1').value;
    const c2 = document.getElementById('fisico-carta2').value;
    const c3 = document.getElementById('fisico-carta3').value;
    const c4 = document.getElementById('fisico-carta4').value;

    if (!c1 || !c2 || !c3 || !c4) {
        alert("🧙‍♂️ Por favor, selecciona las 4 cartas de tus duplas antes de continuar.");
        return;
    }

    cartasFisicasElegidas = [c1, c2, c3, c4];
    modoFisicoActivo = true; 
    
    ocultarTodasLasPantallas();
    const screenSelector = document.getElementById('screen-selector');
    if (screenSelector) {
        document.getElementById('titulo-eje-estilo').innerText = "Mazo Físico: Selecciona el eje de tu consulta:";
        screenSelector.classList.remove('hidden');
        screenSelector.style.display = 'block';
    }
}

function nuevaConsultaFisico() {
    volverInicio();
}

// ==========================================
// DESPACHO LOGICO DE LECTURAS
// ==========================================
function ejecutarLecturaSegunModo(tema) {
    if (tema === 'Pregunta Específica') {
        abrirPantallaPregunta();
    } else {
        procesarTiradaCompleta(tema, null);
    }
}

function confirmarPreguntaYEjecutar() {
    const preguntaTexto = document.getElementById('texto-pregunta-usuario').value.trim();
    if (!preguntaTexto) {
        alert("🧙‍♂️ Por favor, escribe tu duda o consulta mística antes de continuar.");
        return;
    }
    procesarTiradaCompleta('Pregunta Específica', preguntaTexto);
}

// ==========================================
// NÚCLEO DE LA TIRADA (LLAMADA AL SERVIDOR)
// ==========================================
// ==========================================
// NÚCLEO DE LA TIRADA (SINCRO PERFECTA CON SERVER.JS)
// ==========================================
async function procesarTiradaCompleta(tema, preguntaEspecifica = null) {
    ocultarTodasLasPantallas();
    const screenResult = document.getElementById('screen-result');
    screenResult.classList.remove('hidden');
    screenResult.style.display = 'block';

    document.getElementById('reading-theme-title').innerText = `Consultando Oráculo: Eje ${tema}`;
    document.getElementById('interpretation-text').innerHTML = "<p class='loading-cosmico'>✨ Conectando con los planos superiores de Tara... Interpretando arquetipos...</p>";
    
    document.getElementById('voice-controls').classList.add('hidden');
    document.getElementById('contenedor-repregunta').classList.add('hidden');

    let a, b, c, d;

    if (modoFisicoActivo) {
        [a, b, c, d] = cartasFisicasElegidas;
    } else {
        if (typeof arcanosCompleto === 'undefined') {
            document.getElementById('interpretation-text').innerHTML = "Error: Mazo de arcanos no cargado en arcanos.js";
            return;
        }
        let baraja = [...arcanosCompleto];
        let elegidas = [];
        for (let i = 0; i < 4; i++) {
            let idx = Math.floor(Math.random() * baraja.length);
            elegidas.push(baraja.splice(idx, 1)[0]);
        }
        [a, b, c, d] = elegidas;
    }

    document.getElementById('name-a').innerText = a;
    document.getElementById('name-b').innerText = b;
    document.getElementById('name-c').innerText = c;
    document.getElementById('name-d').innerText = d;
    
    document.getElementById('img-a').innerHTML = "🃏";
    document.getElementById('img-b').innerHTML = "🃏";
    document.getElementById('img-c').innerHTML = "🃏";
    document.getElementById('img-d').innerHTML = "🃏";

    ultimasCartasElegidasContexto = { a, b, c, d };

    try {
        // Cambiado a "response" para que coincida con la lectura de abajo de forma limpia
        const response = await fetch(`${API_URL}/tirada`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tema: tema,
                pregunta: preguntaEspecifica,
                a: a, b: b, c: c, d: d,
                estilo: estiloSeleccionado
            })
        });

        const datos = await response.json();

        if (datos.lectura) {
            document.getElementById('interpretation-text').innerHTML = datos.lectura;
            ultimaLecturaGuardadaContexto = datos.lectura;

            document.getElementById('voice-controls').classList.remove('hidden');

            if (esUsuarioPremium) {
                document.getElementById('contenedor-repregunta').classList.remove('hidden');
                document.getElementById('texto-repregunta').value = "";
            }
            
            guardarEnHistorialLocal(tema, { a, b, c, d }, datos.lectura);
        } else {
            throw new Error("Respuesta vacía de Groq");
        }

    } catch (err) {
        console.error("Error capturado:", err);
        document.getElementById('interpretation-text').innerHTML = "<p style='color:#ef4444;'>❌ La tormenta magnética interrumpió la conexión espiritual. Por favor, verifica que tu servidor de Render/Localhost esté corriendo.</p>";
    }
}

// ==========================================
// ENVÍO DE RE-PREGUNTA PREMIUM
// ==========================================
async function enviarRepreguntaServidor() {
    const textoDuda = document.getElementById('texto-repregunta').value.trim();
    if (!textoDuda) {
        alert("🧙‍♂️ Escribe tu duda antes de enviársela al oráculo.");
        return;
    }

    const btn = document.getElementById('btn-enviar-repregunta');
    btn.disabled = true;
    btn.innerText = "Consultando al plano sutil... 🔮";

    // Creamos un contenedor temporal abajo para simular chat o inyectar la respuesta directa de corrido
    const contenedorTexto = document.getElementById('interpretation-text');

    try {
        const response = await fetch(`${API_URL}/repregunta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cartas: ultimasCartasElegidasContexto,
                lecturaAnterior: ultimaLecturaGuardadaContexto,
                repregunta: textoDuda,
                estilo: estiloSeleccionado
            })
        });

        const datos = await response.json();

        if (datos.respuesta) {
            // Inyectamos la aclaración abajo de la lectura original de forma elegante
            contenedorTexto.innerHTML += `
                <div class="reading-section" style="border-left: 3px solid #ffd700; background: rgba(255,215,0,0.02); padding-top: 15px; margin-top: 20px;">
                    <h3 style="color: #ffd700;">🔮 Respuesta de Tara a tu Duda:</h3>
                    <p>${datos.respuesta}</p>
                </div>
            `;
            // Reseteamos caja de texto y botón
            document.getElementById('texto-repregunta').value = "";
            btn.innerText = "Enviar Re-pregunta Premium 🔮";
            btn.disabled = false;
            
            // Hacemos scroll suave hasta la nueva respuesta
            contenedorTexto.lastElementChild.scrollIntoView({ behavior: 'smooth' });
        } else {
            throw new Error();
        }
    } catch (error) {
        alert("Hubo un corte en los planos sutiles. Intenta de nuevo.");
        btn.innerText = "Enviar Re-pregunta Premium 🔮";
        btn.disabled = false;
    }
}

// ==========================================
// MANEJO DE AUDIO (SINTETIZADOR DE VOZ)
// ==========================================
function reproducirVoz(tipo) {
    window.speechSynthesis.cancel();
    let textoA_Leer = "";

    if (tipo === 'todo') {
        textoA_Leer = document.getElementById('interpretation-text').innerText;
    } else if (tipo === 'conclusion') {
        const conclusionSpan = document.getElementById('conclusion');
        textoA_Leer = conclusionSpan ? conclusionSpan.innerText : "No se encontró el consejo final.";
    } else if (tipo === 'predicciones') {
        // Busca texto genérico o secciones
        textoA_Leer = document.getElementById('interpretation-text').innerText; 
    }

    if (textoA_Leer) {
        const utterance = new SpeechSynthesisUtterance(textoA_Leer);
        utterance.lang = 'es-ES';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================
// CARTA DIARIA SIMPLE Y HISTORIAL LOCAL
// ==========================================
function tirarCartaDiaria() {
    alert("✨ Tu carta del día es El Mundo: Hoy el universo conspira a tu favor. Avanza con seguridad.");
}

function guardarEnHistorialLocal(tema, cartas, lectura) {
    let historial = JSON.parse(localStorage.getItem('tarot_historial')) || [];
    historial.unshift({ fecha: new Date().toLocaleDateString(), tema, cartas, lectura });
    localStorage.setItem('tarot_historial', JSON.stringify(historial.slice(0, 10)));
}

function abrirHistorial() {
    ocultarTodasLasPantallas();
    const screenHistorial = document.getElementById('screen-historial');
    screenHistorial.classList.remove('hidden');
    screenHistorial.style.display = 'block';

    const contenedor = document.getElementById('lista-historial-contenedor');
    let historial = JSON.parse(localStorage.getItem('tarot_historial')) || [];
    
    if (historial.length === 0) {
        contenedor.innerHTML = "<p style='color:var(--muted-text);'>Aún no tienes lecturas guardadas en este navegador.</p>";
        return;
    }

    contenedor.innerHTML = historial.map((h, i) => `
        <div style="background: rgba(255,255,255,0.02); padding: 15px; border-radius:10px; border: 1px solid var(--glass-border);">
            <small style="color:var(--accent); font-weight:bold;">${h.fecha} - Eje: ${h.tema}</small>
            <p style="margin: 5px 0 0 0; font-size:0.9rem; color:#ccc;">Cartas: ${h.cartas.a}, ${h.cartas.b}, ${h.cartas.c}, ${h.cartas.d}</p>
        </div>
    `).join('');
}