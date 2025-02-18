document.addEventListener("DOMContentLoaded", function () {
    const deleteButton = document.getElementById("delete-button");

    // Слушаем клик на кнопку "Delete"
    deleteButton.addEventListener("click", function() {
        // Изменяем текст кнопки
        deleteButton.textContent = "Cancel Deletion";
        deleteButton.id = "cancel-delete-button"; // Меняем id кнопки

        // Добавляем новый столбец с кнопкой удаления
        addDeleteColumn();
    });

    // Функция для добавления столбца с кнопкой удаления в таблицу
    function addDeleteColumn() {
        const table = document.querySelector("table"); // Предполагаем, что таблица есть на странице
        const rows = table.querySelectorAll("tr");

        // Добавляем столбец с кнопкой "Delete" в каждую строку
        rows.forEach(row => {
            const deleteCell = row.insertCell();
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.classList.add("delete-row-button");

            deleteButton.addEventListener("click", function() {
                // Логика удаления строки
                row.remove();
                // Можно добавить здесь запрос на сервер для удаления записи
            });

            deleteCell.appendChild(deleteButton);
        });
    }

    // Слушаем клик на "Cancel Deletion" для отмены изменений
    document.addEventListener("click", function(event) {
        if (event.target.id === "cancel-delete-button") {
            // Изменяем кнопку обратно на "Delete"
            deleteButton.textContent = "Delete";
            deleteButton.id = "delete-button";

            // Удаляем добавленные столбцы с кнопками удаления
            removeDeleteColumn();
        }
    });

    // Функция для удаления добавленных столбцов с кнопками
    function removeDeleteColumn() {
        const table = document.querySelector("table");
        const rows = table.querySelectorAll("tr");

        rows.forEach(row => {
            if (row.cells.length > 1) { // Удаляем только добавленные ячейки
                row.deleteCell(-1);
            }
        });
    }
});
