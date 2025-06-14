# School Management Information System (MIS)

A comprehensive web-based School Management Information System built with React.js and Firebase. This system streamlines school operations, enhances communication between teachers and students, and provides a centralized platform for managing various aspects of school administration.

## 🌟 Key Features

### 1. User Management

- **Multi-role Authentication**
  - Admin: Full system control and management
  - Staff (Teachers): Class and student management
  - Students: Access to personal information and resources
- **Secure Authentication System**
  - Email/Password authentication
  - Role-based access control
  - Protected routes and features

### 2. Class Management

- **Teacher Dashboard**
  - View assigned classes
  - Manage class schedules
  - Track student progress
- **Class Organization**
  - Create and manage classes
  - Assign teachers to classes
  - Monitor class performance

### 3. Attendance System

- **Daily Attendance Tracking**
  - Mark student attendance (Present/Absent/Late)
  - View attendance history
  - Generate attendance reports
- **Attendance Analytics**
  - Track attendance patterns
  - Monitor student attendance rates
  - Export attendance data

### 4. Assignment Management

- **Teacher Features**
  - Create and assign tasks
  - Set deadlines
  - Grade submissions
  - Provide feedback
- **Student Features**
  - View assigned tasks
  - Track deadlines
  - Submit assignments
  - View grades and feedback

### 5. Timetable Management

- **Schedule Management**
  - Create class schedules
  - Assign rooms and time slots
  - Manage teacher availability
- **View Timetables**
  - Class-wise timetables
  - Teacher schedules
  - Room allocation

### 6. Fee Management

- **Online Payments**
  - Secure payment processing via Paystack
  - Multiple payment methods
  - Automatic receipt generation
- **Fee Tracking**
  - Monitor payment status
  - View payment history
  - Generate financial reports

### 7. Dashboard

- **Role-specific Views**
  - Admin: System overview and management
  - Teachers: Class and student information
  - Students: Personal schedule and assignments
- **Quick Access**
  - Important notifications
  - Upcoming events
  - Recent activities

### 8. Reports and Analytics

- **Comprehensive Reporting**
  - Attendance reports
  - Academic performance
  - Financial statements
- **Data Visualization**
  - Performance trends
  - Attendance patterns
  - Financial analytics

## 🛠️ Tech Stack

- **Frontend**

  - React.js with functional components
  - TailwindCSS for styling
  - React Router for navigation
  - Framer Motion for animations

- **Backend**
  - Firebase Firestore (Database)
  - Firebase Authentication
  - Firebase Storage
  - Paystack Integration

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Paystack account

## 🚀 Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd school-mis
```

2. Install dependencies:

```bash
npm install
```

3. Create a Firebase project and enable:

   - Authentication (Email/Password)
   - Firestore Database
   - Storage

4. Create a `.env` file in the root directory and add your Firebase configuration:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

5. Start the development server:

```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── pages/         # Page components
├── firebase/      # Firebase configuration
├── App.jsx        # Main app component
└── main.jsx       # Entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔒 Security

- Secure authentication system
- Role-based access control
- Protected API endpoints
- Secure payment processing
- Data encryption

## 📱 Responsive Design

- Mobile-first approach
- Cross-browser compatibility
- Adaptive layouts
- Touch-friendly interfaces

## 🎯 Future Enhancements

- Mobile application
- Real-time notifications
- Advanced analytics
- Parent portal
- Integration with external systems
- Automated reporting
- Bulk operations
- API documentation
