document.addEventListener('DOMContentLoaded', () => {
    const addForm = document.getElementById('add-form');
    const modal = document.getElementById('add-modal');

    // Обработчик отправки формы
    addForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Получаем имя таблицы
        const tableName = document.getElementById('table-title').textContent;
        if (tableName === 'Select a table') {
            alert('Please select a table first.');
            return;
        }

        // Собираем данные из формы
        const formData = new FormData(addForm);
        const rowData = {};

        formData.forEach((value, key) => {
            rowData[key] = value;
        });

        // Получаем параметры подключения из localStorage
        const host = localStorage.getItem('host');
        const port = localStorage.getItem('port');
        const dbName = localStorage.getItem('dbName');
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');

        // Формируем запрос на сервер
        const requestData = {
            host,
            port: Number(port),
            dbName,
            username,
            password,
            tableName,
            rowData
        };

        try {
            const response = await fetch('/api/add-row', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                alert('Row added successfully.');
                window.location.reload(); // Обновляем страницу для отображения новой строки
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            alert(`Network error: ${error.message}`);
        } finally {
            // Закрываем модальное окно после отправки
            modal.style.display = 'none';
        }
    });
});