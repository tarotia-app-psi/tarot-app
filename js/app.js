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
    const screens = ['screen-portada', 'screen-fisico', 'screen-selector', 'screen-pregunta', 'screen-result', 'screen-historial', 'screen-modulo-profesional'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            el.style.display = 'none';
        }
    });
}

function irAlEjeConsulta(estilo) {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    estiloSeleccionado = estilo;
    modoFisicoActivo = false; 
    cartasFisicasElegidas = []; // Limpiamos selección previa digital
    
    const btnPregunta = document.getElementById('btn-pregunta-especifica');
    if (btnPregunta) {
        btnPregunta.style.display = 'block'; 
    }

    ocultarTodasLasPantallas();
    const screenSelector = document.getElementById('screen-selector');
    if (screenSelector) {
        const tituloEje = document.getElementById('titulo-eje-estilo');
        if (tituloEje) tituloEje.innerText = "Selecciona el eje de tu consulta:";
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
        const inputPregunta = document.getElementById('texto-pregunta-usuario');
        if (inputPregunta) inputPregunta.value = "";
    }
}

function volverAPortada() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
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

function abrirModuloProfesional() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    ocultarTodasLasPantallas();
    const modProf = document.getElementById('screen-modulo-profesional');
    if (modProf) {
        modProf.classList.remove('hidden');
        modProf.style.display = 'block';
    }
}

function volverInicio() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    modoFisicoActivo = false;
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`fisico-carta${i}`);
        if (select) select.selectedIndex = 0; 
    }
    window.location.reload();
}

// =========================================================
// ACCESOS DESDE EL MÓDULO PROFESIONAL
// =========================================================

function verificarAccesoTarotista() {
    irAlEjeConsulta('manual');
}

function verificarAccesoTarotistaFisico() {
    estiloSeleccionado = 'manual'; 
    modoFisicoActivo = true; 
    cartasFisicasElegidas = [];
    inicializarYMostrarPantallaFisica();
}

function verificarAccesoFisico() {
    if (!esUsuarioPremium && obtenerMuestrasFisicasRestantes() <= 0) {
        alert("🧙‍♂️ Has agotado tus 5 muestras gratuitas de mazo físico. Adquiere el Pase Premium para continuar.");
        return;
    }
    estiloSeleccionado = 'magico';
    modoFisicoActivo = true;
    cartasFisicasElegidas = [];
    inicializarYMostrarPantallaFisica();
}

// ==========================================
// FLUJO DE MAZO FÍSICO
// ==========================================
function inicializarYMostrarPantallaFisica() {
    ocultarTodasLasPantallas();
    const screenFisico = document.getElementById('screen-fisico');
    if (screenFisico) {
        screenFisico.classList.remove('hidden');
        screenFisico.style.display = 'block';
    }
    
    if (typeof arcanosCompleto === 'undefined') {
        alert("❌ Error: No se encontró la lista de cartas 'arcanosCompleto'.");
        return;
    }
    
    const idsSelects = ['fisico-carta1', 'fisico-carta2', 'fisico-carta3', 'fisico-carta4'];
    idsSelects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = ""; 

            let optDefault = document.createElement('option');
            optDefault.value = "";
            optDefault.innerText = "🔍 Selecciona una carta...";
            optDefault.disabled = true;
            optDefault.selected = true;
            select.appendChild(optDefault);
            
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
                    if (arcanosCompleto[i]) {
                        let opt = document.createElement('option');
                        opt.value = arcanosCompleto[i]; 
                        opt.innerText = arcanosCompleto[i];
                        grupoElemento.appendChild(opt);
                    }
                }
                select.appendChild(grupoElemento);
            });
        }
    });
}

