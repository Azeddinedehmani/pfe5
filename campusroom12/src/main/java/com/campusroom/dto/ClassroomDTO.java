package com.campusroom.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomDTO {

    private String id;
    private String roomNumber;
    private String type;
    private int capacity;
    private List<String> features;
    private String image;

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public String getType() {
        return type;
    }

    public int getCapacity() {
        return capacity;
    }

    public List<String> getFeatures() {
        return features;
    }

    // Setters
    public void setId(String id) {
        this.id = id;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public void setFeatures(List<String> features) {
        this.features = features;
    }

    // Implémentation manuelle du builder
    public static ClassroomDTOBuilder builder() {
        return new ClassroomDTOBuilder();
    }

    public static class ClassroomDTOBuilder {

        private String id;
        private String roomNumber;
        private String type;
        private int capacity;
        private String image;
        private List<String> features;

        public ClassroomDTOBuilder id(String id) {
            this.id = id;
            return this;
        }

        public ClassroomDTOBuilder roomNumber(String roomNumber) {
            this.roomNumber = roomNumber;
            return this;
        }

        public ClassroomDTOBuilder type(String type) {
            this.type = type;
            return this;
        }

        public ClassroomDTOBuilder capacity(int capacity) {
            this.capacity = capacity;
            return this;
        }

        public ClassroomDTOBuilder features(List<String> features) {
            this.features = features;
            return this;
        }
        public ClassroomDTOBuilder image(String image) {
    this.image = image;
    return this;
}

        public ClassroomDTO build() {
    ClassroomDTO classroomDTO = new ClassroomDTO();
    classroomDTO.setId(this.id);
    classroomDTO.setRoomNumber(this.roomNumber);
    classroomDTO.setType(this.type);
    classroomDTO.setCapacity(this.capacity);
    classroomDTO.setFeatures(this.features);
    classroomDTO.setImage(this.image); // Ajout de la configuration de l'image
    return classroomDTO;
}
    }
}
