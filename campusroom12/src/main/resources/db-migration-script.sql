-- Script de migration pour ajouter la colonne 'image' à la table 'classrooms'
-- Exécuter ce script sur votre base de données pour mettre à jour le schéma
-- Modified migration script for class groups with subjects

-- Script de migration pour ajouter les tables de groupes de classes
-- Exécuter ce script sur votre base de données pour mettre à jour le schéma

-- Création de la table des groupes de classes
CREATE TABLE IF NOT EXISTS class_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    description TEXT,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    professor_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Table pivot pour la relation many-to-many entre class_groups et users (étudiants)
CREATE TABLE IF NOT EXISTS class_group_students (
    class_group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (class_group_id, user_id),
    FOREIGN KEY (class_group_id) REFERENCES class_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ajout d'une colonne pour lier les entrées d'emploi du temps aux groupes de classes
ALTER TABLE timetable_entries 
ADD COLUMN class_group_id BIGINT NULL,
ADD FOREIGN KEY (class_group_id) REFERENCES class_groups(id) ON DELETE CASCADE;

-- Ajout d'un index pour améliorer les performances des requêtes
CREATE INDEX idx_timetable_entries_class_group ON timetable_entries(class_group_id);
CREATE INDEX idx_class_groups_professor ON class_groups(professor_id);
CREATE INDEX idx_class_groups_semester ON class_groups(academic_year, semester);

-- Insertion de données d'exemple
INSERT INTO class_groups (name, course_code, description, academic_year, semester, professor_id)
SELECT 
    'Introduction to Computer Science', 
    'CS101', 
    'An introductory course covering the fundamentals of computer science and programming.', 
    '2024-2025', 
    'Fall', 
    id
FROM users 
WHERE role = 'PROFESSOR' 
LIMIT 1;

INSERT INTO class_groups (name, course_code, description, academic_year, semester, professor_id)
SELECT 
    'Calculus I', 
    'MATH101', 
    'An introduction to differential and integral calculus.', 
    '2024-2025', 
    'Fall', 
    id
FROM users 
WHERE role = 'PROFESSOR' 
LIMIT 1;

INSERT INTO class_groups (name, course_code, description, academic_year, semester, professor_id)
SELECT 
    'Introduction to Physics', 
    'PHYS101', 
    'Basic principles of mechanics, thermodynamics, and waves.', 
    '2024-2025', 
    'Fall', 
    id
FROM users 
WHERE role = 'PROFESSOR' 
LIMIT 1;

-- Insertion d'étudiants dans les classes (tous les étudiants dans la première classe)
INSERT INTO class_group_students (class_group_id, user_id)
SELECT 
    (SELECT id FROM class_groups ORDER BY id LIMIT 1),
    id
FROM users
WHERE role = 'STUDENT';

-- Ajouter des entrées d'emploi du temps pour la première classe
INSERT INTO timetable_entries (day, name, instructor, location, start_time, end_time, color, type, class_group_id)
SELECT 
    'Monday',
    'Lecture',
    (SELECT CONCAT(firstName, ' ', lastName) FROM users WHERE id = cg.professor_id),
    'Room 101',
    '09:00',
    '10:30',
    '#6366f1',
    'Lecture',
    cg.id
FROM class_groups cg
ORDER BY id
LIMIT 1;

INSERT INTO timetable_entries (day, name, instructor, location, start_time, end_time, color, type, class_group_id)
SELECT 
    'Wednesday',
    'Lab Session',
    (SELECT CONCAT(firstName, ' ', lastName) FROM users WHERE id = cg.professor_id),
    'Computer Lab 3',
    '13:00',
    '14:30',
    '#10b981',
    'Lab',
    cg.id
FROM class_groups cg
ORDER BY id
LIMIT 1;

INSERT INTO timetable_entries (day, name, instructor, location, start_time, end_time, color, type, class_group_id)
SELECT 
    'Friday',
    'Tutorial',
    'Teaching Assistant',
    'Room 105',
    '11:00',
    '12:00',
    '#0ea5e9',
    'Tutorial',
    cg.id
FROM class_groups cg
ORDER BY id
LIMIT 1;
-- Vérifier si la colonne existe déjà
SET @dbname = DATABASE();
SET @tablename = "classrooms";
SET @columnname = "image";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 'La colonne existe déjà, aucune action nécessaire.' AS message;",
  "ALTER TABLE classrooms ADD COLUMN image VARCHAR(255) AFTER features;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Mise à jour des images par défaut pour les salles existantes en fonction de leur type
UPDATE classrooms 
SET image = CASE 
    WHEN type = 'Lecture Hall' THEN '/images/lecture-hall.jpg'
    WHEN type = 'Computer Lab' THEN '/images/computer-lab.jpg'
    WHEN type = 'Conference Room' THEN '/images/conference-room.jpg'
    ELSE '/images/classroom-default.jpg'
END
WHERE image IS NULL;