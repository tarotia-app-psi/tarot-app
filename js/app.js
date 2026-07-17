// ==========================================
// CONFIGURACIÓN GLOBAL Y VARIABLES DE ESTADO
// ==========================================

// 1. Revisa si el Administrador forzó la vista desde el panel de control
let esUsuarioPremium = localStorage.getItem('simularPremium') === 'true';

// 2. Lista de códigos Premium válidos (Administrables)
const codigosPremiumValidos = ["ADMIN2026", "PASEMISTICO", "TAROTGRATIS"];

// 3. Revisa si el cliente ya tenía un código válido guardado
if (localStorage.getItem('cuponPremiumActivo') === 'true') {
    esUsuarioPremium = true;
}

// Variables del flujo de la lectura
let modoFisicoActivo = false;
let estiloSeleccionado = 'filosofico';
let cartasFisicasElegidas = [];
let ultimaLecturaGuardadaContexto = "";
let ultimasCartasElegidasContexto = { a: "", b: "", c: "", d: "" };

// Endpoint de tu backend en Render
const API_URL = "https://tarot-613b.onrender.com"; 

// Inicialización de la aplicación al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    console.log(`[TarotIA] Inicializado. Modo: ${esUsuarioPremium ? 'PREMIUM ✨' : 'GRATIS 🃏'}`);
    actualizarBadgeMuestrasFisicas();
});

// ==========================================
// MOTOR DE ACCESO Y CUPONES
// ==========================================
function canjearCodigoPremium(codigoIntroducido) {
    const codigoLimpio = codigoIntroducido.trim().toUpperCase(); 
    
    if (codigosPremiumValidos.includes(codigoLimpio)) {
        localStorage.setItem('cuponPremiumActivo', 'true');
        alert("✨ ¡Código Celestial Aceptado! Has desbloqueado TarotIA Premium.");
        window.location.reload(); 
        return true;
    } else {
        alert("❌ El oráculo no reconoce ese código. Intenta de nuevo.");
        return false;
    }
}

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
    
    const btnPregunta = document.getElementById('btn-pregunta-especifica');
    if (btnPregunta) {
        btnPregunta.style.display = 'block'; 
    }

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
    modoFisicoActivo = false; 
    
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`fisico-carta${i}`);
        if (select) select.selectedIndex = 0; 
    }

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
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`fisico-carta${i}`);
        if (select) select.selectedIndex = 0; 
    }
    window.location.reload();
}

// ==========================================
// FLUJO DE MAZO FÍSICO (PREMIUM / MUESTRA)
// ==========================================

