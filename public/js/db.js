////////////////////////////////////////////////////////////////////////////////
// REAL DATABASE FUNCTIONS
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// Función genérica
/**
 * Obtiene los datos de la base de datos.
 * @param {Object} body - Objeto con la query a ejecutar
 * @returns {Object} - Objeto con los datos de la base de datos
 */
async function connectDB(body) {
    try {
        const responseRaw = await fetch('/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const responseJson = await responseRaw.json();
        console.log("From DB", responseJson);
        // messageFlash("Conectado con la base de datos", "success");
        return responseJson.data;

    } catch (error) {
        console.error(error);
        messageFlash("Error de conexión con la base de datos", "danger");
        return null;
    }
}

////////////////////////////////////////////////////////////////////////////////
// Queries
async function getSemestersDB() {
    const body = {
        query: `{
            semesters {
                id
                name
                descrip
                color
            }
        }`
    };
    const data = await connectDB(body)
    if (data) { return data.semesters; }
    return [];
}


async function getSemesterByIdDB(id) {
    const body = {
        query: `{
            getSemesterById(id: "${id}") {
                id
                name
                year
                start
                end
                descrip
                color
                kind
                tutorized
            }
        }`
    };
    const data = await connectDB(body);
    if (data) { return data.getSemesterById; }
    return {};
}


async function getSubjectsBySemesterIdDB(semId) {
    const body = {
        query: `{
            getSubjectsBySemesterId(semId: "${semId}") {
                id
                semId
                name
                descrip
                status
            }
        }`
    };
    const data = await connectDB(body);
    if (data) {
        return data.getSubjectsBySemesterId;
    }
    return [];
}


async function getSubjectByIdDB(id) {
    const body = {
        query: `{
            getSubjectById(id: "${id}") {
                id
                semId
                name
                descrip
                status
                difficulty
                grade
                like
                filePath
            }
        }`
    };
    const data = await connectDB(body);
    if (data) { return data.getSubjectById; }
    return {};
}


////////////////////////////////////////////////////////////////////////////////
// Mutations
async function createSemesterDB(sem) {
    const body = {
        query: `mutation {
            createSemester(
                name: "${sem.name}",
                year: ${sem.year},
                start: "${sem.start}",
                end: "${sem.end}",
                descrip: "${sem.descrip}",
                color: "${sem.color}",
                kind: ${sem.kind},
                tutorized: ${sem.tutorized}
            ) {
                id
            }
        }`
    };
    const data = await connectDB(body);
    if (data) { return data.createSemester; }
    return null;
}

async function updateSemesterDB(sem) {
    const body = {
        query: `mutation {
            updateSemester(
                id: "${sem.id}",
                name: "${sem.name}",
                year: ${sem.year},
                start: "${sem.start}",
                end: "${sem.end}",
                descrip: "${sem.descrip}",
                color: "${sem.color}",
                kind: ${sem.kind},
                tutorized: ${sem.tutorized}
            ) {
                id
            }
        }`
    };
    const data = await connectDB(body);
    if (data) { return data.updateSemester; }
    return {};
}

async function deleteSemesterDB(id) {
    const body = {
        query: `mutation {
            deleteSemester(id: "${id}") {
                id
            }
        }`
    };
    const data = await connectDB(body);
    if (data) { return data.deleteSemester; }
    return null;
}

async function createSubjectDB(subj) {
    const body = {
        query: `mutation {
            createSubject(
                semId: "${subj.semId}",
                name: "${subj.name}",
                descrip: "${subj.descrip}",
                status: ${subj.status},
                difficulty: ${subj.difficulty},
                grade: ${subj.grade},
                like: ${subj.like},
                filePath: "${subj.filePath}"
            ) {
                id
            }
        }`
    };
    const data = await connectDB(body);
    if (data) { return data.createSubject; }
    return null;
}

async function updateSubjectDB(subj) {
    const body = {
        query: `mutation {
            updateSubject(
                id: "${subj.id}",
                name: "${subj.name}",
                descrip: "${subj.descrip}",
                status: ${subj.status},
                difficulty: ${subj.difficulty},
                grade: ${subj.grade},
                like: ${subj.like},
                filePath: "${subj.filePath}"
            ) {
                id
            }
        }`
    };
    const data = await connectDB(body);
    if (data) { return data.updateSubject; }
    return {};
}

async function updateSubjectStatusDB(id, status) {
    const body = {
        query: `mutation {
            updateSubjectStatus(
                id: "${id}",
                status: ${status}
            ) {
                id
            }
        }`
    };
    const data = await connectDB(body);
    if (data) { return data.updateSubjectStatus; }
    return {};
}

async function deleteSubjectDB(id) {
    const body = {
        query: `mutation {
            deleteSubject(id: "${id}") {
                id
            }
        }`
    };
    const data = await connectDB(body);
    if (data) { return data.deleteSubject; }
    return null;
}