// ==========================================
// 1. LÓGICA DE CARGA Y CÁLCULO (PÚBLICO)
// ==========================================

async function inicializarTorneoRealtime() {
    // Primera carga manual de datos
    await cargarYRenderizarTodo();

    // Escuchar cambios en tiempo real en las tablas de Supabase
    _supabase
        .channel('cambios-tablas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos' }, () => cargarYRenderizarTodo())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partidos' }, () => cargarYRenderizarTodo())
        .subscribe();
}

async function cargarYRenderizarTodo() {
    try {
        // 1. Obtener Equipos y Partidos desde Supabase
        const { data: equipos, error: errEq } = await _supabase.from('equipos').select('*');
        const { data: partidos, error: errPt } = await _supabase.from('partidos').select('*');

        if (errEq || errPt) throw new Error("Error al traer datos de Supabase");

        // 2. Reiniciar estadísticas temporales de los equipos para recalcular en caliente
        const estadisticas = {};
        equipos.forEach(eq => {
            estadisticas[eq.id] = { nombre: eq.nombre, grupo: eq.grupo, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, gd: 0, pts: 0 };
        });

        // Separadores para fases eliminatorias
        let semis y final = { semi1: null, semi2: null, granFinal: null };

        // 3. Procesar partidos para calcular tablas de posiciones
        partidos.forEach(p => {
            if (p.fase.startsWith('Grupo') && p.jugado) {
                const loc = estadisticas[p.local_id];
                const vis = estadisticas[p.visitante_id];

                if (loc && vis) {
                    loc.pj++; vis.pj++;
                    loc.gf += p.goles_local; loc.gc += p.goles_visitante;
                    vis.gf += p.goles_visitante; vis.gc += p.goles_local;

                    if (p.goles_local > p.goles_visitante) {
                        loc.pg++; loc.pts += 3; vis.pp++;
                    } else if (p.goles_local < p.goles_visitante) {
                        vis.pg++; vis.pts += 3; loc.pp++;
                    } else {
                        loc.pe++; vis.pe++; loc.pts += 1; vis.pts += 1;
                    }
                    loc.gd = loc.gf - loc.gc;
                    vis.gd = vis.gf - vis.gc;
                }
            }
        });

        // 4. Separar, ordenar y renderizar Grupos A y B
        const grupoA = Object.values(estadisticas).filter(e => e.grupo === 'A').sort((a, b) => b.pts - a.pts || b.gd - a.gd);
        const grupoB = Object.values(estadisticas).filter(e => e.grupo === 'B').sort((a, b) => b.pts - a.pts || b.gd - a.gd);

        renderizarTablaHTML('publico-tabla-a', grupoA);
        renderizarTablaHTML('publico-tabla-b', grupoB);
        renderizarPartidosPublicos(partidos, estadisticas);
        renderizarPlayoffsPublicos(partidos, estadisticas);

    } catch (error) {
        console.error("Error en el procesamiento del torneo:", error);
    }
}

function renderizarTablaHTML(elementoId, listaEquipos) {
    const tbody = document.getElementById(elementoId);
    tbody.innerHTML = "";
    listaEquipos.forEach((eq, index) => {
        const dest() = index < 2 ? 'bg-purple-900/20 text-purple-300 font-semibold' : '';
        tbody.innerHTML += `
            <tr class="${dest} hover:bg-gray-700/30 transition">
                <td class="p-3 flex items-center gap-2">
                    <span class="text-xs text-gray-500">${index + 1}º</span> ${eq.nombre}
                </td>
                <td class="p-3 text-center">${eq.pj}</td>
                <td class="p-3 text-center ${eq.gd > 0 ? 'text-green-400' : eq.gd < 0 ? 'text-red-400' : ''}">${eq.gd}</td>
                <td class="p-3 text-center font-bold">${eq.pts}</td>
            </tr>
        `;
    });
}

function renderizarPartidosPublicos(partidos, estadisticas) {
    const contenedor = document.getElementById('publico-lista-partidos');
    contenedor.innerHTML = "";
    
    const faseGrupos = partidos.filter(p => p.fase.startsWith('Grupo'));
    if (faseGrupos.length === 0) {
        contenedor.innerHTML = `<p class="text-gray-500 text-sm p-4 col-span-2 text-center">No hay partidos registrados aún.</p>`;
        return;
    }

    faseGrupos.forEach(p => {
        const nameL = estadisticas[p.local_id]?.nombre || 'Por definir';
        const nameV = estadisticas[p.visitante_id]?.nombre || 'Por definir';
        const gl = p.jugado ? p.goles_local : '-';
        const gv = p.jugado ? p.goles_visitante : '-';

        contenedor.innerHTML += `
            <div class="bg-gray-700/30 border border-gray-700 rounded-lg p-4 flex justify-between items-center">
                <div class="text-xs text-gray-400 font-bold uppercase mr-2">${p.fase}</div>
                <div class="flex-1 flex justify-between items-center px-4">
                    <span class="font-medium">${nameL}</span>
                    <span class="bg-gray-900 text-yellow-400 font-mono px-2.5 py-1 rounded mx-3 font-bold">${gl} : ${gv}</span>
                    <span class="font-medium text-right">${nameV}</span>
                </div>
            </div>
        `;
    });
}

