import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import BackButton from "../components/BackButton";

export default function Attendance() {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
      fetchAttendance();
    }
  }, [selectedClass, date]);

  const fetchTeacherClasses = async () => {
    try {
      const classesQuery = query(
        collection(db, "classes"),
        where("teacherId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(classesQuery);
      const classesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classesList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setError("Failed to fetch classes");
      setLoading(false);
    }
  };

  const fetchClassStudents = async () => {
    try {
      // Get all students since they are in all classes
      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student")
      );
      const querySnapshot = await getDocs(studentsQuery);
      const studentsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students");
    }
  };

  const fetchAttendance = async () => {
    try {
      if (!selectedClass) {
        setAttendance([]);
        return;
      }

      const attendanceQuery = query(
        collection(db, "attendance"),
        where("classId", "==", selectedClass),
        where("date", "==", date)
      );
      const querySnapshot = await getDocs(attendanceQuery);
      const attendanceRecords = [];
      let currentAttendanceData = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        currentAttendanceData = data.students || {};

        Object.entries(data.students || {}).forEach(([studentId, status]) => {
          const student = students.find((s) => s.id === studentId);
          if (student) {
            attendanceRecords.push({
              id: doc.id,
              studentId,
              studentName: student.name,
              status,
              date: data.date,
              className: data.className || "Unknown Class",
            });
          }
        });
      });

      console.log("Fetched attendance records:", attendanceRecords);
      setAttendance(attendanceRecords);
      setAttendanceStatus(currentAttendanceData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setError("Failed to fetch attendance records");
    }
  };

  const markAttendance = (studentId, status) => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAllPresent = () => {
    const newStatus = {};
    students.forEach((student) => {
      newStatus[student.id] = "present";
    });
    setAttendanceStatus(newStatus);
  };

  const markAllAbsent = () => {
    const newStatus = {};
    students.forEach((student) => {
      newStatus[student.id] = "absent";
    });
    setAttendanceStatus(newStatus);
  };

  const handleSubmit = async () => {
    try {
      if (!selectedClass || !date) {
        setError("Please select a class and date");
        return;
      }

      if (Object.keys(attendanceStatus).length === 0) {
        setError("Please mark attendance for at least one student");
        return;
      }

      setError("");
      setSuccess("");
      setSubmitting(true);

      const attendanceQuery = query(
        collection(db, "attendance"),
        where("classId", "==", selectedClass),
        where("date", "==", date)
      );
      const querySnapshot = await getDocs(attendanceQuery);

      const attendanceData = {
        classId: selectedClass,
        date,
        students: attendanceStatus,
        teacherId: currentUser.uid,
        className:
          classes.find((c) => c.id === selectedClass)?.name || "Unknown Class",
        createdAt: new Date().toISOString(),
      };

      if (querySnapshot.empty) {
        await addDoc(collection(db, "attendance"), attendanceData);
      } else {
        const attendanceDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "attendance", attendanceDoc.id), {
          students: attendanceStatus,
          updatedAt: new Date().toISOString(),
        });
      }

      setAttendanceStatus({});
      await fetchAttendance();
      setSuccess("Attendance saved successfully!");
      setShowForm(false);
    } catch (error) {
      console.error("Error saving attendance:", error);
      setError("Failed to save attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttendance = async (recordId) => {
    try {
      await deleteDoc(doc(db, "attendance", recordId));
      fetchAttendance();
      setError("");
    } catch (error) {
      console.error("Error deleting attendance:", error);
      setError("Failed to delete attendance record");
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderAttendanceTable = () => {
    return (
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h3 className="text-xl font-semibold text-gray-900">
              Attendance Records
            </h3>
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {selectedClass
                      ? `No attendance records found for ${
                          classes.find((c) => c.id === selectedClass)?.name ||
                          "selected class"
                        } on ${formatDate(date)}`
                      : "Please select a class and date to view attendance records"}
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {record.studentName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.studentName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.className}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === "present"
                            ? "bg-green-100 text-green-800"
                            : record.status === "absent"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {record.status.charAt(0).toUpperCase() +
                          record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteAttendance(record.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAttendanceForm = () => {
    return (
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-xl font-semibold text-gray-900">
            Mark Attendance
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select a class</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {selectedClass && students.length > 0 && (
            <div className="mt-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Quick Actions
                </h4>
                <div className="flex space-x-4">
                  <button
                    onClick={() => markAllPresent()}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={() => markAllAbsent()}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-500 transition-colors"
                  >
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
                    <div className="flex space-x-4">
                      <button
                        onClick={() => markAttendance(student.id, "present")}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          attendanceStatus[student.id] === "present"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800 hover:bg-green-50"
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, "absent")}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          attendanceStatus[student.id] === "absent"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800 hover:bg-red-50"
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, "late")}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          attendanceStatus[student.id] === "late"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800 hover:bg-yellow-50"
                        }`}
                      >
                        Late
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={
                    !date ||
                    Object.keys(attendanceStatus).length === 0 ||
                    submitting
                  }
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Attendance"
                  )}
                </button>
              </div>
            </div>
          )}
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
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {showForm ? "View Records" : "Mark Attendance"}
              </button>
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
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {showForm ? renderAttendanceForm() : renderAttendanceTable()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
