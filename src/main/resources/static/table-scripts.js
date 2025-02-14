document.addEventListener('DOMContentLoaded', () => {
    const dbInfoElement = document.querySelector('.db-info h2');
    const tablesListElement = document.querySelector('.tables-list');
    const tableContainer = document.querySelector('.table-container');
    const tableTitle = document.querySelector('#table-title'); // Заголовок таблицы
    const switchDbButton = document.querySelector('.switch-db');

    // Считываем данные подключения из localStorage
    const host = localStorage.getItem('host');
    const port = localStorage.getItem('port');
    const dbName = localStorage.getItem('dbName');
    const username = localStorage.getItem('username');
    const password = localStorage.getItem('password');

    // Отображаем имя базы данных
    if (dbName) {
        dbInfoElement.textContent = dbName;
    }

    // Добавляем обработчик клика по таблицам
    tablesListElement.addEventListener('click', (event) => {
        if (event.target && event.target.tagName === 'LI') {
            const selectedTable = event.target.textContent.trim();
            tableTitle.textContent = selectedTable; // Обновляем заголовок таблицы
            fetchTableData(selectedTable);
        }
    });

    // Функция запроса данных таблицы
    async function fetchTableData(tableName) {
        tableContainer.innerHTML = '<p>Loading table data...</p>';

        try {
            const requestData = {
                host,
                port: Number(port),
                dbName,
                username,
                password,
                tableName
            };

            const response = await fetch('/api/table-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            const rows = await response.json();
            renderTable(rows);
        } catch (error) {
            tableContainer.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
        }
    }

    // Функция рендера HTML-таблицы
    function renderTable(dataRows) {
        if (!dataRows || dataRows.length === 0) {
            tableContainer.innerHTML = '<p>No data found.</p>';
            return;
        }

        const columns = Object.keys(dataRows[0]);
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const trHead = document.createElement('tr');
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        dataRows.forEach(row => {
            const tr = document.createElement('tr');
            columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = row[col] !== null ? row[col] : '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);

        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);
    }

    // Кнопка смены базы данных
    switchDbButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});