function renderizarPlayoffsPublicos(partidos, estadisticas) {
    const contenedor = document.getElementById('publico-playoffs');
    contenedor.innerHTML = "";

    const fasesPlayoffs = ['Semifinal 1', 'Semifinal 2', 'Final'];
    
    fasesPlayoffs.forEach(fase => {
        const p = partidos.find(partido => partido.fase === fase) || { jugado: false, goles_local: '-', goles_visitante: '-' };
        const nameL = estadisticas[p.local_id]?.nombre || (fase === 'Final' ? 'Ganador S1' : p.local_id ? 'Clasificado' : '1º Grupo A');
        const nameV = estadisticas[p.visitante_id]?.nombre || (fase === 'Final' ? 'Ganador S2' : p.visitante_id ? 'Clasificado' : '2º Grupo B');
        
        const gl = p.jugado ? p.goles_local : '-';
        const gv = p.jugado ? p.goles_visitante : '-';
        const esFinal = fase === 'Final' ? 'border-2 border-purple-500 bg-gradient-to-br from-purple-950/20 to-gray-800' : 'bg-gray-700/40 border border-gray-600';

        contenedor.innerHTML += `
            <div class="${esFinal} p-4 rounded-xl shadow-md">
                <span class="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-3">${fase === 'Final' ? '🏆 Gran Final' : fase}</span>
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium">${nameL}</span>
                        <span class="bg-gray-900 px-2.5 py-1 rounded font-mono font-bold text-yellow-400">${gl}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium">${nameV}</span>
                        <span class="bg-gray-900 px-2.5 py-1 rounded font-mono font-bold text-yellow-400">${gv}</span>
                    </div>
                </div>
            </div>
        `;
    });
}


// ==========================================
// 2. LÓGICA DE ACTUALIZACIÓN (ADMINISTRADOR)
// ==========================================

async function cargarPanelAdmin() {
    const { data: equipos } = await _supabase.from('equipos').select('*').order('grupo', { ascending: true });
    const { data: partidos } = await _supabase.from('partidos').select('*').order('id', { ascending: true });

    // Renderizar inputs para editar nombres de equipos
    const divEquipos = document.getElementById('admin-lista-equipos');
    divEquipos.innerHTML = "";
    equipos.forEach(eq => {
        divEquipos.innerHTML += `
            <div class="flex items-center gap-2 bg-gray-900/50 p-2.5 rounded-lg border border-gray-700">
                <span class="text-xs font-bold px-2 py-1 rounded ${eq.grupo === 'A' ? 'bg-blue-600' : 'bg-orange-600'}">G-${eq.grupo}</span>
                <input type="text" value="${eq.nombre}" id="name-eq-${eq.id}" class="bg-gray-800 text-white rounded p-1.5 flex-1 border border-gray-600 text-sm focus:border-purple-500 focus:outline-none">
                <button onclick="guardarNombreEquipo(${eq.id})" class="bg-green-600 hover:bg-green-700 text-xs font-bold px-3 py-2 rounded transition">💾</button>
            </div>
        `;
    });

    // Renderizar panel de control de marcadores
    const divPartidos = document.getElementById('admin-lista-partidos');
    divPartidos.innerHTML = "";
    partidos.forEach(p => {
        const nameL = equipos.find(e => e.id === p.local_id)?.nombre || `Por definir (${p.fase})`;
        const nameV = equipos.find(e => e.id === p.visitante_id)?.nombre || `Por definir (${p.fase})`;
        const gl = p.goles_local !== null ? p.goles_local : '';
        const gv = p.goles_visitante !== null ? p.goles_visitante : '';

        divPartidos.innerHTML += `
            <div class="bg-gray-900/40 p-3 rounded-lg border border-gray-700 flex flex-wrap items-center justify-between gap-4">
                <div class="text-xs font-bold text-gray-400 uppercase">${p.fase}</div>
                <div class="flex items-center gap-3 justify-center w-full md:w-auto">
                    <span class="text-sm font-medium text-right min-w-[100px]">${nameL}</span>
                    <input type="number" value="${gl}" id="score-l-${p.id}" placeholder="0" class="w-12 bg-gray-800 text-center text-yellow-400 font-bold p-1 rounded border border-gray-600 focus:outline-none focus:border-purple-500">
                    <span class="text-gray-500 font-bold">:</span>
                    <input type="number" value="${gv}" id="score-v-${p.id}" placeholder="0" class="w-12 bg-gray-800 text-center text-yellow-400 font-bold p-1 rounded border border-gray-600 focus:outline-none focus:border-purple-500">
                    <span class="text-sm font-medium text-left min-w-[100px]">${nameV}</span>
                </div>
                <button onclick="guardarMarcador(${p.id})" class="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-xs font-bold px-4 py-2 rounded-lg transition shadow">Actualizar ⚽</button>
            </div>
        `;
    });
}

async function guardarNombreEquipo(id) {
    const nuevoNombre = document.getElementById(`name-eq-${id}`).value;
    if (!nuevoNombre.trim()) return alert("El nombre no puede estar vacío");
    
    const { error } = await _supabase.from('equipos').update({ nombre: nuevoNombre }).eq('id', id);
    if (error) alert("Error al guardar: " + error.message);
    else alert("¡Nombre del equipo actualizado!");
}

async function guardarMarcador(id) {
    const gl = document.getElementById(`score-l-${id}`).value;
    const gv = document.getElementById(`score-v-${id}`).value;

    if (gl === "" || gv === "") return alert("Debes ingresar ambos marcadores");

    const { error } = await _supabase.from('partidos').update({
        goles_local: parseInt(gl),
        goles_visitante: parseInt(gv),
        jugado: true
    }).eq('id', id);

    if (error) alert("Error al guardar marcador: " + error.message);
    else {
        alert("¡Resultado guardado con éxito!");
        cargarPanelAdmin(); // Refrescar los nombres mapeados en el panel si cambiaron clasificados
    }
}