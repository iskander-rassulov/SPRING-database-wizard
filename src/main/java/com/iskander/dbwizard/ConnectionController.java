package com.iskander.dbwizard;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@RestController
@RequestMapping("/api")
@Validated
public class ConnectionController {

    @PostMapping("/connect")
    public ResponseEntity<String> connect(@Valid @RequestBody ConnectionRequest request) {
        // Формирование JDBC URL
        String url = String.format("jdbc:postgresql://%s:%d/%s",
                request.getHost(),
                request.getPort(),
                request.getDbName());

        // Пример проверки подключения
        try (Connection conn = DriverManager.getConnection(url, request.getUsername(), request.getPassword())) {
            // Если соединение успешно
            return ResponseEntity.ok("Подключение успешно: " + url);
        } catch (SQLException e) {
            // Если произошла ошибка подключения
            return ResponseEntity.badRequest()
                    .body("Ошибка подключения: " + e.getMessage());
        }
    }

    // DTO для приёма данных
    public static class ConnectionRequest {
        @NotBlank(message = "Host не может быть пустым")
        private String host;

        @Min(value = 1, message = "Некорректный порт")
        @Max(value = 65535, message = "Некорректный порт")
        private int port;

        @NotBlank(message = "Имя базы данных не может быть пустым")
        private String dbName;

        @NotBlank(message = "Имя пользователя не может быть пустым")
        private String username;

        @NotBlank(message = "Пароль не может быть пустым")
        private String password;

        // Getters и Setters

        public String getHost() {
            return host;
        }

        public void setHost(String host) {
            this.host = host;
        }

        public int getPort() {
            return port;
        }

        public void setPort(int port) {
            this.port = port;
        }

        public String getDbName() {
            return dbName;
        }

        public void setDbName(String dbName) {
            this.dbName = dbName;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}
