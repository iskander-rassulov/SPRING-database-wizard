document.addEventListener('DOMContentLoaded', () => {
    const switchDbButton = document.querySelector('.switch-db');
    const dbInfoElement = document.querySelector('.db-info h2');
    const tablesListElement = document.querySelector('.tables-list');

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
        // Формируем объект с данными, аналогичный ConnectionRequest
        const requestData = { host, port: Number(port), dbName, username, password };

        try {
            const response = await fetch('/api/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const tableNames = await response.json();
                // Очищаем меню и добавляем полученные таблицы
                tablesListElement.innerHTML = '';
                tableNames.forEach(name => {
                    const li = document.createElement('li');
                    li.textContent = name;
                    li.addEventListener('click', () => {

                        // Здесь можно реализовать логику просмотра таблицы
                    });
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

    // Обработка нажатия на "Switch Database"
    switchDbButton.addEventListener('click', () => {
        // Возвращаемся на форму, например, index.html
        window.location.href = 'index.html';
    });
});
