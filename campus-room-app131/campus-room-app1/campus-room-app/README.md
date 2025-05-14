# Campus Room - Classroom Reservation System

A React-based classroom and study space reservation system for educational institutions.

## Features

- Authentication system with role-based access control (Admin, Professor, Student)
- Dashboard for each user role with relevant statistics and information
- Classroom and study room reservation functionality
- Calendar view for schedules and reservations
- Mobile-responsive design

## Project Structure

The project follows a component-based architecture with the following structure:

```
campus-room-react/
├── public/               # Static files
├── src/
│   ├── components/       # React components
│   │   ├── common/       # Shared components
│   │   ├── auth/         # Authentication components
│   │   ├── admin/        # Admin-specific components
│   │   ├── professor/    # Professor-specific components
│   │   └── student/      # Student-specific components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Service functions for API calls
│   ├── utils/            # Utility functions
│   ├── styles/           # CSS styles
│   ├── App.js            # Main application component
│   └── index.js          # Entry point
└── package.json          # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/campus-room-react.git
cd campus-room-react
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Open your browser and navigate to http://localhost:3000

## Default Users

The system comes with the following default users for testing:

| Role      | Email                    | Password    |
|-----------|--------------------------|-------------|
| Admin     | admin@example.com        | admin123    |
| Professor | professor@example.com    | prof123     |
| Student   | student@example.com      | student123  |

## Deployment

To build the project for production:

```bash
npm run build
# or
yarn build
```

This will create a `build` directory with optimized production files.

## License

This project is licensed under the MIT License.# Campus Room - Classroom Reservation System

A React-based classroom and study space reservation system for educational institutions.

## Features

- Authentication system with role-based access control (Admin, Professor, Student)
- Dashboard for each user role with relevant statistics and information
- Classroom and study room reservation functionality
- Calendar view for schedules and reservations
- Mobile-responsive design

## Project Structure

The project follows a component-based architecture with the following structure:

```
campus-room-react/
├── public/               # Static files
├── src/
│   ├── components/       # React components
│   │   ├── common/       # Shared components
│   │   ├── auth/         # Authentication components
│   │   ├── admin/        # Admin-specific components
│   │   ├── professor/    # Professor-specific components
│   │   └── student/      # Student-specific components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Service functions for API calls
│   ├── utils/            # Utility functions
│   ├── styles/           # CSS styles
│   ├── App.js            # Main application component
│   └── index.js          # Entry point
└── package.json          # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/campus-room-react.git
cd campus-room-react
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Open your browser and navigate to http://localhost:3000

## Default Users

The system comes with the following default users for testing:

| Role      | Email                    | Password    |
|-----------|--------------------------|-------------|
| Admin     | admin@example.com        | admin123    |
| Professor | professor@example.com    | prof123     |
| Student   | student@example.com      | student123  |

## Deployment

To build the project for production:

```bash
npm run build
# or
yarn build
```

This will create a `build` directory with optimized production files.

## License

This project is licensed under the MIT License.