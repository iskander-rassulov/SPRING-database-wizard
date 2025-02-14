document.addEventListener('DOMContentLoaded', () => {
    const dbInfoElement = document.querySelector('.db-info h2');
    const tablesListElement = document.querySelector('.tables-list');
    const tableContainer = document.querySelector('.table-container');
    const switchDbButton = document.querySelector('.switch-db');

    // Считываем данные подключения из localStorage
    const host = localStorage.getItem('host');
    const port = localStorage.getItem('port');
    const dbName = localStorage.getItem('dbName');
    const username = localStorage.getItem('username');
    const password = localStorage.getItem('password');

    // Отображаем имя базы
    if (dbName) {
        dbInfoElement.textContent = dbName;
    }

    // Пример: если список таблиц уже загружен и вставлен в <ul> .tables-list,
    // то мы можем навесить обработчики клика.
    // (Если список загружается динамически, то нужно делать это после его формирования.)
    tablesListElement.addEventListener('click', (event) => {
        // Проверяем, кликнули ли именно по <li>
        if (event.target && event.target.tagName === 'LI') {
            const selectedTable = event.target.textContent.trim();
            fetchTableData(selectedTable);
        }
    });

    // Функция, отправляющая запрос на сервер для получения данных выбранной таблицы
    async function fetchTableData(tableName) {
        // Очищаем контейнер перед загрузкой новых данных
        tableContainer.innerHTML = '<p>Loading table data...</p>';

        try {
            // Формируем объект с данными подключения и именем таблицы
            const requestData = {
                host,
                port: Number(port),
                dbName,
                username,
                password,
                tableName // добавляем имя таблицы
            };

            // Отправляем запрос к нашему TableController
            const response = await fetch('/api/table-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            // Ответ — массив объектов (каждый объект — строка таблицы)
            const rows = await response.json();

            // Генерируем и вставляем HTML-таблицу
            renderTable(rows);
        } catch (error) {
            tableContainer.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
        }
    }

    // Функция генерации HTML-таблицы на основе массива строк (объектов)
    function renderTable(dataRows) {
        // Если пусто, выведем сообщение
        if (!dataRows || dataRows.length === 0) {
            tableContainer.innerHTML = '<p>No data found.</p>';
            return;
        }

        // Получаем список ключей (столбцов) из первой строки
        const columns = Object.keys(dataRows[0]);

        // Создаём элементы table, thead, tbody
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Шапка таблицы
        const trHead = document.createElement('tr');
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        // Тело таблицы
        dataRows.forEach(row => {
            const tr = document.createElement('tr');
            columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = row[col] !== null ? row[col] : '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        // Складываем всё вместе
        table.appendChild(thead);
        table.appendChild(tbody);

        // Очищаем контейнер и вставляем таблицу
        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);
    }

    // Переключение базы (возвращаемся к форме)
    switchDbButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});
