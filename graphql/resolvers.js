import SemestersController from "../controllers/SemestersController.js";
import SubjectsController from "../controllers/SubjectsController.js";
import { DateResolver } from "graphql-scalars";
import { pubsub } from "./pubsub.js";

// Resolvers define how to fetch the types defined in your schema.
const resolvers = {

  Date: DateResolver,

  Query: {
    semesters: async () => {
      return await SemestersController.getSemestersList()
    },
    getSemesterById: async (obj, { id }) => {
      return await SemestersController.getSemesterById(id);
    },
    getSubjectsBySemesterId: async (obj, { semId }) => {
      return await SubjectsController.getSubjectsBySemesterId(semId);
    },
    getSubjectById: async (obj, { id }) => {
      return await SubjectsController.getSubjectById(id);
    },
  },

  Mutation:  {
    createSemester: async (obj, semData) => {
      semData.subjects = [];
      return await SemestersController.createSemester(semData);
    },
    updateSemester: async (obj, semData) => {
      return await SemestersController
        .updateSemester(semData.id, semData);
    },
    deleteSemester: async (obj, { id }) => {
      return await SemestersController.deleteSemester(id);
    },

    createSubject: async (obj, subjectData) => {
      return await SubjectsController
        .createSubject(subjectData);
    },
    updateSubject: async (obj, subjectData) => {
      return await SubjectsController
        .updateSubject(subjectData.id, subjectData);
    },
    updateSubjectStatus: async (obj, subjectData) => {
      pubsub.publish('SUBJECT_STATUS_CHANGED', {
        subjectStatusChanged: subjectData,
      });
      return await SubjectsController
        .updateSubjectStatus(subjectData.id, subjectData.status);
    },
    deleteSubject: async (obj, { id }) => {
      return await SubjectsController.deleteSubject(id);
    },
  },

  Subscription: {
    subjectStatusChanged: {
      subscribe: () => pubsub.asyncIterator(['SUBJECT_STATUS_CHANGED']),
    },
  },
};

export default resolvers;