function irAlEjeFisico() {
    const c1 = document.getElementById('fisico-carta1')?.value;
    const c2 = document.getElementById('fisico-carta2')?.value;
    const c3 = document.getElementById('fisico-carta3')?.value;
    const c4 = document.getElementById('fisico-carta4')?.value;

    if (!c1 || !c2 || !c3 || !c4) {
        alert("🧙‍♂️ Por favor, selecciona las 4 cartas de tus duplas físicas antes de continuar.");
        return;
    }

    cartasFisicasElegidas = [c1, c2, c3, c4];

    const btnPregunta = document.getElementById('btn-pregunta-especifica');
    if (btnPregunta) {
        btnPregunta.style.display = 'none'; 
    }
    
    ocultarTodasLasPantallas();
    const screenSelector = document.getElementById('screen-selector');
    if (screenSelector) {
        const tituloEje = document.getElementById('titulo-eje-estilo');
        if (tituloEje) {
            if (estiloSeleccionado === 'manual') {
                tituloEje.innerText = "Manual Tarotista: Selecciona el eje de estudio:";
            } else {
                tituloEje.innerText = "Mazo Físico: Selecciona el eje de tu consulta:";
            }
        }
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
        return;
    }
    procesarTiradaCompleta(tema, null);
}

function confirmarPreguntaYEjecutar() {
    const preguntaTexto = document.getElementById('texto-pregunta-usuario')?.value.trim();
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
    if (!screenResult) return;
    
    screenResult.classList.remove('hidden');
    screenResult.style.display = 'block';

    document.getElementById('reading-theme-title').innerText = `Consultando Oráculo: Eje ${tema}`;
    document.getElementById('interpretation-text').innerHTML = "<p class='loading-cosmico'>✨ Conectando con los planos superiores del Tarot... Interpretando arquetipos...</p>";
    
    document.getElementById('voice-controls').classList.add('hidden');
    document.getElementById('contenedor-repregunta').classList.add('hidden');

    let a, b, c, d;

    if (modoFisicoActivo) {
        const c1 = document.getElementById('fisico-carta1')?.value;
        const c2 = document.getElementById('fisico-carta2')?.value;
        const c3 = document.getElementById('fisico-carta3')?.value;
        const c4 = document.getElementById('fisico-carta4')?.value;

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
                pregunta: preguntaEspecifica, 
                a: a, b: b, c: c, d: d,
                estilo: estiloSeleccionado
            })
        });

        const datos = await response.json();

        if (datos.lectura) {
            document.getElementById('interpretation-text').innerHTML = datos.lectura;
            ultimaLecturaGuardadaContexto = datos.lectura;

            if (estiloSeleccionado !== 'manual') {
                document.getElementById('voice-controls').classList.remove('hidden');
            }

            if (esUsuarioPremium) {
                document.getElementById('contenedor-repregunta').classList.remove('hidden');
                const textRepregunta = document.getElementById('texto-repregunta');
                if (textRepregunta) textRepregunta.value = "";
            }
            
            if (modoFisicoActivo) {
                registrarUsoTiradaFisica();
            }
            
            guardarEnHistorialLocal(tema, { a, b, c, d }, datos.lectura);
        } else {
            throw new Error("Respuesta vacía del servidor");
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
    const textoDuda = document.getElementById('texto-repregunta')?.value.trim();
    if (!textoDuda) {
        alert("🧙‍♂️ Escribe tu duda antes de enviársela al oráculo.");
        return;
    }

    const btn = document.getElementById('btn-enviar-repregunta');
    if (!btn) return;
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

        if (datos.respuesta && contenedorTexto) {
            const nuevaSeccion = document.createElement('div');
            nuevaSeccion.className = 'reading-section';
            nuevaSeccion.style.borderLeft = '3px solid #ffd700';
            nuevaSeccion.style.background = 'rgba(255,215,0,0.02)';
            nuevaSeccion.style.paddingTop = '15px';
            nuevaSeccion.style.marginTop = '20px';
            
            nuevaSeccion.innerHTML = `
                <h3 style="color: #ffd700;">🔮 Respuesta de Tara a tu Duda:</h3>
                <p>${datos.respuesta}</p>
            `;
            
            contenedorTexto.appendChild(nuevaSeccion);
            
            const textRepregunta = document.getElementById('texto-repregunta');
            if (textRepregunta) textRepregunta.value = "";
            
            btn.innerText = "Enviar Re-pregunta Premium 🔮";
            btn.disabled = false;
            
            nuevaSeccion.scrollIntoView({ behavior: 'smooth' });
        } else {
            throw new Error();
        }
    } catch (error) {
        alert("Hubo un corte en los planos sutiles. Intenta de nuevo.");
        btn.innerText = "Enviar Re-pregunta Premium 🔮";
        btn.disabled = false;
    }
}

