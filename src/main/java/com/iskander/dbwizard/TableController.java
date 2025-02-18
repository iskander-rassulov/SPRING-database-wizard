package com.iskander.dbwizard;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class TableController {

    @PostMapping("/table-data")
    public List<Map<String, Object>> getTableData(@RequestBody TableRequest request) throws SQLException {
        String url = String.format("jdbc:postgresql://%s:%d/%s",
                request.getHost(),
                request.getPort(),
                request.getDbName());

        try (Connection conn = DriverManager.getConnection(url, request.getUsername(), request.getPassword())) {
            String tableName = request.getTableName();
            String sql = "SELECT * FROM " + tableName;

            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {

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

    @PostMapping("/update-cell")
    public ResponseEntity<?> updateCell(@RequestBody UpdateCellRequest request) {
        String url = String.format("jdbc:postgresql://%s:%d/%s",
                request.getHost(),
                request.getPort(),
                request.getDbName());

        try (Connection conn = DriverManager.getConnection(url, request.getUsername(), request.getPassword())) {

            String primaryKey = getPrimaryKeyColumn(conn, request.getTableName());
            if (primaryKey == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Primary key not found.");
            }

            String sql = "UPDATE " + request.getTableName() +
                    " SET " + request.getColumnName() + " = ? " +
                    " WHERE " + primaryKey + " = ?";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, request.getNewValue());

                if (isPrimaryKeyInteger(conn, request.getTableName(), primaryKey)) {
                    stmt.setInt(2, Integer.parseInt(request.getRowId()));
                } else {
                    stmt.setString(2, request.getRowId());
                }

                int rowsUpdated = stmt.executeUpdate();
                if (rowsUpdated == 0) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Row not found.");
                }
                return ResponseEntity.ok("Cell updated successfully.");
            }
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid primary key format.");
        } catch (SQLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Database error: " + e.getMessage());
        }
    }

    private String getPrimaryKeyColumn(Connection conn, String tableName) throws SQLException {
        String sql = "SELECT a.attname AS column_name " +
                "FROM pg_index i " +
                "JOIN pg_attribute a ON a.attrelid = i.indrelid " +
                "AND a.attnum = ANY(i.indkey) " +
                "WHERE i.indrelid = '" + tableName + "'::regclass " +
                "AND i.indisprimary";

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                return rs.getString("column_name");
            }
        }
        return null;
    }

    private boolean isPrimaryKeyInteger(Connection conn, String tableName, String primaryKey) throws SQLException {
        String sql = "SELECT data_type FROM information_schema.columns " +
                "WHERE table_name = ? AND column_name = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, tableName);
            stmt.setString(2, primaryKey);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String dataType = rs.getString("data_type");
                    return dataType.equals("integer") || dataType.equals("bigint") || dataType.equals("smallint");
                }
            }
        }
        return false;
    }

    public static class TableRequest {
        private String host;
        private int port;
        private String dbName;
        private String username;
        private String password;
        private String tableName;

        public TableRequest() {
        }

        // Getters and Setters
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

        public String getTableName() {
            return tableName;
        }

        public void setTableName(String tableName) {
            this.tableName = tableName;
        }
    }

    public static class UpdateCellRequest extends TableRequest {
        private String columnName;
        private String rowId;
        private String newValue;

        public String getColumnName() {
            return columnName;
        }

        public void setColumnName(String columnName) {
            this.columnName = columnName;
        }

        public String getRowId() {
            return rowId;
        }

        public void setRowId(String rowId) {
            this.rowId = rowId;
        }

        public String getNewValue() {
            return newValue;
        }

        public void setNewValue(String newValue) {
            this.newValue = newValue;
        }
    }

    public static class SearchRequest extends TableRequest {
        private String query;

        public SearchRequest() {}

        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchTableData(@RequestBody SearchRequest request) {
        String url = String.format("jdbc:postgresql://%s:%d/%s",
                request.getHost(), request.getPort(), request.getDbName());

        try (Connection conn = DriverManager.getConnection(url, request.getUsername(), request.getPassword())) {
            String tableName = request.getTableName();
            String queryPattern = "%" + request.getQuery() + "%";

            // Get columns with their data types
            List<ColumnInfo> columns = getTableColumnsWithTypes(conn, tableName);
            if (columns.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Таблица не найдена или пуста.");
            }

            // Build WHERE clause based on column types
            StringBuilder whereClause = new StringBuilder();
            List<String> textColumns = new ArrayList<>();

            for (ColumnInfo column : columns) {
                if (isTextType(column.dataType)) {
                    if (textColumns.isEmpty()) {
                        whereClause.append(column.name).append(" ILIKE ?");
                    } else {
                        whereClause.append(" OR ").append(column.name).append(" ILIKE ?");
                    }
                    textColumns.add(column.name);
                } else if (isNumericType(column.dataType) && isNumeric(request.getQuery())) {
                    // Only add numeric comparison if the search query is a valid number
                    if (whereClause.length() > 0) {
                        whereClause.append(" OR ");
                    }
                    whereClause.append(column.name).append(" = ?");
                    textColumns.add(column.name); // Using same list to track parameters
                }
            }

            if (textColumns.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList()); // No matching columns
            }

            String sql = "SELECT * FROM " + tableName + " WHERE " + whereClause;

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                int paramIndex = 1;
                for (String column : textColumns) {
                    ColumnInfo info = columns.stream()
                            .filter(c -> c.name.equals(column))
                            .findFirst()
                            .orElse(null);

                    if (info != null) {
                        if (isTextType(info.dataType)) {
                            stmt.setString(paramIndex++, queryPattern);
                        } else if (isNumericType(info.dataType) && isNumeric(request.getQuery())) {
                            try {
                                stmt.setDouble(paramIndex++, Double.parseDouble(request.getQuery()));
                            } catch (NumberFormatException e) {
                                // Skip this parameter if parsing fails
                            }
                        }
                    }
                }

                try (ResultSet rs = stmt.executeQuery()) {
                    List<Map<String, Object>> results = new ArrayList<>();
                    ResultSetMetaData metaData = rs.getMetaData();
                    int columnCount = metaData.getColumnCount();

                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        for (int i = 1; i <= columnCount; i++) {
                            row.put(metaData.getColumnName(i), rs.getObject(i));
                        }
                        results.add(row);
                    }
                    return ResponseEntity.ok(results);
                }
            }
        } catch (SQLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ошибка поиска: " + e.getMessage());
        }
    }

    // Helper class to store column info
    private static class ColumnInfo {
        String name;
        String dataType;

        ColumnInfo(String name, String dataType) {
            this.name = name;
            this.dataType = dataType;
        }
    }

    // Get columns with their data types
    private List<ColumnInfo> getTableColumnsWithTypes(Connection conn, String tableName) throws SQLException {
        List<ColumnInfo> columns = new ArrayList<>();
        String sql = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, tableName);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    columns.add(new ColumnInfo(
                            rs.getString("column_name"),
                            rs.getString("data_type")
                    ));
                }
            }
        }
        return columns;
    }

    // Check if column type is text-like
    private boolean isTextType(String dataType) {
        return dataType.contains("char") || dataType.contains("text") ||
                dataType.equalsIgnoreCase("varchar") || dataType.equalsIgnoreCase("json") ||
                dataType.equalsIgnoreCase("jsonb") || dataType.equalsIgnoreCase("name");
    }

    // Check if column type is numeric
    private boolean isNumericType(String dataType) {
        return dataType.contains("int") || dataType.contains("float") ||
                dataType.contains("double") || dataType.contains("decimal") ||
                dataType.contains("numeric") || dataType.contains("real");
    }

    // Check if string can be parsed as a number
    private boolean isNumeric(String str) {
        if (str == null || str.isEmpty()) {
            return false;
        }
        try {
            Double.parseDouble(str);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    @PostMapping("/table-columns")
    public ResponseEntity<?> getTableColumns(@RequestBody TableRequest request) {
        String url = String.format("jdbc:postgresql://%s:%d/%s",
                request.getHost(),
                request.getPort(),
                request.getDbName());

        try (Connection conn = DriverManager.getConnection(url, request.getUsername(), request.getPassword())) {
            String tableName = request.getTableName();
            String sql = "SELECT column_name, data_type, column_default, is_nullable " +
                    "FROM information_schema.columns " +
                    "WHERE table_name = ?";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, tableName);

                try (ResultSet rs = stmt.executeQuery()) {
                    List<Map<String, String>> columns = new ArrayList<>();
                    while (rs.next()) {
                        Map<String, String> column = new HashMap<>();
                        column.put("name", rs.getString("column_name"));
                        column.put("dataType", rs.getString("data_type"));
                        column.put("defaultValue", rs.getString("column_default"));
                        column.put("isNullable", rs.getString("is_nullable"));

                        // Проверяем, является ли колонка авто-добавляемой
                        boolean isAutoGenerated = rs.getString("column_default") != null &&
                                (rs.getString("column_default").contains("nextval") ||
                                        rs.getString("column_default").contains("GENERATED"));
                        column.put("isAutoGenerated", String.valueOf(isAutoGenerated));

                        columns.add(column);
                    }
                    return ResponseEntity.ok(columns);
                }
            }
        } catch (SQLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Database error: " + e.getMessage());
        }
    }

    @PostMapping("/add-row")
    public ResponseEntity<?> addRow(@RequestBody AddRowRequest request) {
        String url = String.format("jdbc:postgresql://%s:%d/%s",
                request.getHost(),
                request.getPort(),
                request.getDbName());

        try (Connection conn = DriverManager.getConnection(url, request.getUsername(), request.getPassword())) {
            String tableName = request.getTableName();
            Map<String, String> rowData = request.getRowData();

            // Формируем SQL-запрос для вставки новой строки
            StringBuilder sql = new StringBuilder("INSERT INTO " + tableName + " (");
            StringBuilder values = new StringBuilder("VALUES (");

            for (Map.Entry<String, String> entry : rowData.entrySet()) {
                sql.append(entry.getKey()).append(", ");
                values.append("?, ");
            }

            sql.delete(sql.length() - 2, sql.length()); // Убираем последнюю запятую
            values.delete(values.length() - 2, values.length()); // Убираем последнюю запятую

            sql.append(") ").append(values).append(")");

            try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
                int index = 1;
                for (Map.Entry<String, String> entry : rowData.entrySet()) {
                    String columnName = entry.getKey();
                    String value = entry.getValue();

                    // Определяем тип данных столбца
                    String dataType = getColumnDataType(conn, tableName, columnName);

                    // Устанавливаем значение в зависимости от типа данных
                    switch (dataType) {
                        case "integer":
                        case "bigint":
                        case "smallint":
                            stmt.setInt(index++, Integer.parseInt(value));
                            break;
                        case "boolean":
                            stmt.setBoolean(index++, Boolean.parseBoolean(value));
                            break;
                        case "date":
                            stmt.setDate(index++, java.sql.Date.valueOf(value));
                            break;
                        default:
                            stmt.setString(index++, value);
                            break;
                    }
                }

                int rowsInserted = stmt.executeUpdate();
                if (rowsInserted > 0) {
                    return ResponseEntity.ok("Row added successfully.");
                } else {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to add row.");
                }
            }
        } catch (SQLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Database error: " + e.getMessage());
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid number format.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid date format.");
        }
    }

    private String getColumnDataType(Connection conn, String tableName, String columnName) throws SQLException {
        String sql = "SELECT data_type FROM information_schema.columns WHERE table_name = ? AND column_name = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, tableName);
            stmt.setString(2, columnName);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("data_type");
                }
            }
        }
        return "text"; // По умолчанию возвращаем текст
    }

    public static class AddRowRequest extends TableRequest {
        private Map<String, String> rowData;

        public Map<String, String> getRowData() {
            return rowData;
        }

        public void setRowData(Map<String, String> rowData) {
            this.rowData = rowData;
        }
    }
}