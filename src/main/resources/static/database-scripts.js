document.addEventListener('DOMContentLoaded', () => {
    const switchDbButton = document.querySelector('.switch-db');
    const tables = document.querySelectorAll('.tables-list li');

    // Example: handling click on "Switch Database" button
    switchDbButton.addEventListener('click', () => {
        alert('Switching database!');
        // Here you could redirect to another page or open the connection form:
        // window.location.href = '/properties.html';
    });

    // Example: handling click on table items
    tables.forEach(tableItem => {
        tableItem.addEventListener('click', () => {
            alert(`You selected: ${tableItem.textContent}`);
            // In a real app, you might fetch table data from the server here
        });
    });
});