// Prepara y llena dinámicamente los selectores de cartas
function inicializarYMostrarPantallaFisica() {
    modoFisicoActivo = true;
    estiloSeleccionado = 'magico'; // Hereda por defecto el tono directo y predictivo

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
            select.innerHTML = ""; // Evita duplicaciones al re-entrar

            let optDefault = document.createElement('option');
            optDefault.value = "";
            optDefault.innerText = "🔍 Selecciona una carta...";
            optDefault.disabled = true;
            optDefault.selected = true;
            select.appendChild(optDefault);
            
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

// Valida la selección del mazo físico y redirige al selector de ejes
function irAlEjeFisico() {
    const c1 = document.getElementById('fisico-carta1').value;
    const c2 = document.getElementById('fisico-carta2').value;
    const c3 = document.getElementById('fisico-carta3').value;
    const c4 = document.getElementById('fisico-carta4').value;

    if (!c1 || !c2 || !c3 || !c4) {
        alert("🧙‍♂️ Por favor, selecciona las 4 cartas de tus duplas físicas antes de continuar.");
        return;
    }

    cartasFisicasElegidas = [c1, c2, c3, c4];
    modoFisicoActivo = true; 

    // Ocultamos Pregunta Específica para evitar colisiones de lógica en el Oráculo físico
    const btnPregunta = document.getElementById('btn-pregunta-especifica');
    if (btnPregunta) {
        btnPregunta.style.display = 'none'; 
    }
    
    ocultarTodasLasPantallas();
    const screenSelector = document.getElementById('screen-selector');
    if (screenSelector) {
        document.getElementById('titulo-eje-estilo').innerText = "Mazo Físico: Selecciona el eje de tu consulta:";
        screenSelector.classList.remove('hidden');
        screenSelector.style.display = 'block';
    }
}

// ==========================================
// DESPACHO LÓGICO DE LECTURAS
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
// NÚCLEO DE LA TIRADA
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
        // Obtenemos las cartas seleccionadas
        const c1 = document.getElementById('fisico-carta1').value;
        const c2 = document.getElementById('fisico-carta2').value;
        const c3 = document.getElementById('fisico-carta3').value;
        const c4 = document.getElementById('fisico-carta4').value;

        // Doble verificación de seguridad anti-nulos
        if (!c1 || !c2 || !c3 || !c4) {
            document.getElementById('interpretation-text').innerHTML = "<p style='color:#ef4444; text-align:center;'>❌ Error: No se seleccionaron las 4 cartas físicas.</p>";
            return;
        }
        cartasFisicasElegidas = [c1, c2, c3, c4];
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
    
    // Carga de imágenes reales
    const urlBaseCartas = "https://tarotia-app-psi.github.io/tarot-app/cartas/";

    document.getElementById('img-a').innerHTML = '<img src="' + urlBaseCartas + a.toLowerCase().replace(/ /g, "_") + '.jpg" alt="' + a + '" class="img-carta-tarot" onerror="this.src=\'reverso_filosofico.jpg\'">';
    document.getElementById('img-b').innerHTML = '<img src="' + urlBaseCartas + b.toLowerCase().replace(/ /g, "_") + '.jpg" alt="' + b + '" class="img-carta-tarot" onerror="this.src=\'reverso_filosofico.jpg\'">';
    document.getElementById('img-c').innerHTML = '<img src="' + urlBaseCartas + c.toLowerCase().replace(/ /g, "_") + '.jpg" alt="' + c + '" class="img-carta-tarot" onerror="this.src=\'reverso_filosofico.jpg\'">';
    document.getElementById('img-d').innerHTML = '<img src="' + urlBaseCartas + d.toLowerCase().replace(/ /g, "_") + '.jpg" alt="' + d + '" class="img-carta-tarot" onerror="this.src=\'reverso_filosofico.jpg\'">';
    ultimasCartasElegidasContexto = { a, b, c, d };

    try {
        const response = await fetch(`${API_URL}/tirada`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tema: tema,
                pregunta: preguntaEspecifica, // Viaja de forma segura como string o null sin romper el backend
                a: a, b: b, c: c, d: d,
                estilo: estiloSeleccionado
            })
        });

        const datos = await response.json();

        if (datos.lectura) {
            document.getElementById('interpretation-text').innerHTML = datos.lectura;
            ultimaLecturaGuardadaContexto = datos.lectura;

            // No mostramos reproductores si el estilo es técnico ('manual')
            if (estiloSeleccionado !== 'manual') {
                document.getElementById('voice-controls').classList.remove('hidden');
            }

            if (esUsuarioPremium) {
                document.getElementById('contenedor-repregunta').classList.remove('hidden');
                document.getElementById('texto-repregunta').value = "";
            }
            
            if (modoFisicoActivo) {
                registrarUsoTiradaFisica();
            }
            
            guardarEnHistorialLocal(tema, { a, b, c, d }, datos.lectura);
        } else {
            throw new Error("Respuesta vacía de Groq");
        }

    } catch (err) {
        console.error("Error capturado:", err);
        document.getElementById('interpretation-text').innerHTML = "<p style='color:#ef4444;'>❌ La tormenta magnética interrumpió la conexión espiritual. Por favor, verifica que tu servidor de Render esté encendido.</p>";
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
            contenedorTexto.innerHTML += `
                <div class="reading-section" style="border-left: 3px solid #ffd700; background: rgba(255,215,0,0.02); padding-top: 15px; margin-top: 20px;">
                    <h3 style="color: #ffd700;">🔮 Respuesta de Tara a tu Duda:</h3>
                    <p>${datos.respuesta}</p>
                </div>
            `;
            document.getElementById('texto-repregunta').value = "";
            btn.innerText = "Enviar Re-pregunta Premium 🔮";
            btn.disabled = false;
            
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
// SINTETIZADOR DE VOZ
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
        // 🔥 BUSQUEDA DINÁMICA: Buscamos el h3 de Predicciones dentro del contenedor
        const contenedor = document.getElementById('interpretation-text');
        const encabezados = contenedor ? contenedor.getElementsByTagName('h3') : [];
        let h3Predicciones = null;

        // Buscamos cuál h3 contiene la palabra "Predicciones"
        for (let h3 of encabezados) {
            if (h3.innerText.includes('Predicciones')) {
                h3Predicciones = h3;
                break;
            }
        }

        if (h3Predicciones && h3Predicciones.nextElementSibling) {
            // Tomamos el texto del párrafo (<p>) que está justo abajo del h3
            textoA_Leer = h3Predicciones.nextElementSibling.innerText;
        } else {
            textoA_Leer = "No se encontraron las predicciones en esta lectura.";
        }
    }

    if (textoA_Leer) {
        const utterance = new SpeechSynthesisUtterance(textoA_Leer);
        utterance.lang = 'es-ES';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================
// CARTA DIARIA E HISTORIAL
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

// ========================================================
// CONTROL DE ACCESOS INTELIGENTES
// ========================================================

function verificarAccesoTarotista() {
    if (esUsuarioPremium) {
        irAlEjeConsulta('manual'); 
    } else {
        const codigo = prompt("✨ El Modo Tarotista es exclusivo de TarotIA Premium.\nPor favor, ingresa tu código de acceso para desbloquearlo:");
        if (codigo) {
            canjearCodigoPremium(codigo);
        }
    }
}

function verificarAccesoFisico() {
    if (esUsuarioPremium) {
        inicializarYMostrarPantallaFisica();
        return;
    }

    let tiradasFisicasUsadas = parseInt(localStorage.getItem('tiradasFisicasUsadas')) || 0;
    const maxTiradasMuestra = 5;

    if (tiradasFisicasUsadas < maxTiradasMuestra) {
        const restantes = maxTiradasMuestra - tiradasFisicasUsadas;
        alert(`🔮 ¡Bienvenido al Mazo Físico! \nTienes acceso de muestra activo. Te quedan ${restantes} de ${maxTiradasMuestra} tiradas gratuitas.`);
        inicializarYMostrarPantallaFisica();
    } else {
        const codigo = prompt("❌ Has agotado tus 5 tiradas de muestra para Mazo Físico.\nPara seguir interpretando tus cartas reales sin límites, ingresa tu código Premium:");
        if (codigo) {
            canjearCodigoPremium(codigo);
        }
    }
}

function registrarUsoTiradaFisica() {
    if (!esUsuarioPremium && modoFisicoActivo) {
        let tiradasFisicasUsadas = parseInt(localStorage.getItem('tiradasFisicasUsadas')) || 0;
        tiradasFisicasUsadas++;
        localStorage.setItem('tiradasFisicasUsadas', tiradasFisicasUsadas);
        actualizarBadgeMuestrasFisicas();
    }
}

function actualizarBadgeMuestrasFisicas() {
    const badge = document.getElementById('badge-fisico-muestra');
    if (badge) {
        if (esUsuarioPremium) {
            badge.innerText = "Premium ✨";
        } else {
            let tiradasFisicasUsadas = parseInt(localStorage.getItem('tiradasFisicasUsadas')) || 0;
            const restantes = Math.max(0, 5 - tiradasFisicasUsadas);
            badge.innerText = restantes > 0 ? `${restantes} Libres` : "Agotado 🔒";
        }
    }
}
