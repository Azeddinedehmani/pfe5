package com.campusroom.security;

import com.campusroom.model.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L;
   
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    
    @JsonIgnore
    private String password;
    
    private Collection<? extends GrantedAuthority> authorities;

    // Constructeur complet
    public UserDetailsImpl(Long id, String firstName, String lastName, String email, 
                          String role, String password, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
        this.password = password;
        this.authorities = authorities;
    }
    
    // Constructeur par défaut
    public UserDetailsImpl() {
    }

    // Méthode statique pour créer un Builder
    public static UserDetailsImplBuilder builder() {
        return new UserDetailsImplBuilder();
    }

    // Classe Builder interne statique
    public static class UserDetailsImplBuilder {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String role;
        private String password;
        private Collection<? extends GrantedAuthority> authorities;

        private UserDetailsImplBuilder() {
        }

        public UserDetailsImplBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public UserDetailsImplBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public UserDetailsImplBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public UserDetailsImplBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserDetailsImplBuilder role(String role) {
            this.role = role;
            return this;
        }

        public UserDetailsImplBuilder password(String password) {
            this.password = password;
            return this;
        }

        public UserDetailsImplBuilder authorities(Collection<? extends GrantedAuthority> authorities) {
            this.authorities = authorities;
            return this;
        }

        public UserDetailsImpl build() {
            return new UserDetailsImpl(id, firstName, lastName, email, role, password, authorities);
        }
    }

    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = List.of(
            new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );
        
        return UserDetailsImpl.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .password(user.getPassword())
                .role(user.getRole().name())
                .authorities(authorities)
                .build();
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}