// =========================================================
// GESTIÓN DE MUESTRAS FÍSICAS Y HISTORIAL LOCAL
// =========================================================
function obtenerMuestrasFisicasRestantes() {
    let muestras = localStorage.getItem('muestrasFisicasTarot');
    if (muestras === null) {
        localStorage.setItem('muestrasFisicasTarot', '5');
        return 5;
    }
    return parseInt(muestras, 10);
}

function registrarUsoTiradaFisica() {
    if (esUsuarioPremium) return;
    let actuales = obtenerMuestrasFisicasRestantes();
    if (actuales > 0) {
        actuales--;
        localStorage.setItem('muestrasFisicasTarot', actuales.toString());
        actualizarBadgeMuestrasFisicas();
    }
}

// Función encargada de refrescar la UI del contador de tiradas físicas
function actualizarBadgeMuestrasFisicas() {
    const badge = document.getElementById('badge-physic-muestra-prof') || document.getElementById('badge-fisico-muestra-prof');
    if (badge) {
        if (esUsuarioPremium) {
            badge.innerText = "Ilimitado ✨";
            badge.style.borderColor = "#a78bfa";
        } else {
            const restantes = obtenerMuestrasFisicasRestantes();
            badge.innerText = `${restantes} Muestras`;
        }
    }
}

function guardarEnHistorialLocal(tema, cartas, lecturaHtml) {
    try {
        let historial = JSON.parse(localStorage.getItem('tarotHistorialLocal')) || [];
        const nuevaLectura = {
            id: Date.now(),
            fecha: new Date().toLocaleDateString('es-AR'),
            tema: tema,
            cartas: cartas,
            lectura: lecturaHtml
        };
        historial.unshift(nuevaLectura);
        if (historial.length > 10) historial.pop(); // Guarda solo las últimas 10 lecturas
        localStorage.setItem('tarotHistorialLocal', JSON.stringify(historial));
    } catch (e) {
        console.error("Error guardando historial:", e);
    }
}

