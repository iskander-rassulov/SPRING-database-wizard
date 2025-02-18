document.getElementById('delete-button').addEventListener('click', function() {
    document.getElementById('delete-button').style.display = 'none';
    document.getElementById('cancel-delete-button').style.display = 'inline-block';

    // Добавляем новую колонку
    const table = document.querySelector('.table-container table');
    if (table) {
        const newColumnName = 'New Column';
        const headers = table.querySelectorAll('th');
        const newHeader = document.createElement('th');
        newHeader.textContent = newColumnName;
        headers[headers.length - 1].parentNode.appendChild(newHeader);

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const newCell = document.createElement('td');
            newCell.textContent = '';
            row.appendChild(newCell);
        });
    }
});


document.getElementById('cancel-delete-button').addEventListener('click', function() {
    document.getElementById('cancel-delete-button').style.display = 'none';
    document.getElementById('delete-button').style.display = 'inline-block';

    // Удаляем новую колонку
    const table = document.querySelector('.table-container table');
    if (table) {
        const headers = table.querySelectorAll('th');
        if (headers.length > 0) {
            headers[headers.length - 1].remove();
        }

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            if (row.cells.length > 0) {
                row.cells[row.cells.length - 1].remove();
            }
        });
    }
});
