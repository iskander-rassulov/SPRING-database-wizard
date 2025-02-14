document.addEventListener('DOMContentLoaded', () => {
    const tableContainer = document.querySelector('.table-container');

    tableContainer.addEventListener('click', (event) => {
        const cell = event.target;
        if (cell.tagName !== 'TD' || cell.classList.contains('editing')) return;

        const row = cell.parentElement;
        const table = cell.closest('table');
        const tableName = document.querySelector('#table-title').textContent.trim();
        const columnIndex = [...row.children].indexOf(cell);
        const headerCells = table.querySelector('thead').rows[0].cells;
        const columnName = headerCells[columnIndex].textContent.trim();
        const primaryKey = row.dataset.primaryKey;
        const originalValue = cell.textContent.trim();

        if (!primaryKey) return;

        // Создаем input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalValue;
        input.classList.add('edit-input');
        cell.textContent = '';
        cell.appendChild(input);
        cell.classList.add('editing');

        input.focus();

        // Флаг, чтобы избежать двойного вызова
        let updated = false;

        function saveEdit() {
            if (updated) return; // Если уже обновлено — не выполняем повторно
            updated = true;

            const newValue = input.value.trim();
            cell.classList.remove('editing');
            cell.textContent = newValue;

            if (newValue !== originalValue) {
                updateCell(tableName, columnName, primaryKey, newValue);
            }
        }

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                saveEdit();
            }
        });
    });

    async function updateCell(tableName, columnName, rowId, newValue) {
        try {
            const requestData = {
                host: localStorage.getItem('host'),
                port: Number(localStorage.getItem('port')),
                dbName: localStorage.getItem('dbName'),
                username: localStorage.getItem('username'),
                password: localStorage.getItem('password'),
                tableName,
                columnName,
                rowId,
                newValue
            };

            const response = await fetch('/api/update-cell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            console.log(`Updated ${columnName} in ${tableName} for row ${rowId}`);
        } catch (error) {
            console.error('Error updating cell:', error);
        }
    }
});
