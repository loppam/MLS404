import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import BackButton from "../components/BackButton";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  "8:00 AM - 9:00 AM",
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
];

export default function StaffTimetable() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timetable, setTimetable] = useState({});
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);

  const fetchTimetable = useCallback(async () => {
    try {
      const timetableQuery = query(
        collection(db, "timetable"),
        where("teacherId", "==", currentUser.uid)
      );
      const timetableSnapshot = await getDocs(timetableQuery);
      const timetableData = {};

      timetableSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!timetableData[data.day]) {
          timetableData[data.day] = {};
        }
        timetableData[data.day][data.time] = {
          id: doc.id,
          classId: data.classId,
          className: data.className,
          subject: data.subject,
          room: data.room || "Not specified",
        };
      });

      setTimetable(timetableData);
    } catch (error) {
      console.error("Error fetching timetable:", error);
      setError("Failed to fetch timetable data");
    }
  }, [currentUser]);

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
    } catch (error) {
      console.error("Error fetching classes:", error);
      setError("Failed to fetch classes data");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTimetable();
    fetchClasses();
  }, [fetchTimetable, fetchClasses]);

  const handleClassClick = (classData) => {
    setSelectedClass(classData);
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Teaching Schedule
            </h1>
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Print Schedule
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Export
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {TIME_SLOTS.map((timeSlot) => (
                    <tr key={timeSlot}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {timeSlot}
                      </td>
                      {DAYS.map((day) => {
                        const classData = timetable[day]?.[timeSlot];
                        return (
                          <td
                            key={`${day}-${timeSlot}`}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {classData ? (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-indigo-50 p-3 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                                onClick={() => handleClassClick(classData)}
                              >
                                <div className="font-medium text-indigo-900">
                                  {classData.className}
                                </div>
                                <div className="text-indigo-600">
                                  {classData.subject}
                                </div>
                                <div className="text-indigo-500 text-xs">
                                  Room: {classData.room}
                                </div>
                              </motion.div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Class Details Modal */}
          <AnimatePresence>
            {selectedClass && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4"
                onClick={() => setSelectedClass(null)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white rounded-lg max-w-md w-full p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Class Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Class Name
                      </label>
                      <div className="mt-1 text-sm text-gray-900">
                        {selectedClass.className}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Subject
                      </label>
                      <div className="mt-1 text-sm text-gray-900">
                        {selectedClass.subject}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Room
                      </label>
                      <div className="mt-1 text-sm text-gray-900">
                        {selectedClass.room}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Time
                      </label>
                      <div className="mt-1 text-sm text-gray-900">
                        {selectedClass.time}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Day
                      </label>
                      <div className="mt-1 text-sm text-gray-900">
                        {selectedClass.day}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => setSelectedClass(null)}
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
