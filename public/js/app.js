"use strict";
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Constants
// Constantes para evitar números mágicos y para que sean más fáciles de
//entender los códigos de estado de las asignaturas
const PENDIENTE = 0;
const EMPEZADA = 1;
const APROBADA = 2;
const SUSPENDIDA = 3;

////////////////////////////////////////////////////////////////////////////////
// Variables
// Variables globales que serán necesarias en la app
let socket, timeOutId;




////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// UTILS
/**
 * Muestra los elementos del DOM que se pasen como parámetros.
 * Para ello, elimina la clase 'd-none' en cada elemento.
 */
function showMe(...elems) { elems.forEach(e => e.classList.remove('d-none')); }
/**
 * Oculta los elementos del DOM que se pasen como parámetros.
 * Para ello, añade la clase 'd-none' en cada elemento.
 */
function hideMe(...elems) { elems.forEach(e => e.classList.add('d-none')); }
function messageFlash(msg, kind = "success") {
    flashMsg.innerHTML = msg;
    flash.classList.remove('d-none');
    flash.classList.add(`alert-${kind}`);

    // Limpiar el timeout anterior, si lo había
    clearTimeout(timeOutId);

    // Crear un timeOut para ocultar el mensaje después de 3 segundos
    timeOutId = setTimeout(() => {
        flash.classList.add('d-none');
        flash.classList.remove(`alert-${kind}`);
    }, 3000);
}
function broadcast(msg) {
    socket.emit('dimelotodo', {
        status: "ok", text: `<strong>${socket.id}</strong>:<br>${msg}`
    });
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
/**
 * Muestra el modal de confirmación para borrar un semestre.
 */
async function deleteSem(id) {

    const sem = await getSemesterByIdDB(id);

    if (sem) {
        const thingName = document.getElementById("toDeleteName");
        thingName.innerHTML = `el semestre ${sem.name}`;
        thingName.dataset.what = "semester";  // Borrar un semestre
        thingName.dataset.id = id;
        confirmDelete.show();
    }

    broadcast("está a punto de borrar un semestre 😱!");
}

/**
 * Muestra el modal de confirmación para borrar una asignatura.
 * Borra una asignatura.
 */
async function deleteSubject(id) {

    const subj = await getSubjectByIdDB(id);

    if (subj) {
        const thingName = document.getElementById("toDeleteName");
        thingName.innerHTML = `la asignatura ${subj.name}`;
        thingName.dataset.what = "subject";  // Borrar una asignatura
        thingName.dataset.id = id;
        confirmDelete.show();
    }

    broadcast("está a punto de borrar una asignatura 😱!");
}

/**
 * Borra el elemento seleccionado. Esta función viene del modal de confirmación.
 */
async function deleteConfirmed() {
    const thingName = document.getElementById("toDeleteName");
    const what = thingName.dataset.what;  // La 'cosa' a borrar ("semester" o "subject")
    const id = thingName.dataset.id;
    confirmDelete.hide();

    if (what === "semester") {
        await deleteSemesterDB(id);
        refreshSemesters();

        broadcast(`ha borrado un semestre 😱!<br>(id: ${id})`);

    } else if (what === "subject") {
        await deleteSubjectDB(id);
        const semId = semesterPage.dataset.id;
        const sem = await getSemesterByIdDB(semId);
        refreshSubjects(sem);

        broadcast(`ha borrado una asignatura 😱!<br>(id: ${id})`);
    }
}




////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// TEMPLATES
// Estas funciones crean el HTML de los elementos que se muestran en la página.
// Reciben un objeto con las propiedades del elemento, insertan esas propiedades
// en el HTML y devuelven el HTML creado.
// En realidad, esta funciones solo devuelven una string de texto. Luego, las
// funciones que las llaman y reciban esa string, la insertarán en la propiedad
// innerHTML de algún elemento del DOM. Será entonces cuando las strings se
// convertirán en elementos HTML con todo su funcionamiento y estilo.

/**
 * Crea el HTML de la card de un semestre.
 */
function createSemCard(sem) {
    let descrip = sem.descrip;
    // Trim description to 30 chars if needed
    if (descrip.length > 30) { descrip = descrip.slice(0, 27) + '...'; }

    return `<div id="semester${sem.id}" class="card mb-3 semester-card" data-id="${sem.id}">
    <button class="btn-close btn-close2" onclick="deleteSem('${sem.id}')"></button>
    <h5 class="card-header textshadow" style="background-color:${sem.color}">
    ${sem.name}
    </h5>
    <div class="container">
    <div class="d-flex justify-content-center">
    <div class="card mb-3 semester-card">
        <p class="card-text">${descrip}</p>
    </div>
    </div>
    </div>
    <div class="card-footer d-flex justify-content-around" style="background-color:${sem.color}">
    <button class="custom-btn" onclick="openSemForm('${sem.id}')">Editar</button>
    <button class="custom-btn-5" onclick="openSem('${sem.id}')">Abrir</button>
    </div>
</div>`;
}

/**
 * Crea el HTML de la card de una asignatura.
 */
function createSubjectCard(subj) {
    let descrip = subj.descrip;
    // Trim description to 30 chars if needed
    if (descrip.length > 30) { descrip = descrip.slice(0, 27) + '...'; }

    return `<div class="card parrafo" draggable="true" id="subject${subj.id}" data-id="${subj.id}">
    <div class="card-body">
        <button class="btn-close" onclick="deleteSubject('${subj.id}')"></button>
        <h5 class="card-title">${subj.name}</button></h5>
        <p class="card-text">${descrip}</p>
        <button class="custom-btn-card-dg" onclick="openSubjectForm(null,'${subj.id}')">EDITAR</button>
    </div>
</div>`;
}







////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Handlers
// Funciones que gestionan los eventos.

/**
 * Recibe los datos del formulario de creación de un nuevo semestre.
 * Da formato adecuado a los datos.
 * Esconde el formulario.
 * Limpia el formulario
 * Crea el semestre en la base de datos.
 * Actualiza la lista de semestres.
 * @param {Event} ev - Evento de envío del formulario
 * @param {HTMLFormElement} form - Formulario de creación de semestre
 * @returns {Boolean} - Devuelve false para evitar que el formulario refresque
 * la página.
 */
async function handleSemForm(ev, form) {
    ev.preventDefault();

    // Si en el formulario hay una id (en el campo escondido semId), es
    // porque se está editando un semestre. En ese caso, hay que actualizar
    // el semestre en la BD en vez de crear uno nuevo.

    const sem = {
        id: String(form.semId.value),
        name: form.semName.value,
        year: Number(form.semYear.value),
        start: form.semStart.value,
        end: form.semEnd.value,
        descrip: form.semDescrip.value,
        color: form.semColor.value,
        kind: Number(form.semKind.value),
        tutorized: form.semTutor.checked,
        subjects: [],
    };

    semesterModal.hide();
    form.reset();

    if (sem.id) {
        await updateSemesterDB(sem);

        broadcast("ha editado un semestre");

    } else {
        console.log('Creating semester', sem);
        await createSemesterDB(sem);

        broadcast("ha creado un semestre");
    }

    refreshSemesters();
    return false;
}

/**
 * Recibe los datos del formulario de creación de una nueva asignatura.
 * Da formato adecuado a los datos.
 * Esconde el formulario.
 * Limpia el formulario
 * Crea la asignatura en la base de datos.
 * Actualiza la lista de asignaturas.
 * @param {Event} ev - Evento de envío del formulario
 * @param {HTMLFormElement} form - Formulario de creación de asignatura
 * @returns {Boolean} - Devuelve false para evitar que el formulario refresque
 * la página.
 */
async function handleSubjectForm(ev, form) {
    ev.preventDefault();

    // Ruta del archivo adjunto, si lo había (si no, será una string vacía)
    let filePath = subjectFileOld.href;
    // Si hay un archivo que subir, subirlo
    if (form.subjectFile.value) {
        filePath = await handleFileUpload(form);
    }

    // Si en el formulario hay una id (en el campo escondido subjId), es
    // porque se está editando una asignatura. En ese caso, hay que actualizar
    // la asignatura en la BD en vez de crear una nueva.
    const subj = {
        id: String(form.subjId.value),
        semId: String(form.subjSemId.value),
        name: form.subjectName.value,
        descrip: form.subjectDescrip.value,
        difficulty: Number(form.subjectDifficulty.value),
        grade: Number(form.subjectGrade.value),
        like: form.subjectLike.checked,
        status: Number(form.subjStatus.value),
        filePath,
    };

    subjectModal.hide();
    form.reset();

    if (subj.id) {
        // Si hay id, se está editando una asignatura
        await updateSubjectDB(subj);

        broadcast("ha editado una asignatura");
    } else {
        // Si no hay id, se está creando una asignatura nueva
        await createSubjectDB(subj);

        broadcast("ha creado una asignatura");
    }

    const sem = await getSemesterByIdDB(subj.semId);
    refreshSubjects(sem);
    return false;
}

async function handleFileUpload(form) {

    const formData = new FormData(form);
    const response = await fetch('/upload', {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    console.log(data);
    return data.path;
}

// Funciones que gestionan el drag & drop

/**
 * Cambia el iconito del cursor cuando se arrastra un elemento al tipo "move".
 */


function dragover(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
}

/**
 * Cambia el color de fondo de la columna cuando se arrastra un elemento sobre
 * ella, para ello, le añade la clase 'dragover'.
 */
function dragenter(ev) {
    ev.preventDefault();
    // Remove dragover class from all zones
    zones.forEach(zone => zone.classList.remove('dragover'));
    this.classList.add('dragover');
}

/**
 * Por ahora no hace nada.
 */
function dragleave(ev) {
    ev.preventDefault();
}

/**
 * Cambia el estado de la asignatura cuando se suelta sobre una columna.
 * Para ello:
 * - Recupera el dato guardado por dragstart en el `dataTransfer` (el id de la
 * asignatura que se está arrastrando).
 * - Gracias al id recuperado, con `document.getElementById` obtiene el elemento
 * HTML mismo.
 * - Recupera el id de la asignatura que la BD reconocerá. Este id está guardado
 * en el atributo `data-id` de la card de la asignatura.
 * - Recupera el estado de la columna sobre la que se ha soltado el elemento.
 * Ese estado está guardado en el atributo `data-status` de la columna.
 * - Actualiza el estado de la asignatura en la BD, para ello pasa solo dos
 * datos: el id de la asignatura y el nuevo estado.
 * - Mueve la card de la asignatura a la columna correspondiente (usando
 * appendChild)
 */
async function dragdrop(ev, pubsub) {
    ev.preventDefault();
    const column = ev.currentTarget;
    this.classList.remove('dragover');
    const subjId = ev.dataTransfer.getData('text/plain');
    const card = document.getElementById(subjId);
    const id = card.dataset.id;
    const status = column.dataset.status;

    // Actualiza el estado de la asignatura en la BD
    await updateSubjectStatusDB(String(id), Number(status));
    
    // Publica un evento GraphQL indicando que se soltó un archivo
    pubsub.publish('FILE_DROPPED_EVENT', { fileDropped: 'Archivo soltado' });

    // La tarjeta se añade a un div que está dentro de la columna, por eso se
    // usa querySelector para seleccionar ese div y luego appendChild para
    // añadir la tarjeta a ese div.
    column.querySelector("div").appendChild(card);

    broadcast(`ha movido una asignatura de columna (id: ${id}, status: ${status})`);
}

/**
 * Guarda el id de la asignatura que se está arrastrando, para recuperarlo
 * luego en dragdrop.
 */
function dragstart(ev) {
    ev.dataTransfer.setData('text/plain', this.id);
}

/**
 * Elimina la clase 'dragover' (que añade un borde rojo) de todas las columnas.
 */
function dragend(ev) {
    // Remove dragover class from all zones
    zones.forEach(zone => zone.classList.remove('dragover'));
}

/**
 * Aplica los listeners de drag&drop a las columnas y la zona de "pendientes",
 * es decir, a todas las zonas que pueden recibir una asignatura arrastrada.
 */
function applyListeners(pubsub) {
    // Drag&drop listeners
    // En vez de hacerlo una a una, podemos iterar por el array de zonas con
    // forEach y aplicar los listeners a cada una de ellas.
    zones.forEach(zone => {
        zone.addEventListener('dragover', (ev) => dragover(ev, pubsub));
        zone.addEventListener('dragenter', (ev) => dragenter(ev, pubsub));
        zone.addEventListener('dragleave', (ev) => dragleave(ev, pubsub));
        zone.addEventListener('drop', (ev) => dragdrop(ev, pubsub));
    });
}

function initializeSocket() {
    // https://socket.io/docs/v4/tutorial/introduction
    socket = io();

    // Al recibir mensajes, mostrarlos
    socket.on('dimelotodo', (msg) => {
        console.log("Recibido:", msg);
        messageFlash(msg.text, "info");
    });
}




////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// UI
// Estas funciones controlan el aspecto de la página (User Interface).
// Muestras u ocultan secciones y cambian el texto de los elementos del DOM que
// haga falta (el título, el eslogan, etc.)

/**
 * Muestra la lista de semestres y oculta la página de asignaturas.
 * También cambia el título y una palabra del eslogan.
 */
function goSemsList() {
    hideMe(semHeader, semesterPage);
    showMe(dashboardHeader, semestersList);
}

/**
 * Vacía la lista de semestres (se trata del `div` que contiene las cards de
 * los semestres), y los vuelve a crear todos de nuevo.
 * Esto se hace para que se actualice la lista de semestres cuando se crea uno
 * nuevo, o bien se actualiza o se borra.
 */
async function refreshSemesters() {

    const semesters = await getSemestersDB();

    semestersList.innerHTML = '';
    semesters.forEach(sem => {
        semestersList.innerHTML += createSemCard(sem);
    });
}

/**
 * Muestra la página de asignaturas y oculta la lista de semestres.
 * También cambia el título y una palabra del eslogan.
 * @param {Number} id - Id del semestre que se quiere abrir
 */
async function openSem(id) {
    // Cast to string
    id = String(id);
    console.log('Opening sem', id);

    hideMe(dashboardHeader, semestersList);
    const sem = await getSemesterByIdDB(id);
    semesterPage.dataset.id = id;
    refreshSubjects(sem);
    showMe(semHeader, semesterPage);

    broadcast("ha abierto el semestre " + sem.name);
}


async function openSemForm(id = null) {
    if (id) {
        // Si existe un id, estamos editando un semestre existente
        semModalTitle.innerHTML = 'Editar semestre';
        const sem = await getSemesterByIdDB(id);

        semFormFields.id.value = id;
        semFormFields.name.value = sem.name;
        semFormFields.year.value = sem.year;
        semFormFields.start.value = sem.start.slice(0, 10);
        semFormFields.end.value = sem.end.slice(0, 10);
        semFormFields.descrip.value = sem.descrip;
        semFormFields.color.value = sem.color;
        semFormFields.kind.value = sem.kind;
        semFormFields.tutorized.checked = sem.tutorized;

    } else {
        // Si no existe un id, estamos creando un semestre nuevo
        // Ponemos valores vacíos y por defecto
        semModalTitle.innerHTML = 'Nuevo semestre';
        semFormFields.id.value = '';
        semFormFields.name.value = '';
        semFormFields.year.value = '';
        semFormFields.start.value = '';
        semFormFields.end.value = '';
        semFormFields.descrip.value = '';
        semFormFields.color.value = '#c398b7';
        semFormFields.kind.value = '1';
        semFormFields.tutorized.checked = true;
    }
    semesterModal.show();

    broadcast("ha abierto el formulario de semestre");
}


/**
 * Vacía las listas de asignaturas (se trata de los `div` que contienen las
 * cards de las asignaturas), y las vuelve a crear todas de nuevo, cada una en
 * su lista correspondiente.
 */
async function refreshSubjects(sem) {

    const subjects = await getSubjectsBySemesterIdDB(sem.id);

    // Clear lists
    pendientesList.innerHTML = '';
    empezadasList.innerHTML = '';
    aprobadasList.innerHTML = '';
    suspendidasList.innerHTML = '';

    if (sem) {
        // Fill in semester subjects by status
        subjects.forEach(subj => {
            const subjCard = createSubjectCard(subj);
            switch (subj.status) {
                case PENDIENTE:
                    pendientesList.innerHTML += subjCard;
                    break;
                case EMPEZADA:
                    empezadasList.innerHTML += subjCard;
                    break;
                case APROBADA:
                    aprobadasList.innerHTML += subjCard;
                    break;
                case SUSPENDIDA:
                    suspendidasList.innerHTML += subjCard;
                    break;
            }
        });

        // Add drag listeners to subject cards
        document.querySelectorAll('.parrafo').forEach(card => {
            card.addEventListener('dragstart', dragstart);
            card.addEventListener('dragend', dragend);
        });
    }
}

/**
 * Muestra el formulario de las asignaturas.
 * @param {Number} status - Estado de la asignatura que se quiere crear
 * (solo si se está creando).
 * @param {String} id - Id de la asignatura que se quiere editar
 * (solo si se está editando).
 */
async function openSubjectForm(status, id = null) {
    // Set hidden values in form
    subjFormFields.semId.value = semesterPage.dataset.id;
    subjectFileOld.href = '';
    hideMe(subjectFileOld);

    if (id) {
        id = String(id);
        // Si existe un id, estamos editando una asignatura existente
        subjModalTitle.innerHTML = 'Editar asignatura';
        const subj = await getSubjectByIdDB(id);

        subjFormFields.status.value = subj.status;
        subjFormFields.id.value = id;
        subjFormFields.name.value = subj.name;
        subjFormFields.descrip.value = subj.descrip;
        subjFormFields.difficulty.value = subj.difficulty;
        subjFormFields.grade.value = subj.grade;
        subjFormFields.like.checked = subj.like;

        // Si existe una ruta de archivo, mostrar el enlace
        if (subj.filePath) {
            subjectFileOld.href = subj.filePath;
            showMe(subjectFileOld);
        }

    } else {
        // Si no existe un id, estamos creando una asignatura nueva
        subjModalTitle.innerHTML = 'Nueva asignatura';
        subjFormFields.status.value = status;
        subjFormFields.id.value = '';
        subjFormFields.name.value = '';
        subjFormFields.descrip.value = '';
        subjFormFields.difficulty.value = '5'; // Valor por defecto
        subjFormFields.grade.value = '';
        subjFormFields.like.checked = false;
    }
    subjectModal.show();

    broadcast("ha abierto el formulario de asignatura");
}



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// GLOBALS
// Elements
// Obtener los elementos del html para que el JS los pueda gestionar
const dashboardHeader = document.getElementById('dashboardHeader');
const semHeader = document.getElementById('semHeader');
const semestersList = document.getElementById('semestersList');
const semesterPage = document.getElementById('semesterPage');
const semesterModal = new bootstrap.Modal('#semesterModal');
const semModalTitle = document.getElementById('semModalTitle');
const subjectModal = new bootstrap.Modal('#subjectModal');
const subjModalTitle = document.getElementById('subjModalTitle');
const subjectForm = document.getElementById('subjectForm');
const subjectFileOld = document.getElementById('subjectFileOld');
const confirmDelete = new bootstrap.Modal('#confirmDelete');
const pendientesZone = document.getElementById('pendientes-zone');
const pendientesList = document.getElementById('pendientesList');
const empezadasColumn = document.getElementById('empezadas-column');
const empezadasList = document.getElementById('empezadasList');
const aprobadasColumn = document.getElementById('aprobadas-column');
const aprobadasList = document.getElementById('aprobadasList');
const suspendidasColumn = document.getElementById('suspendidas-column');
const suspendidasList = document.getElementById('suspendidasList');
const flash = document.getElementById('flash');
const flashMsg = document.getElementById('flashMsg');

// Fields in forms
const semFormFields = {
    id: document.getElementById('semId'),
    name: document.getElementById('semName'),
    year: document.getElementById('semYear'),
    start: document.getElementById('semStart'),
    end: document.getElementById('semEnd'),
    descrip: document.getElementById('semDescrip'),
    color: document.getElementById('semColor'),
    kind: document.getElementById('semKind'),
    tutorized: document.getElementById('semTutor'),
};
const subjFormFields = {
    id: document.getElementById('subjId'),
    status: document.getElementById('subjStatus'),
    semId: document.getElementById('subjSemId'),
    name: document.getElementById('subjectName'),
    descrip: document.getElementById('subjectDescrip'),
    difficulty: document.getElementById('subjectDifficulty'),
    grade: document.getElementById('subjectGrade'),
    like: document.getElementById('subjectLike'),
};
const zones = [pendientesZone, empezadasColumn, aprobadasColumn,
    suspendidasColumn];


/**
 * Inicializa la página.
 * - Aplica los listeners de las zonas Drag&Drop
 * - Actualiza la lista de semestres.
*/
async function init() {
    initializeSocket();
    applyListeners();
    refreshSemesters();
}

////////////////////////////////////////////////////////////////////////////////
// Todo el código anterior no hace nigún cambio en el DOM. Solo define variables
// y constantes y también funciones.
// Solo cuando se llega a este punto empieza a realizarse algo en la página.
init();
