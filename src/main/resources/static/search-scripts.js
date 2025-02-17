document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('#search-input');
    const tableContainer = document.querySelector('.table-container');

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        const currentTable = localStorage.getItem('currentTable');

        if (!currentTable) {
            tableContainer.innerHTML = '<p>Пожалуйста, сначала выберите таблицу!</p>';
            return;
        }

        if (query.length > 0) {
            fetchSearchResults(query, currentTable);
        } else {
            // Если поле поиска пустое, загружаем исходные данные таблицы
            reloadTableData(currentTable);
        }
    });

    async function fetchSearchResults(query, tableName) {
        tableContainer.innerHTML = '<p>Поиск...</p>';

        try {
            const requestData = {
                host: localStorage.getItem('host'),
                port: Number(localStorage.getItem('port')),
                dbName: localStorage.getItem('dbName'),
                username: localStorage.getItem('username'),
                password: localStorage.getItem('password'),
                tableName: tableName,
                query: query
            };

            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Search error:', errorText);

                // User-friendly error message
                if (errorText.includes('оператор не существует')) {
                    tableContainer.innerHTML = '<p style="color:orange;">Поиск для некоторых колонок не поддерживается. ' +
                    'Пробуйте другие поисковые запросы или обратитесь к администратору.</p>';
                } else {
                    tableContainer.innerHTML = `<p style="color:red;">Ошибка поиска: ${errorText}</p>`;
                }
                return;
            }

            const results = await response.json();

            if (results.length === 0) {
                tableContainer.innerHTML = '<p>Результатов не найдено.</p>';
                return;
            }

            renderTable(results);
        } catch (error) {
            tableContainer.innerHTML = `<p style="color:red;">Ошибка: ${error.message}</p>`;
            console.error('Search error:', error);
        }
    }

    // Function to reload table data
    async function reloadTableData(tableName) {
        try {
            const requestData = {
                host: localStorage.getItem('host'),
                port: Number(localStorage.getItem('port')),
                dbName: localStorage.getItem('dbName'),
                username: localStorage.getItem('username'),
                password: localStorage.getItem('password'),
                tableName: tableName
            };

            const response = await fetch('/api/table-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const rows = await response.json();
            renderTable(rows);
        } catch (error) {
            tableContainer.innerHTML = `<p style="color:red;">Ошибка загрузки данных: ${error.message}</p>`;
        }
    }

    function renderTable(dataRows) {
        if (!dataRows || dataRows.length === 0) {
            tableContainer.innerHTML = '<p>Данные не найдены.</p>';
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
});