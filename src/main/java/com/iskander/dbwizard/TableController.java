package com.iskander.dbwizard;

import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.sql.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class TableController {

    @PostMapping("/table-data")
    public List<Map<String, Object>> getTableData(@Valid @RequestBody TableRequest request) throws SQLException {
        String url = String.format("jdbc:postgresql://%s:%d/%s",
                request.getHost(),
                request.getPort(),
                request.getDbName());

        // Подключаемся к БД на основе переданных параметров
        try (Connection conn = DriverManager.getConnection(url, request.getUsername(), request.getPassword())) {
            String tableName = request.getTableName();

            // Простейший запрос: SELECT * FROM tableName
            // В реальном приложении может понадобиться экранировать/проверять имя таблицы во избежание SQL Injection
            String sql = "SELECT * FROM " + tableName;

            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {

                // Парсим ResultSet в список map'ов
                List<Map<String, Object>> rows = new ArrayList<>();
                ResultSetMetaData meta = rs.getMetaData();
                int columnCount = meta.getColumnCount();

                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        String columnName = meta.getColumnLabel(i);
                        Object value = rs.getObject(i);
                        row.put(columnName, value);
                    }
                    rows.add(row);
                }
                return rows;
            }
        }
    }

    // DTO с параметрами подключения + имя таблицы
    public static class TableRequest extends ConnectionController.ConnectionRequest {
        private String tableName;

        public String getTableName() {
            return tableName;
        }

        public void setTableName(String tableName) {
            this.tableName = tableName;
        }
    }
}

