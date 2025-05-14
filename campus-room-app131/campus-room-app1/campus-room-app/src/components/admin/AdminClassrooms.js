import React, { useState, useEffect } from 'react';
import Table from '../common/Table';
import Modal from '../common/Modal';
import '../../styles/dashboard.css';
import API from '../../api'; 

const AdminClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [studyRooms, setStudyRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomType, setRoomType] = useState('classroom'); // 'classroom' or 'studyRoom'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Images par défaut disponibles
  const defaultImages = [
    { value: '/images/classroom-default.jpg', label: 'Salle de classe standard' },
    { value: '/images/lecture-hall.jpg', label: 'Amphithéâtre' },
    { value: '/images/computer-lab.jpg', label: 'Laboratoire informatique' },
    { value: '/images/conference-room.jpg', label: 'Salle de conférence' }
  ];
  
  // État du formulaire
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    capacity: '',
    features: '',
    availableTimes: '',
    image: ''
  });
  
  // Charger les salles depuis l'API au montage du composant
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        // Utiliser l'API directement
        const classroomsResponse = await API.get('/api/rooms/classrooms');
        console.log("Classrooms response:", classroomsResponse);
        setClassrooms(classroomsResponse.data);
    
        
        setError(null);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setError("Failed to load rooms from server. Loading from local storage instead.");
        
        // Fallback to localStorage if API fails
        const storedClassrooms = JSON.parse(localStorage.getItem('availableClassrooms') || '[]');
        
        
        setClassrooms(storedClassrooms);
       
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, []);
  
  // Gérer les changements des champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Gérer les changements pour les fonctionnalités (liste séparée par des virgules)
  const handleFeaturesChange = (e) => {
    setFormData({
      ...formData,
      features: e.target.value
    });
  };
  
  // Gérer la sélection d'image
  const handleImageChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.value
    });
  };
  
  // Ouvrir la modal pour ajouter une nouvelle salle
  const openAddModal = (type) => {
    setModalMode('add');
    setRoomType(type);
    setFormData({
      id: '',
      name: '',
      type: type === 'classroom' ? 'Lecture Hall' : 'study',
      capacity: '',
      features: '',
      availableTimes: '8AM - 9PM',
      image: type === 'classroom' ? '/images/classroom-default.jpg' : '/images/study-room.jpg'
    });
    setShowModal(true);
  };
  
  // Ouvrir la modal pour modifier une salle existante
  const openEditModal = (room, type) => {
    setModalMode('edit');
    setRoomType(type);
    setSelectedRoom(room);
    
    if (type === 'classroom') {
      setFormData({
        id: room.id || '',
        name: room.roomNumber || '',
        type: room.type || '',
        capacity: room.capacity || '',
        features: Array.isArray(room.features) ? room.features.join(', ') : (room.features || ''),
        image: room.image || '/images/classroom-default.jpg'
      });
    } 
    
    setShowModal(true);
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (roomType === 'classroom') {
        await handleClassroomSubmit();
      }
      
      setShowModal(false);
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Failed to save room data. Please try again.");
    }
  };
  
  // Gérer la soumission du formulaire pour les salles de classe
  const handleClassroomSubmit = async () => {
    const featuresList = formData.features.split(',').map(feature => feature.trim());
    
    // Format selon la structure ClassroomDTO de votre backend Java
    const classroomData = {
      id: formData.id || null, // utiliser null au lieu de undefined pour un nouveau classroom
      roomNumber: formData.name,
      type: formData.type,
      capacity: parseInt(formData.capacity),
      features: featuresList,
      image: formData.image // Inclure l'image dans les données
    };
    
    console.log("Données envoyées:", classroomData); // Pour debug
    
    if (modalMode === 'add') {
      try {
        // Utiliser l'API directement
        const response = await API.post('/api/rooms/classrooms', classroomData);
        console.log("Réponse du backend après création:", response.data);
        
        const newClassroom = response.data;
        setClassrooms([...classrooms, newClassroom]);
        
        // Also update localStorage as backup
        const updatedClassrooms = [...classrooms, newClassroom];
        localStorage.setItem('availableClassrooms', JSON.stringify(updatedClassrooms));
        
        alert('Classroom added successfully.');
      } catch (err) {
        console.error("API error details:", err.response || err);
        
        // Fallback: add to localStorage only
        const newClassroom = {
          ...classroomData,
          id: `C${Date.now().toString().substr(-4)}`,
        };
        
        const updatedClassrooms = [...classrooms, newClassroom];
        setClassrooms(updatedClassrooms);
        localStorage.setItem('availableClassrooms', JSON.stringify(updatedClassrooms));
        
        alert('Classroom added to local storage (offline mode).');
      }
    } else {
      try {
        // Utiliser l'API directement
        const response = await API.put(`/api/rooms/classrooms/${selectedRoom.id}`, classroomData);
        console.log("Réponse du backend après mise à jour:", response.data);
        
        const updatedClassroom = response.data;
        
        const updatedClassrooms = classrooms.map(classroom => {
          if (classroom.id === selectedRoom.id) {
            return updatedClassroom;
          }
          return classroom;
        });
        
        setClassrooms(updatedClassrooms);
        
        // Also update localStorage as backup
        localStorage.setItem('availableClassrooms', JSON.stringify(updatedClassrooms));
        
        alert('Classroom updated successfully.');
      } catch (err) {
        console.error("API error details:", err.response || err);
        
        // Fallback: update in localStorage only
        const updatedClassrooms = classrooms.map(classroom => {
          if (classroom.id === selectedRoom.id) {
            return {
              ...classroom,
              roomNumber: formData.name,
              type: formData.type,
              capacity: parseInt(formData.capacity),
              features: featuresList,
              image: formData.image
            };
          }
          return classroom;
        });
        
        setClassrooms(updatedClassrooms);
        localStorage.setItem('availableClassrooms', JSON.stringify(updatedClassrooms));
        
        alert('Classroom updated in local storage (offline mode).');
      }
    }
  };
  

  
  // Gérer la suppression d'une salle
  const handleDeleteRoom = async (id, type) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        if (type === 'classroom') {
          // Utiliser l'API directement
          await API.delete(`/api/rooms/classrooms/${id}`);
          console.log("Classroom deleted on backend:", id);
          
          // Update local state
          const updatedClassrooms = classrooms.filter(classroom => classroom.id !== id);
          setClassrooms(updatedClassrooms);
          
          // Also update localStorage
          localStorage.setItem('availableClassrooms', JSON.stringify(updatedClassrooms));
        } 
        
        alert('Room deleted successfully.');
      } catch (err) {
        console.error("API error details:", err.response || err);
        
        
        
     
      }
    }
  };
  
  // Colonnes pour la table des salles de classe
  const classroomColumns = [
    { header: 'ID', key: 'id' },
    { header: 'Room Number', key: 'roomNumber' },
    { header: 'Type', key: 'type' },
    { header: 'Capacity', key: 'capacity' },
    { 
      header: 'Features', 
      key: 'features',
      render: (features) => Array.isArray(features) ? features.join(', ') : features
    },
    {
      header: 'Image',
      key: 'image',
      render: (image) => image ? (
        <div className="table-image-preview">
          <img src={image} alt="Classroom" width="50" height="40" style={{objectFit: 'cover'}} />
        </div>
      ) : 'No Image'
    },
    {
      header: 'Actions',
      key: 'id',
      render: (id, classroom) => (
        <div className="table-actions">
          <button 
            className="btn-table btn-edit"
            onClick={() => openEditModal(classroom, 'classroom')}
          >
            Edit
          </button>
          <button 
            className="btn-table btn-delete"
            onClick={() => handleDeleteRoom(id, 'classroom')}
          >
            Delete
          </button>
        </div>
      )
    }
  ];
  
  
  
  return (
    <div className="main-content">
      {error && <div className="alert alert-error">{error}</div>}
      
      {/* Section des salles de classe */}
      <div className="section">
        <div className="section-header">
          <h2>Classrooms</h2>
          <button 
            className="btn-primary"
            onClick={() => openAddModal('classroom')}
          >
            <i className="fas fa-plus"></i> Add Classroom
          </button>
        </div>
        
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <Table 
            columns={classroomColumns}
            data={classrooms}
            emptyMessage="No classrooms found"
          />
        )}
      </div>
      
      
      
      {/* Modal pour ajouter/modifier une salle */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={`${modalMode === 'add' ? 'Add' : 'Edit'} ${roomType === 'classroom' }`}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">
              {roomType === 'classroom' ? 'Room Number' : 'Room Name'}
            </label>
            <input 
              type="text" 
              id="name" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="type">Room Type</label>
            <select 
              id="type" 
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              {roomType === 'classroom' ? (
                <>
                  <option value="Lecture Hall">Lecture Hall</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Computer Lab">Computer Lab</option>
                  <option value="Conference Room">Conference Room</option>
                </>
              ) : (
                <>
                  <option value="study">Study Room</option>
                  <option value="computer">Computer Lab</option>
                  <option value="classroom">Classroom</option>
                </>
              )}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="capacity">Capacity</label>
            <input 
              type="number" 
              id="capacity" 
              name="capacity"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="features">Features (comma-separated)</label>
            <input 
              type="text" 
              id="features" 
              name="features"
              value={formData.features}
              onChange={handleFeaturesChange}
              placeholder="e.g., Projector, Whiteboard, Wi-Fi"
              required 
            />
          </div>
          
         
          
          <div className="form-group">
            <label htmlFor="image">Room Image</label>
            <select
              id="image"
              name="image"
              value={formData.image}
              onChange={handleImageChange}
            >
              {roomType === 'classroom' ? (
                <>
                  {defaultImages.map(img => (
                    <option key={img.value} value={img.value}>{img.label}</option>
                  ))}
                  <option value="/images/custom-classroom.jpg">Custom Classroom Image</option>
                </>
              ) : (
                <>
                  <option value="/images/study-room.jpg">Standard Study Room</option>
                  <option value="/images/group-study.jpg">Group Study Room</option>
                  <option value="/images/library-study.jpg">Library Study Space</option>
                  <option value="/images/computer-lab.jpg">Computer Lab</option>
                </>
              )}
            </select>
          </div>
          
          {/* Image preview */}
          <div className="form-group">
            <label>Image Preview</label>
            <div className="image-preview">
              {formData.image ? (
                <img 
                  src={formData.image} 
                  alt={roomType === 'classroom' ? 'Classroom' : 'Study Room'} 
                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '150px', objectFit: 'cover' }}
                />
              ) : (
                <div className="no-image">No image selected</div>
              )}
            </div>
          </div>
          
          {/* Custom URL input option */}
          <div className="form-group">
            <label htmlFor="custom-image">Or enter custom image URL</label>
            <input 
              type="text" 
              id="custom-image" 
              placeholder="https://example.com/image.jpg"
              value={formData.image.startsWith('http') ? formData.image : ''}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
            />
            <small className="form-hint">Enter a custom URL if you want to use an external image</small>
          </div>
          
          <button type="submit" className="btn-primary">
            {modalMode === 'add' ? 'Add' : 'Update'} {roomType === 'classroom' ? 'Classroom' : 'Study Room'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminClassrooms;