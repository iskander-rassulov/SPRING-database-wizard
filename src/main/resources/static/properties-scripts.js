document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('connectionForm');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Считываем значения из полей формы
        const host = document.getElementById('host').value.trim();
        const port = parseInt(document.getElementById('port').value.trim(), 10);
        const dbName = document.getElementById('dbName').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        const requestData = { host, port, dbName, username, password };

        try {
            const response = await fetch('/api/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                // Сохраняем все параметры
                localStorage.setItem('host', host);
                localStorage.setItem('port', port);
                localStorage.setItem('dbName', dbName);
                localStorage.setItem('username', username);
                localStorage.setItem('password', password);

                // Переход к обзору базы
                window.location.href = 'database-view.html';
            }
            else {
                // Иначе показываем сообщение об ошибке
                const errorMessage = await response.text();
                alert(`Error: ${errorMessage}`);
            }
        } catch (error) {
            alert(`Network error: ${error.message}`);
        }
    });
});
