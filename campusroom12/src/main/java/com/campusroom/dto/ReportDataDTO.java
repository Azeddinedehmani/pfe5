package com.campusroom.dto;

import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ReportDataDTO {
    private Map<String, Object> statistics;
    private List<PopularRoomDTO> popularRooms;
    private List<ActiveUserDTO> activeUsers;
    private List<MonthlyActivityDTO> monthlyActivity;

    // Only keep one constructor
    public ReportDataDTO(Map<String, Object> statistics, List<PopularRoomDTO> popularRooms, 
                         List<ActiveUserDTO> activeUsers, List<MonthlyActivityDTO> monthlyActivity) {
        this.statistics = statistics;
        this.popularRooms = popularRooms;
        this.activeUsers = activeUsers;
        this.monthlyActivity = monthlyActivity;
    }

    public static ReportDataDTOBuilder builder() {
        return new ReportDataDTOBuilder();
    }

    public static class ReportDataDTOBuilder {
        private Map<String, Object> statistics;
        private List<PopularRoomDTO> popularRooms;
        private List<ActiveUserDTO> activeUsers;
        private List<MonthlyActivityDTO> monthlyActivity;

        public ReportDataDTOBuilder statistics(Map<String, Object> statistics) {
            this.statistics = statistics;
            return this;
        }

        public ReportDataDTOBuilder popularRooms(List<PopularRoomDTO> popularRooms) {
            this.popularRooms = popularRooms;
            return this;
        }

        public ReportDataDTOBuilder activeUsers(List<ActiveUserDTO> activeUsers) {
            this.activeUsers = activeUsers;
            return this;
        }

        public ReportDataDTOBuilder monthlyActivity(List<MonthlyActivityDTO> monthlyActivity) {
            this.monthlyActivity = monthlyActivity;
            return this;
        }

        public ReportDataDTO build() {
            return new ReportDataDTO(statistics, popularRooms, activeUsers, monthlyActivity);
        }
    }

    @Data
    @NoArgsConstructor
    public static class PopularRoomDTO {
        private String room;
        private long count;
        private double percentage;

        // Only keep one constructor
        public PopularRoomDTO(String room, long count, double percentage) {
            this.room = room;
            this.count = count;
            this.percentage = percentage;
        }

        public static PopularRoomDTOBuilder builder() {
            return new PopularRoomDTOBuilder();
        }

        public static class PopularRoomDTOBuilder {
            private String room;
            private long count;
            private double percentage;

            public PopularRoomDTOBuilder room(String room) {
                this.room = room;
                return this;
            }

            public PopularRoomDTOBuilder count(long count) {
                this.count = count;
                return this;
            }

            public PopularRoomDTOBuilder percentage(double percentage) {
                this.percentage = percentage;
                return this;
            }

            public PopularRoomDTO build() {
                return new PopularRoomDTO(room, count, percentage);
            }
        }
    }

    @Data
    @NoArgsConstructor
    public static class ActiveUserDTO {
        private String userId;
        private String userName;
        private String role;
        private long count;

        // Only keep one constructor
        public ActiveUserDTO(String userId, String userName, String role, long count) {
            this.userId = userId;
            this.userName = userName;
            this.role = role;
            this.count = count;
        }

        public static ActiveUserDTOBuilder builder() {
            return new ActiveUserDTOBuilder();
        }

        public static class ActiveUserDTOBuilder {
            private String userId;
            private String userName;
            private String role;
            private long count;

            public ActiveUserDTOBuilder userId(String userId) {
                this.userId = userId;
                return this;
            }

            public ActiveUserDTOBuilder userName(String userName) {
                this.userName = userName;
                return this;
            }

            public ActiveUserDTOBuilder role(String role) {
                this.role = role;
                return this;
            }

            public ActiveUserDTOBuilder count(long count) {
                this.count = count;
                return this;
            }

            public ActiveUserDTO build() {
                return new ActiveUserDTO(userId, userName, role, count);
            }
        }
    }

    @Data
    @NoArgsConstructor
    public static class MonthlyActivityDTO {
        private String month;
        private int professorCount;
        private int studentCount;
        private int total;

        // Only keep one constructor
        public MonthlyActivityDTO(String month, int professorCount, int studentCount, int total) {
            this.month = month;
            this.professorCount = professorCount;
            this.studentCount = studentCount;
            this.total = total;
        }

        public static MonthlyActivityDTOBuilder builder() {
            return new MonthlyActivityDTOBuilder();
        }

        public static class MonthlyActivityDTOBuilder {
            private String month;
            private int professorCount;
            private int studentCount;
            private int total;

            public MonthlyActivityDTOBuilder month(String month) {
                this.month = month;
                return this;
            }

            public MonthlyActivityDTOBuilder professorCount(int professorCount) {
                this.professorCount = professorCount;
                return this;
            }

            public MonthlyActivityDTOBuilder studentCount(int studentCount) {
                this.studentCount = studentCount;
                return this;
            }

            public MonthlyActivityDTOBuilder total(int total) {
                this.total = total;
                return this;
            }

            public MonthlyActivityDTO build() {
                return new MonthlyActivityDTO(month, professorCount, studentCount, total);
            }
        }
    }
}