function abrirHistorial() {
    ocultarTodasLasPantallas();
    const screenHistorial = document.getElementById('screen-historial');
    const contenedor = document.getElementById('lista-historial-contenedor');
    
    if (screenHistorial && contenedor) {
        contenedor.innerHTML = "";
        let historial = JSON.parse(localStorage.getItem('tarotHistorialLocal')) || [];
        
        if (historial.length === 0) {
            contenedor.innerHTML = "<p style='color:var(--muted-text); text-align:center;'>No posees lecturas guardadas en este dispositivo.</p>";
        } else {
            historial.forEach(item => {
                const bloque = document.createElement('div');
                bloque.className = 'history-item';
                bloque.style.cssText = "background:rgba(255,255,255,0.02); padding:15px; border-radius:10px; border:1px solid rgba(255,255,255,0.05); margin-bottom:10px;";
                bloque.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem; color:#a855f7;">
                        <span>📅 ${item.fecha}</span>
                        <span>🔮 Eje: ${item.tema}</span>
                    </div>
                    <p style="font-size:0.9rem; margin: 0 0 10px 0; color:#ffd700;">🃏 ${item.cartas.a} • ${item.cartas.b} • ${item.cartas.c} • ${item.cartas.d}</p>
                    <button onclick="cargarLecturaHistorial('${encodeURIComponent(item.lectura)}', '${item.tema}')" style="background:rgba(168,85,247,0.1); border:1px solid #a855f7; color:#fff; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;">Revisar Interpretación</button>
                `;
                contenedor.appendChild(bloque);
            });
        }
        screenHistorial.classList.remove('hidden');
        screenHistorial.style.display = 'block';
    }
}

function cargarLecturaHistorial(lecturaCodificada, tema) {
    ocultarTodasLasPantallas();
    const screenResult = document.getElementById('screen-result');
    if (screenResult) {
        document.getElementById('reading-theme-title').innerText = `Historial: Eje ${tema}`;
        document.getElementById('interpretation-text').innerHTML = decodeURIComponent(lecturaCodificada);
        
        // Ocultar elementos visuales efímeros de la mesa de tirada viva
        document.getElementById('name-a').innerText = "Guardada";
        document.getElementById('name-b').innerText = "Guardada";
        document.getElementById('name-c').innerText = "Guardada";
        document.getElementById('name-d').innerText = "Guardada";
        
        document.getElementById('voice-controls').classList.add('hidden');
        document.getElementById('contenedor-repregunta').classList.add('hidden');
        
        screenResult.classList.remove('hidden');
        screenResult.style.display = 'block';
    }
}

// ==========================================
// SINTETIZADOR DE VOZ
// ==========================================
function reproducirVoz(tipo) {
    if (!window.speechSynthesis) {
        alert("Tu navegador no soporta síntesis de voz.");
        return;
    }
    window.speechSynthesis.cancel();
    
    let contenedor = document.getElementById('interpretation-text');
    if (!contenedor) return;

    let textoA_Leer = "";

    if (tipo === 'todo') {
        textoA_Leer = contenedor.innerText;
    } else if (tipo === 'conclusion') {
        let secciones = contenedor.querySelectorAll('h3, p, div, li');
        let banderaEncontrado = false;
        
        secciones.forEach(el => {
            const textoLimpio = el.innerText.toLowerCase();
            if (textoLimpio.includes('conclusión') || textoLimpio.includes('síntesis') || textoLimpio.includes('resumen') || textoLimpio.includes('consejo final')) {
                banderaEncontrado = true;
            }
            if (banderaEncontrado) {
                textoA_Leer += " " + el.innerText;
            }
        });

        // Fallback Conclusión: si falla el parseo, extrae los dos últimos párrafos
        if (!textoA_Leer.trim()) {
            let ps = contenedor.querySelectorAll('p, li');
            if (ps.length > 0) {
                let inicio = Math.max(0, ps.length - 2);
                for (let i = inicio; i < ps.length; i++) {
                    textoA_Leer += " " + ps[i].innerText;
                }
            }
        }
    } else if (tipo === 'predicciones') {
        // Busca bloques asociados a proyecciones futuras de forma flexible
        let secciones = contenedor.querySelectorAll('h3, p, div, li');
        let capturar = false;

        secciones.forEach(el => {
            const textoLimpio = el.innerText.toLowerCase();
            
            // Si detecta palabras clave del bloque futuro, empieza a capturar
            if (textoLimpio.includes('futuro') || textoLimpio.includes('evolución') || textoLimpio.includes('proyección') || textoLimpio.includes('resultado')) {
                capturar = true;
            } 
            // Frena la captura si entra a la conclusión final para no mezclar bloques
            else if (capturar && (textoLimpio.includes('conclusión') || textoLimpio.includes('consejo final'))) {
                capturar = false;
            }

            if (capturar) {
                textoA_Leer += " " + el.innerText;
            }
        });

        // Fallback Predicciones Seguro: Si no detectó los encabezados del backend, 
        // toma la segunda mitad de los párrafos del texto (donde lógicamente se ubica el futuro)
        if (!textoA_Leer.trim()) {
            let ps = contenedor.querySelectorAll('p');
            if (ps.length >= 2) {
                let mitad = Math.floor(ps.length / 2);
                for (let i = mitad; i < ps.length; i++) {
                    if (!ps[i].innerText.toLowerCase().includes('conclusión')) {
                        textoA_Leer += " " + ps[i].innerText;
                    }
                }
            }
        }
    }

    // Fallback crítico final si todo lo anterior falló por completo
    if (!textoA_Leer.trim()) {
        textoA_Leer = contenedor.innerText; 
    }

    // Limpieza profunda de emojis y caracteres especiales para que el motor de voz no haga pausas raras
    textoA_Leer = textoA_Leer.replace(/[❌✨🔮🌗🌿🏆⚔️🪙🧙‍♂️💼🚀📚🔍🌓]/g, '');
    textoA_Leer = textoA_Leer.replace(/\s+/g, ' ').trim(); // Normaliza espacios en blanco

    let utterance = new SpeechSynthesisUtterance(textoA_Leer);
    utterance.lang = 'es-AR'; // Localización nativa
    utterance.rate = 1.05;    // Fluidez mejorada
    utterance.pitch = 1.05;   // Tono equilibrado

    window.speechSynthesis.speak(utterance);
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
