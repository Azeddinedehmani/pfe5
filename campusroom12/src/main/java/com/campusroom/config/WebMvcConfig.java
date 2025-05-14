package com.campusroom.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:./uploads/images}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Handle static resources from classpath:/static/
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/");
        
        // Handle uploaded images
        exposeDirectory(uploadDir, registry);
    }
    
    private void exposeDirectory(String dirName, ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(dirName).toAbsolutePath().normalize();
        String uploadAbsolutePath = uploadPath.toString().replace("\\", "/");
        
        if (!uploadAbsolutePath.endsWith("/")) {
            uploadAbsolutePath += "/";
        }
        
        // Create the URL mapping pattern that maps directly to the physical location
        registry.addResourceHandler("/images/uploads/**")
                .addResourceLocations("file:" + uploadAbsolutePath);
        
        System.out.println("Configured resource handler: /images/uploads/** -> " + uploadAbsolutePath);
    }
}