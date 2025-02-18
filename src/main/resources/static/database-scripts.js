document.addEventListener('DOMContentLoaded', () => {
    const switchDbButton = document.querySelector('.switch-db');
    const dbInfoElement = document.querySelector('.db-info h2');
    const tablesListElement = document.querySelector('.tables-list');

    const addButton = document.getElementById('add-button');
    const modal = document.getElementById('add-modal');
    const closeModalButton = document.querySelector('.close-modal');
    const formFields = document.getElementById('form-fields');

    // Считываем параметры подключения из localStorage
    const host = localStorage.getItem('host');
    const port = localStorage.getItem('port');
    const dbName = localStorage.getItem('dbName');
    const username = localStorage.getItem('username');
    const password = localStorage.getItem('password');

    // Отобразим имя базы
    if (dbName) {
        dbInfoElement.textContent = dbName;
    }

    // Запросим список таблиц
    async function fetchTables() {
        const requestData = { host, port: Number(port), dbName, username, password };

        try {
            const response = await fetch('/api/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const tableNames = await response.json();
                tablesListElement.innerHTML = ''; // Очищаем перед добавлением новых элементов

                tableNames.forEach(name => {
                    const li = document.createElement('li');
                    li.textContent = name.trim(); // Убираем лишние пробелы
                    li.title = name; // Показывает полное имя при наведении
                    tablesListElement.appendChild(li);
                });
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            alert(`Network error: ${error.message}`);
        }
    }


    fetchTables();

    async function fetchTableColumns(tableName) {
        const host = localStorage.getItem('host');
        const port = localStorage.getItem('port');
        const dbName = localStorage.getItem('dbName');
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');

        const requestData = { host, port: Number(port), dbName, username, password, tableName };

        try {
            const response = await fetch('/api/table-columns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                return await response.json();
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText}`);
                return [];
            }
        } catch (error) {
            alert(`Network error: ${error.message}`);
            return [];
        }
    }

    // Обработка нажатия на "Switch Database"
    switchDbButton.addEventListener('click', () => {
        // Возвращаемся на форму, например, index.html
        window.location.href = 'index.html';
    });

    // Открываем модальное окно при нажатии на кнопку "Add"
    addButton.addEventListener('click', async () => {
        // Очищаем предыдущие поля
        formFields.innerHTML = '';

        // Получаем текущую таблицу
        const tableName = document.getElementById('table-title').textContent;
        if (tableName === 'Select a table') {
            alert('Please select a table first.');
            return;
        }

        // Запрашиваем колонки таблицы
        const columns = await fetchTableColumns(tableName);
        if (columns.length === 0) {
            alert('Failed to fetch table columns.');
            return;
        }

        // Динамически создаем поля для ввода данных
        columns.forEach(column => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';

            const label = document.createElement('label');
            label.textContent = column.name;
            label.setAttribute('for', column.name);

            const input = document.createElement('input');
            input.type = 'text';
            input.id = column.name;
            input.name = column.name;

            inputGroup.appendChild(label);
            inputGroup.appendChild(input);
            formFields.appendChild(inputGroup);
        });

        // Открываем модальное окно
        modal.style.display = 'block';
    });

    // Закрываем модальное окно при нажатии на крестик
    closeModalButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Закрываем модальное окно при клике вне его области
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
