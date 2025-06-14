import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import BackButton from "../components/BackButton";

export default function Grades() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState({});

  const fetchClasses = useCallback(async () => {
    try {
      const classesQuery = query(
        collection(db, "classes"),
        where("teacherId", "==", currentUser.uid)
      );
      const classesSnapshot = await getDocs(classesQuery);
      const classesData = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classesData);
      if (classesData.length > 0) {
        setSelectedClass(classesData[0].id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setError("Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchStudents = useCallback(async (classId) => {
    try {
      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("classId", "==", classId)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students");
      setLoading(false);
    }
  }, []);

  const fetchAssignments = useCallback(async (classId) => {
    try {
      const assignmentsQuery = query(
        collection(db, "assignments"),
        where("classId", "==", classId),
        where("status", "==", "active")
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsData = assignmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAssignments(assignmentsData);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError("Failed to fetch assignments");
      setLoading(false);
    }
  }, []);

  const fetchGrades = useCallback(async (classId) => {
    try {
      const gradesQuery = query(
        collection(db, "grades"),
        where("classId", "==", classId)
      );
      const gradesSnapshot = await getDocs(gradesQuery);
      const gradesData = {};
      gradesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!gradesData[data.studentId]) {
          gradesData[data.studentId] = {};
        }
        gradesData[data.studentId][data.assignmentId] = {
          id: doc.id,
          ...data,
        };
      });
      setGrades(gradesData);
    } catch (error) {
      console.error("Error fetching grades:", error);
      setError("Failed to fetch grades");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClass) {
      setLoading(true);
      Promise.all([
        fetchStudents(selectedClass),
        fetchAssignments(selectedClass),
        fetchGrades(selectedClass),
      ])
        .catch((error) => {
          console.error("Error fetching class data:", error);
          setError("Failed to fetch class data");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedClass, fetchStudents, fetchAssignments, fetchGrades]);

  const handleGradeChange = async (studentId, assignmentId, value) => {
    try {
      const gradeData = {
        studentId,
        assignmentId,
        classId: selectedClass,
        value: parseFloat(value),
        teacherId: currentUser.uid,
        updatedAt: new Date().toISOString(),
      };

      if (grades[studentId]?.[assignmentId]?.id) {
        await updateDoc(
          doc(db, "grades", grades[studentId][assignmentId].id),
          gradeData
        );
      } else {
        await addDoc(collection(db, "grades"), gradeData);
      }

      fetchGrades(selectedClass);
    } catch (error) {
      console.error("Error updating grade:", error);
      setError("Failed to update grade");
    }
  };

  const calculateClassAverage = () => {
    if (students.length === 0 || assignments.length === 0) return 0;

    let totalPercentage = 0;
    let studentCount = 0;

    students.forEach((student) => {
      const studentGrades = grades[student.id] || {};
      const totalMarks = assignments.reduce((sum, assignment) => {
        const grade = studentGrades[assignment.id]?.value || 0;
        return sum + grade;
      }, 0);
      const maxMarks = assignments.reduce(
        (sum, assignment) => sum + assignment.totalMarks,
        0
      );

      if (maxMarks > 0) {
        const studentPercentage = (totalMarks / maxMarks) * 100;
        totalPercentage += studentPercentage;
        studentCount++;
      }
    });

    return studentCount > 0 ? totalPercentage / studentCount : 0;
  };

  const renderGradeTable = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Total Students</h3>
                <p className="mt-2 text-4xl font-bold">{students.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Total Assignments</h3>
                <p className="mt-2 text-4xl font-bold">{assignments.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Class Average</h3>
                <p className="mt-2 text-4xl font-bold">
                  {calculateClassAverage().toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-semibold text-gray-900">
              Student Grades
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  {assignments.map((assignment) => (
                    <th
                      key={assignment.id}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex flex-col">
                        <span>{assignment.title}</span>
                        <span className="text-xs text-gray-400">
                          Max: {assignment.totalMarks}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const studentGrades = grades[student.id] || {};
                  const totalMarks = assignments.reduce((sum, assignment) => {
                    const grade = studentGrades[assignment.id]?.value || 0;
                    return sum + grade;
                  }, 0);
                  const maxMarks = assignments.reduce(
                    (sum, assignment) => sum + assignment.totalMarks,
                    0
                  );
                  const average =
                    maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      {assignments.map((assignment) => {
                        const grade = studentGrades[assignment.id]?.value || 0;
                        const percentage =
                          (grade / assignment.totalMarks) * 100;
                        const gradeColor =
                          percentage >= 70
                            ? "text-green-600"
                            : percentage >= 50
                            ? "text-yellow-600"
                            : "text-red-600";

                        return (
                          <td
                            key={assignment.id}
                            className="px-6 py-4 whitespace-nowrap"
                          >
                            <div className="flex items-center">
                              <input
                                type="number"
                                min="0"
                                max={assignment.totalMarks}
                                value={grade}
                                onChange={(e) =>
                                  handleGradeChange(
                                    student.id,
                                    assignment.id,
                                    e.target.value
                                  )
                                }
                                className={`w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${gradeColor}`}
                              />
                              <span className="ml-2 text-sm text-gray-500">
                                /{assignment.totalMarks}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                average >= 70
                                  ? "bg-green-600"
                                  : average >= 50
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                              }`}
                              style={{ width: `${average}%` }}
                            ></div>
                          </div>
                          <span
                            className={`ml-2 text-sm font-medium ${
                              average >= 70
                                ? "text-green-600"
                                : average >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {average.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-b-2 border-indigo-600"
        ></motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton />

        <div className="mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
            <h1 className="text-3xl font-bold text-gray-900">Grades</h1>
            <div className="flex space-x-4">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="block w-full sm:w-64 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select a class</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {selectedClass ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderGradeTable()}
            </motion.div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No class selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a class to view grades
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
